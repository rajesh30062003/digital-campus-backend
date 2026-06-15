import { Request, Response } from "express";
import { Timetable } from "../models/Timetable";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// GET /api/timetables  (admin)
export const getAllTimetables = asyncHandler(async (_req: Request, res: Response) => {
  const timetables = await Timetable.find({ isActive: true })
    .populate("slots.course", "title code")
    .populate("slots.faculty", "name")
    .sort({ department: 1, semester: 1 });
  res.json({ success: true, data: { timetables } });
});

// GET /api/timetables/my  (student) — returns timetable for student's dept & semester
export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const timetable = await Timetable.findOne({
    department: user.department,
    semester: user.semester,
    isActive: true,
  })
    .populate("slots.course", "title code credits")
    .populate("slots.faculty", "name avatar");

  res.json({ success: true, data: { timetable } });
});

// GET /api/timetables/faculty  (faculty) — returns slots where this faculty is assigned
export const getFacultyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const facultyId = (req as any).user._id;
  const timetables = await Timetable.find({ isActive: true })
    .populate("slots.course", "title code")
    .populate("slots.faculty", "name");

  const filtered = timetables
    .map((tt) => ({
      department: tt.department,
      semester: tt.semester,
      session: tt.session,
      slots: tt.slots.filter(
        (s: any) => s.faculty?._id?.toString() === facultyId.toString() ||
          s.faculty?.toString() === facultyId.toString()
      ),
    }))
    .filter((tt) => tt.slots.length > 0);

  res.json({ success: true, data: { timetables: filtered } });
});

// POST /api/timetables  (admin)
export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const timetable = await Timetable.create(req.body);
  res.status(201).json({ success: true, data: { timetable } });
});

// PATCH /api/timetables/:id  (admin)
export const updateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!timetable) throw new AppError("Timetable not found", 404);
  res.json({ success: true, data: { timetable } });
});

// DELETE /api/timetables/:id  (admin)
export const deleteTimetable = asyncHandler(async (req: Request, res: Response) => {
  await Timetable.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Timetable deleted" });
});
