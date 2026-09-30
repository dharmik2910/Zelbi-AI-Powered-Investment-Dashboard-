import express from "express";
import {
    addTransaction,
    deleteTransaction,
    getPortfolio,
    getTaxSummary,
    importTransactions,
    listTransactions,
    updateTransaction,
} from "../controllers/Portfolio.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getPortfolio);
router.get("/transactions", auth, listTransactions);
router.post("/transactions", auth, addTransaction);
router.post("/transactions/import", auth, importTransactions);
router.put("/transactions/:id", auth, updateTransaction);
router.delete("/transactions/:id", auth, deleteTransaction);
router.get("/tax", auth, getTaxSummary);

export default router;
