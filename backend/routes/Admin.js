import express from "express";
import { getStats, getUser, listAuditLog, listPayments, listUsers, updateUser } from "../controllers/Admin.js";
import { isAdmin } from "../middleware/admin.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Every admin route requires a signed-in user with the admin role
router.use(auth, isAdmin);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.get("/payments", listPayments);
router.get("/audit-log", listAuditLog);

export default router;
