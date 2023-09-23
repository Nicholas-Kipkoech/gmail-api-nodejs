import { Request, Response } from "express";

const axios = require("axios");
const dotenv = require("dotenv");
const qs = require("qs");

dotenv.config();

const getAccessToken = async () => {
  const data = qs.stringify({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    refresh_token: process.env.REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const config = {
    method: "post",
    url: "https://accounts.google.com/o/oauth2/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };
  let accessToken = "";

  await axios(config)
    .then(async function (response: any) {
      accessToken = await response.data.access_token;
    })
    .catch(function (error: any) {
      console.log(error);
    });

  return accessToken;
};

const searchEmail = async (searchItem: string) => {
  const access_token = await getAccessToken();
  const config1 = {
    method: "get",
    url:
      "https://www.googleapis.com/gmail/v1/users/me/messages?q=from:" +
      searchItem,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };
  let threadId = "";
  await axios(config1)
    .then(async function (response: any) {
      threadId = await response.data["messages"][0].id;
    })
    .catch(function (error: Error) {
      console.log(error);
    });
  return threadId;
};

const readGmailContent = async (messageId: string) => {
  const access_token = await getAccessToken();
  const config = {
    method: "get",
    url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  };

  let data = {};

  await axios(config)
    .then(async function (response: any) {
      data = await response.data;
    })
    .catch(function (error: Error) {
      console.log(error);
    });
  return data;
};
const readInboxContent = async (req: Request, res: Response) => {
  try {
    const email = req.params.email;
    const threadId = await searchEmail(email);
    const message: any = await readGmailContent(threadId);

    let from = "";
    let date = "";
    let subject = "";
    let body = "";
    let to = "";

    // Check if message.headers is an array before iterating

    if (Array.isArray(message?.payload.headers)) {
      for (const header of message?.payload.headers) {
        if (header.name === "From") {
          from = header.value;
        } else if (header.name === "Subject") {
          subject = header.value;
        } else if (header.name === "Date") {
          date = header.value;
        } else if (header.name === "To") {
          to = header.value;
        }
      }
    }

    // Prioritize message.payload.body.data if parts are not available
    if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
          body = part.body.data;
          // Decode the body if it's base64 encoded
          body = Buffer.from(body, "base64").toString("utf-8");
          break; // Assuming the first part containing text is the body
        }
      }
    } else if (message.payload.body.data) {
      body = message.payload.body.data;
      // Decode the body if it's base64 encoded
      body = Buffer.from(body, "base64").toString("utf-8");
    } else {
      // Handle the case when there is no text content available
      body = "No text content available";
    }

    return res.status(200).json({
      message: {
        to,
        from,
        date,
        subject,
        body,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

export default readInboxContent;
