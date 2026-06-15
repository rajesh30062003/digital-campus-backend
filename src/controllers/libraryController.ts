import { Request, Response } from "express";
import { Book, BookIssue } from "../models/Library";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

const FINE_PER_DAY = 2; // ₹2 per day

// ── Books ─────────────────────────────────────────────────────────────────────

export const getAllBooks = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, page, limit } = req.query;
  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title:  { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { isbn:   { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate(Book, filter, {
    page:  Number(page)  || 1,
    limit: Number(limit) || 20,
    sort:  { title: 1 },
  });

  // paginate returns key "books" (Book → books) — correct for frontend
  res.json({ success: true, ...result });
});

export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError("Book not found", 404);
  res.json({ success: true, data: { book } });
});

export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.create({
    ...req.body,
    availableCopies: req.body.availableCopies ?? req.body.totalCopies,
  });
  res.status(201).json({ success: true, data: { book } });
});

export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!book) throw new AppError("Book not found", 404);
  res.json({ success: true, data: { book } });
});

export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  await Book.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Book removed" });
});

// ── Issues ────────────────────────────────────────────────────────────────────

export const issueBook = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.body.bookId);
  if (!book) throw new AppError("Book not found", 404);
  if (book.availableCopies < 1) throw new AppError("No copies available", 400);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (Number(req.body.dueDays) || 14));

  const issue = await BookIssue.create({
    book:     book._id,
    student:  req.body.studentId,
    issuedBy: (req as any).user._id,
    dueDate,
  });

  book.availableCopies -= 1;
  await book.save();

  res.status(201).json({ success: true, data: { issue } });
});

export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const issue = await BookIssue.findById(req.params.id);
  if (!issue) throw new AppError("Issue record not found", 404);
  if (issue.status === "returned") throw new AppError("Book already returned", 400);

  const returnDate = new Date();
  issue.returnDate = returnDate;

  if (returnDate > issue.dueDate) {
    const overdueDays = Math.ceil(
      (returnDate.getTime() - issue.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    issue.fine = overdueDays * FINE_PER_DAY;
  }

  issue.status = "returned";
  await issue.save();

  const book = await Book.findById(issue.book);
  if (book) { book.availableCopies += 1; await book.save(); }

  res.json({ success: true, data: { issue } });
});

export const getMyIssues = asyncHandler(async (req: Request, res: Response) => {
  const issues = await BookIssue.find({ student: (req as any).user._id })
    .populate("book", "title author isbn")
    .sort({ createdAt: -1 });

  // Auto-mark overdue
  const now = new Date();
  for (const issue of issues) {
    if (issue.status === "issued" && now > issue.dueDate) {
      issue.status = "overdue";
      await issue.save();
    }
  }

  res.json({ success: true, data: { issues } });
});

export const getAllIssues = asyncHandler(async (req: Request, res: Response) => {
  const { status, page, limit } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  // Use explicit query instead of paginate so we can name the key "issues"
  // (paginate would generate "bookissues" from BookIssue.modelName which breaks frontend)
  const pg  = Number(page)  || 1;
  const lim = Number(limit) || 20;
  const skip = (pg - 1) * lim;

  const [issues, total] = await Promise.all([
    BookIssue.find(filter)
      .populate("book",    "title author isbn")
      .populate("student", "name studentId email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim),
    BookIssue.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / lim);

  res.json({
    success: true,
    data: { issues },
    pagination: {
      total,
      page:       pg,
      limit:      lim,
      totalPages,
      hasNext: pg < totalPages,
      hasPrev: pg > 1,
    },
  });
});

export const getLibraryStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalBooks, issuedCount, overdueCount, totalFines] = await Promise.all([
    Book.countDocuments({ isActive: true }),
    BookIssue.countDocuments({ status: "issued" }),
    BookIssue.countDocuments({ status: "overdue" }),
    BookIssue.aggregate([
      { $match: { fine: { $gt: 0 }, finePaid: false } },
      { $group: { _id: null, total: { $sum: "$fine" } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalBooks,
      issuedCount,
      overdueCount,
      pendingFines: totalFines[0]?.total || 0,
    },
  });
});
