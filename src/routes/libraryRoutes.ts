import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth";
import {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getMyIssues,
  getAllIssues,
  getLibraryStats,
} from "../controllers/libraryController";

const router = Router();

router.use(protect);

// Books – everyone can browse
router.get("/books", getAllBooks);
router.get("/books/:id", getBookById);

// Books – admin only
router.post("/books", restrictTo("admin"), createBook);
router.patch("/books/:id", restrictTo("admin"), updateBook);
router.delete("/books/:id", restrictTo("admin"), deleteBook);

// Issues
router.get("/issues/my", getMyIssues);
router.get("/issues", restrictTo("admin"), getAllIssues);
router.post("/issues", restrictTo("admin"), issueBook);
router.patch("/issues/:id/return", restrictTo("admin"), returnBook);
router.get("/stats", restrictTo("admin"), getLibraryStats);

export default router;
