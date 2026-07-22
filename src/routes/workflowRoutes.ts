import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  getWorkflows,
  getWorkflowById,
  triggerWorkflow,
  approveOrRejectStep,
  signWorkflowDocument,
  getWorkflowRules,
  seedWorkflows,
} from "../controllers/workflowController";

const router = Router();

router.use(protect);

router.get("/", getWorkflows);
router.get("/rules", getWorkflowRules);
router.post("/seed", seedWorkflows);
router.get("/:id", getWorkflowById);
router.post("/trigger", triggerWorkflow);
router.post("/:id/review", approveOrRejectStep);
router.post("/:id/sign", signWorkflowDocument);

export default router;
