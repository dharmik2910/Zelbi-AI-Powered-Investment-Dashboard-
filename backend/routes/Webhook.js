import express from "express";
import { brevoWebhook } from "../controllers/Webhook.js";

const router = express.Router();

router.post("/brevo", brevoWebhook);

export default router;
