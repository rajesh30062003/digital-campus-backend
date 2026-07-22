import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import { resolveTenant } from "../middleware/tenant";
import {
  onboardInstitution,
  getSubscriptionPlans,
  superGetAllInstitutions,
  superUpdateInstitution,
  superDeleteInstitution,
  tenantUpdateConfig,
  processBillingPayment,
  getTenantUsageAnalytics
} from "../controllers/saasController";

const router = Router();

// Public onboarding & subscription routes
router.post("/register", onboardInstitution);
router.get("/plans", getSubscriptionPlans);

// Protected tenant-scoped metrics & settings
router.patch("/config", protect, restrictTo("admin"), resolveTenant, tenantUpdateConfig);
router.post("/billing/pay", protect, restrictTo("admin"), resolveTenant, processBillingPayment);
router.get("/analytics", protect, restrictTo("admin", "superadmin"), resolveTenant, getTenantUsageAnalytics);

// Super Super Admin system routes
router.get("/institutions", protect, restrictTo("superadmin"), superGetAllInstitutions);
router.patch("/institutions/:id", protect, restrictTo("superadmin"), superUpdateInstitution);
router.delete("/institutions/:id", protect, restrictTo("superadmin"), superDeleteInstitution);

export default router;
