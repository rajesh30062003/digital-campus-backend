import { Router } from "express";
import { protect } from "../middleware/auth";
import { upload, uploadFile } from "../controllers/uploadController";

const router = Router();

router.use(protect);

router.post("/", upload.single("file"), uploadFile);

export default router;
