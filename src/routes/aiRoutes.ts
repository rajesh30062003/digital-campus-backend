import { Router } from "express";
import { protect } from "../middleware/auth";
import {
  chatWithAi,
  analyzeAdmissionChance,
  generateTimetable,
  generateNoticeDraft,
  generateQuestionPaper,
  analyzeResultsAndPredict,
  analyzeFacultyMetrics,
  analyzeAttendance,
  researchAssist,
  simulateOcrAndGenerateReport,
  translateContent,
  generateVoiceResponse,
  smartSearch,
  createAutomatedWorkflow
} from "../controllers/aiController";

const router = Router();

// Apply auth protection to all AI endpoints
router.use(protect);

router.post("/chat", chatWithAi);
router.post("/admission-chance", analyzeAdmissionChance);
router.post("/timetable-generate", generateTimetable);
router.post("/notice-draft", generateNoticeDraft);
router.post("/question-paper", generateQuestionPaper);
router.post("/result-analytics", analyzeResultsAndPredict);
router.post("/faculty-metrics", analyzeFacultyMetrics);
router.post("/attendance-insights", analyzeAttendance);
router.post("/research-assist", researchAssist);
router.post("/ocr", simulateOcrAndGenerateReport);
router.post("/translate", translateContent);
router.post("/voice", generateVoiceResponse);
router.post("/search", smartSearch);
router.post("/workflow", createAutomatedWorkflow);

export default router;
