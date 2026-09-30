import express from "express";
import { addHolding, deleteHolding, getPortfolio, updateHolding } from "../controllers/Portfolio.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getPortfolio);
router.post("/holdings", auth, addHolding);
router.put("/holdings/:id", auth, updateHolding);
router.delete("/holdings/:id", auth, deleteHolding);

export default router;
