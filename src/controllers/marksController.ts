import { Request, Response } from "express";
import { Exam, Marks } from "../models/Marks";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// ── Exams ─────────────────────────────────────────────────────────────────────

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.create({ ...req.body, createdBy: (req as any).user._id });
  res.status(201).json({ success: true, data: { exam } });
});

export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const { department, semester, courseId } = req.query;
  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (semester) filter.semester = Number(semester);
  if (courseId) filter.course = courseId;

  const exams = await Exam.find(filter)
    .populate("course", "title code")
    .sort({ date: -1 });
  res.json({ success: true, data: { exams } });
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!exam) throw new AppError("Exam not found", 404);
  res.json({ success: true, data: { exam } });
});

export const publishExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await Exam.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
  if (!exam) throw new AppError("Exam not found", 404);
  res.json({ success: true, data: { exam } });
});

// ── Marks ─────────────────────────────────────────────────────────────────────

export const enterMarks = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;
  const { marksData } = req.body; // [{ student, marksObtained, remarks }]

  const exam = await Exam.findById(examId);
  if (!exam) throw new AppError("Exam not found", 404);

  const upserts = marksData.map((m: { student: string; marksObtained: number; remarks?: string }) =>
    Marks.findOneAndUpdate(
      { exam: examId, student: m.student },
      {
        exam: examId,
        student: m.student,
        course: exam.course,
        marksObtained: m.marksObtained,
        remarks: m.remarks,
        enteredBy: (req as any).user._id,
      },
      { upsert: true, new: true, runValidators: true }
    )
  );

  await Promise.all(upserts);
  res.json({ success: true, message: "Marks saved" });
});

export const getMarksByExam = asyncHandler(async (req: Request, res: Response) => {
  const marks = await Marks.find({ exam: req.params.examId })
    .populate("student", "name studentId avatar")
    .sort({ "student.name": 1 });
  res.json({ success: true, data: { marks } });
});

// GET /api/marks/my  (student)
export const getMyMarks = asyncHandler(async (req: Request, res: Response) => {
  const studentId = (req as any).user._id;
  const marks = await Marks.find({ student: studentId })
    .populate("exam", "title type totalMarks passingMarks session semester date isPublished")
    .populate("course", "title code credits")
    .sort({ createdAt: -1 });

  // Only return marks from published exams for students
  const published = marks.filter((m: any) => m.exam?.isPublished);

  // Compute GPA per semester
  const semesterMap: Record<string, { totalCredits: number; weightedPoints: number; marks: typeof published }> = {};
  for (const m of published) {
    const exam = m.exam as any;
    const course = m.course as any;
    if (!exam || !course) continue;
    const key = `${exam.semester || "?"}_${exam.session || "?"}`;
    if (!semesterMap[key]) semesterMap[key] = { totalCredits: 0, weightedPoints: 0, marks: [] };
    const credits = course.credits || 3;
    const gradePoints = gradeToPoints(m.grade);
    semesterMap[key].totalCredits += credits;
    semesterMap[key].weightedPoints += credits * gradePoints;
    semesterMap[key].marks.push(m);
  }

  const semesters = Object.entries(semesterMap).map(([key, val]) => {
    const [semester, session] = key.split("_");
    const sgpa = val.totalCredits > 0 ? +(val.weightedPoints / val.totalCredits).toFixed(2) : 0;
    return { semester, session, sgpa, marks: val.marks };
  });

  const totalCredits = Object.values(semesterMap).reduce((a, b) => a + b.totalCredits, 0);
  const totalWeighted = Object.values(semesterMap).reduce((a, b) => a + b.weightedPoints, 0);
  const cgpa = totalCredits > 0 ? +(totalWeighted / totalCredits).toFixed(2) : 0;

  res.json({ success: true, data: { semesters, cgpa } });
});

function gradeToPoints(grade: string): number {
  const map: Record<string, number> = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, F: 0 };
  return map[grade] ?? 0;
}

// GET /api/marks/analytics  (admin)
export const getMarksAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { department, semester } = req.query;

  const examFilter: Record<string, unknown> = { isPublished: true };
  if (department) examFilter.department = department;
  if (semester) examFilter.semester = Number(semester);

  const exams = await Exam.find(examFilter);
  const examIds = exams.map((e) => e._id);

  const marks = await Marks.find({ exam: { $in: examIds } });

  const gradeDistribution = marks.reduce(
    (acc: Record<string, number>, m) => {
      acc[m.grade] = (acc[m.grade] || 0) + 1;
      return acc;
    },
    {}
  );

  const passCount = marks.filter((m) => m.grade !== "F").length;
  const passRate = marks.length > 0 ? +((passCount / marks.length) * 100).toFixed(1) : 0;

  res.json({ success: true, data: { gradeDistribution, passRate, total: marks.length } });
});
