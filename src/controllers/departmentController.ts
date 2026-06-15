import { Request, Response } from "express";
import { Department } from "../models/Department";
import { User } from "../models/User";
import { Course } from "../models/Course";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// GET /api/departments
export const getAllDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await Department.find({ isActive: true })
    .populate("hod", "name email")
    .sort({ name: 1 });

  // Enrich with student/faculty/course counts
  const enriched = await Promise.all(
    departments.map(async (dept) => {
      const [students, faculty, courses] = await Promise.all([
        User.countDocuments({ role: "student", department: dept.name, isActive: true }),
        User.countDocuments({ role: "faculty", department: dept.name, isActive: true }),
        Course.countDocuments({ department: dept.name, isActive: true }),
      ]);
      return { ...dept.toObject(), totalStudents: students, totalFaculty: faculty, totalCourses: courses };
    })
  );

  res.json({ success: true, data: { departments: enriched } });
});

// GET /api/departments/:id
export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findById(req.params.id).populate("hod", "name email avatar");
  if (!dept) throw new AppError("Department not found", 404);
  res.json({ success: true, data: { department: dept } });
});

// POST /api/departments  (admin)
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { name, code, description, hod } = req.body;
  const dept = await Department.create({ name, code, description, hod });
  res.status(201).json({ success: true, data: { department: dept } });
});

// PATCH /api/departments/:id  (admin)
export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate("hod", "name email");
  if (!dept) throw new AppError("Department not found", 404);
  res.json({ success: true, data: { department: dept } });
});

// DELETE /api/departments/:id  (admin)
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!dept) throw new AppError("Department not found", 404);
  res.json({ success: true, message: "Department deactivated" });
});
