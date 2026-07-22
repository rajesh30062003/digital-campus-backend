import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getSecurityAuditSummary,
  createDatabaseBackup,
  restoreDatabaseBackup,
  getDisasterRecoveryStatus,
} from "../controllers/securityController";

const router = Router();

// Protect all routes with JWT and Admin/Superadmin privilege
router.use(protect, restrictTo("admin", "superadmin"));

// Security Audit & Overview
router.get("/summary", getSecurityAuditSummary);

// Backup & Disaster Recovery
router.post("/backup", createDatabaseBackup);
router.post("/restore", restoreDatabaseBackup);
router.get("/disaster-recovery/status", getDisasterRecoveryStatus);

export default router;
