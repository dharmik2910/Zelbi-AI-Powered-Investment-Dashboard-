import express from "express";
import {
    createUser,
    deleteUser,
    deleteUserAlert,
    exportPayments,
    exportUsers,
    getStats,
    getUser,
    listAuditLog,
    listPayments,
    listUsers,
    sendUserPasswordReset,
    updateUser,
} from "../controllers/Admin.js";
import { isAdmin } from "../middleware/admin.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Every admin route requires a signed-in user with the admin role
router.use(auth, isAdmin);

router.get("/stats", getStats);

router.get("/users", listUsers);
router.get("/users/export", exportUsers);
router.post("/users", createUser);
router.get("/users/:id", getUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/password-reset", sendUserPasswordReset);
router.delete("/users/:id/alerts/:alertId", deleteUserAlert);

router.get("/payments", listPayments);
router.get("/payments/export", exportPayments);

router.get("/audit-log", listAuditLog);

export default router;
