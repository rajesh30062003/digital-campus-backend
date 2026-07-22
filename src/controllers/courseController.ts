import { Request, Response } from "express";
import { Course } from "../models/Course";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// GET /api/courses
export const getAllCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const { department, semester, faculty, search, page, limit } = req.query;

    const filter: Record<string, unknown> = { isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (faculty) filter.faculty = faculty;
    if (search) filter.title = { $regex: search, $options: "i" };

    const result = await paginate(Course, filter, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      populate: [{ path: "faculty", select: "name email avatar" }],
    });

    res.json({ success: true, ...result });
  }
);

// GET /api/courses/:id
export const getCourseById = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id)
      .populate("faculty", "name email avatar department")
      .populate("enrolledStudents", "name email studentId avatar");

    if (!course) throw new AppError("Course not found", 404);
    res.json({ success: true, data: { course } });
  }
);

// POST /api/courses  (admin/faculty)
export const createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const existing = await Course.findOne({ code: req.body.code });
    if (existing) throw new AppError("Course code already exists", 409);

    const course = await Course.create({
      ...req.body,
      faculty: req.body.faculty || (req as any).user._id,
    });

    res.status(201).json({ success: true, data: { course } });
  }
);

// PATCH /api/courses/:id
export const updateCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError("Course not found", 404);

    const reqUser = (req as any).user;
    if (
      reqUser.role !== "admin" &&
      course.faculty.toString() !== reqUser._id.toString()
    ) {
      throw new AppError("Not authorized to update this course", 403);
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("faculty", "name email");

    res.json({ success: true, data: { course: updated } });
  }
);

// DELETE /api/courses/:id  (admin only)
export const deleteCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!course) throw new AppError("Course not found", 404);
    res.json({ success: true, message: "Course deactivated" });
  }
);

// POST /api/courses/:id/enroll
export const enrollInCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError("Course not found", 404);

    const studentId = (req as any).user._id;

    if (course.enrolledStudents.some((s) => s.toString() === studentId.toString())) {
      throw new AppError("Already enrolled in this course", 409);
    }

    if (course.enrolledStudents.length >= course.maxEnrollment) {
      throw new AppError("Course is full", 400);
    }

    course.enrolledStudents.push(studentId);
    await course.save();

    res.json({ success: true, message: "Enrolled successfully" });
  }
);

// DELETE /api/courses/:id/enroll
export const unenrollFromCourse = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError("Course not found", 404);

    const studentId = (req as any).user._id.toString();
    course.enrolledStudents = course.enrolledStudents.filter(
      (s) => s.toString() !== studentId
    );
    await course.save();

    res.json({ success: true, message: "Unenrolled successfully" });
  }
);

// GET /api/courses/my-courses
export const getMyCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    let courses;

    if (user.role === "faculty") {
      courses = await Course.find({ faculty: user._id, isActive: true }).populate(
        "enrolledStudents",
        "name email studentId"
      );
    } else {
      courses = await Course.find({
        enrolledStudents: user._id,
        isActive: true,
      }).populate("faculty", "name email avatar");
    }

    res.json({ success: true, data: { courses } });
  }
);
