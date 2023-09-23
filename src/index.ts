import router from "./routes/gmailAPI";

const express = require("express");

const app = express();

const port = 3002;

app.listen(port, () => console.log(`server started on port ${port}`));

app.use("/api", router);
