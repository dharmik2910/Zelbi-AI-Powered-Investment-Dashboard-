import express from "express";
import { getTimeSeries, searchSymbols } from "../controllers/Market.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/time-series", auth, getTimeSeries);
router.get("/search", auth, searchSymbols);

export default router;
