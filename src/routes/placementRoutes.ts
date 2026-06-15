import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getPlacementStats,
} from "../controllers/placementController";

const router = Router();

router.use(protect);

// Companies
router.get("/companies", getAllCompanies);
router.post("/companies", restrictTo("admin"), createCompany);
router.patch("/companies/:id", restrictTo("admin"), updateCompany);

// Jobs
router.get("/jobs", getAllJobs);
router.get("/jobs/:id", getJobById);
router.post("/jobs", restrictTo("admin"), createJob);
router.patch("/jobs/:id", restrictTo("admin"), updateJob);

// Applications
router.post("/jobs/:jobId/apply", restrictTo("student"), applyForJob);
router.get("/applications/my", restrictTo("student"), getMyApplications);
router.get("/jobs/:jobId/applications", restrictTo("admin"), getJobApplications);
router.patch("/applications/:id/status", restrictTo("admin"), updateApplicationStatus);

// Stats
router.get("/stats", getPlacementStats);

export default router;
