import express from "express";
import { trackPageView } from "../controllers/Analytics.js";

const router = express.Router();

router.post("/pageview", trackPageView);

export default router;
