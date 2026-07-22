import { Router } from "express";
import { login, register, getMe, createUser } from "../controllers/authController";
import {
  generate2FA,
  verify2FA,
  disable2FA,
  login2FA,
  refreshTokenHandler,
  getActiveSessions,
  revokeSession,
} from "../controllers/securityController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.post("/login",       login);
router.post("/register",    register);
router.post("/refresh",     refreshTokenHandler);
router.get("/me",           protect, getMe);

// 2FA Authentication Flow
router.post("/2fa/login",    login2FA);
router.post("/2fa/generate", protect, generate2FA);
router.post("/2fa/verify",   protect, verify2FA);
router.post("/2fa/disable",  protect, disable2FA);

// Session Management
router.get("/sessions",       protect, getActiveSessions);
router.post("/sessions/revoke", protect, revokeSession);

// Admin-only: create faculty/admin accounts
router.post("/create-user", protect, restrictTo("admin"), createUser);

export default router;
