import { Request, Response } from "express";
import { Attendance } from "../models/Attendance";
import { Course } from "../models/Course";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// POST /api/courses/:courseId/attendance  (faculty)
export const markAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (course.faculty.toString() !== (req as any).user._id.toString()) {
      throw new AppError("Only course faculty can mark attendance", 403);
    }

    const date = new Date(req.body.date || Date.now());
    date.setHours(0, 0, 0, 0);

    // Upsert: update existing or create new
    const attendance = await Attendance.findOneAndUpdate(
      { course: req.params.courseId, date },
      {
        course: req.params.courseId,
        faculty: (req as any).user._id,
        date,
        records: req.body.records,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: { attendance } });
  }
);

// GET /api/courses/:courseId/attendance  (faculty)
export const getCourseAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to } = req.query;
    const filter: Record<string, unknown> = { course: req.params.courseId };

    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>).$gte = new Date(from as string);
      if (to) (filter.date as Record<string, unknown>).$lte = new Date(to as string);
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate("records.student", "name studentId");

    res.json({ success: true, data: { records } });
  }
);

// GET /api/courses/:courseId/attendance/my  (student)
export const getMyAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const studentId = (req as any).user._id;

    const records = await Attendance.find({
      course: req.params.courseId,
      "records.student": studentId,
    }).sort({ date: -1 });

    const summary = records.map((r) => {
      const record = r.records.find(
        (rec) => rec.student.toString() === studentId.toString()
      );
      return { date: r.date, status: record?.status };
    });

    const total = summary.length;
    const present = summary.filter((s) => s.status === "present" || s.status === "late").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      success: true,
      data: { records: summary, stats: { total, present, percentage } },
    });
  }
);

// GET /api/courses/:courseId/attendance/stats  (faculty)
export const getAttendanceStats = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.courseId).populate(
      "enrolledStudents",
      "name studentId"
    );
    if (!course) throw new AppError("Course not found", 404);

    const allAttendance = await Attendance.find({ course: req.params.courseId });
    const totalClasses = allAttendance.length;

    const studentStats = course.enrolledStudents.map((student: any) => {
      const present = allAttendance.reduce((count, session) => {
        const record = session.records.find(
          (r) => r.student.toString() === student._id.toString()
        );
        return count + (record && (record.status === "present" || record.status === "late") ? 1 : 0);
      }, 0);

      return {
        student: { _id: student._id, name: student.name, studentId: student.studentId },
        present,
        total: totalClasses,
        percentage: totalClasses > 0 ? Math.round((present / totalClasses) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: { totalClasses, studentStats },
    });
  }
);
