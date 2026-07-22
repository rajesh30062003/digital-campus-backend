import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import { getInstitutionConfig, updateInstitutionConfig } from "../controllers/institutionController";

const router = Router();

// Everyone (including logged-out/guest and students) can view configuration
router.get("/config", getInstitutionConfig);

// Only Admins can modify the configuration
router.patch("/config", protect, restrictTo("admin"), updateInstitutionConfig);

export default router;
