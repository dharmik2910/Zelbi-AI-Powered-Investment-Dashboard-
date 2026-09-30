import express from "express";
import { createAlert, deleteAlert, getAlerts } from "../controllers/Alert.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", auth, getAlerts);
router.post("/", auth, createAlert);
router.delete("/:id", auth, deleteAlert);

export default router;
