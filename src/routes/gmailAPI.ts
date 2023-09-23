import express from "express";
import readInboxContent from "../controllers/gmailAPI";
const router = express.Router();

router.get("/fetch/:email", readInboxContent);

export default router;
