import { Request, Response } from "express";
import { User } from "../models/User";
import { Course } from "../models/Course";
import { Assignment } from "../models/Assignment";
import { Attendance } from "../models/Attendance";
import { Department } from "../models/Department";
import { Application } from "../models/Placement";
import { AuditLog } from "../models/AuditLog";
import asyncHandler from "../utils/asyncHandler";
import { paginate } from "../utils/paginate";

// GET /api/admin/stats
export const getAdminStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalStudents,
    totalFaculty,
    totalAdmins,
    totalCourses,
    totalDepartments,
    totalAssignments,
    placed,
  ] = await Promise.all([
    User.countDocuments({ role: "student", isActive: true }),
    User.countDocuments({ role: "faculty", isActive: true }),
    User.countDocuments({ role: "admin", isActive: true }),
    Course.countDocuments({ isActive: true }),
    Department.countDocuments({ isActive: true }),
    Assignment.countDocuments(),
    Application.countDocuments({ status: "selected" }),
  ]);

  // Attendance % across all courses this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const attendanceRecords = await Attendance.find({ date: { $gte: monthStart } });
  let totalRecords = 0, presentRecords = 0;
  for (const rec of attendanceRecords) {
    for (const r of rec.records) {
      totalRecords++;
      if (r.status === "present" || r.status === "late") presentRecords++;
    }
  }
  const attendancePercentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalStudents,
      totalFaculty,
      totalAdmins,
      totalCourses,
      totalDepartments,
      totalAssignments,
      placed,
      attendancePercentage,
    },
  });
});

// GET /api/admin/charts/student-growth
export const getStudentGrowth = asyncHandler(async (_req: Request, res: Response) => {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleString("default", { month: "short" }) };
  });

  const data = await Promise.all(
    months.map(async ({ year, month, label }) => {
      const count = await User.countDocuments({
        role: "student",
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1),
        },
      });
      return { month: label, students: count };
    })
  );

  res.json({ success: true, data });
});

// GET /api/admin/charts/department-stats
export const getDepartmentStats = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await Department.find({ isActive: true });

  const stats = await Promise.all(
    departments.map(async (dept) => {
      const [students, faculty] = await Promise.all([
        User.countDocuments({ role: "student", department: dept.name, isActive: true }),
        User.countDocuments({ role: "faculty", department: dept.name, isActive: true }),
      ]);
      return { name: dept.code, students, faculty };
    })
  );

  res.json({ success: true, data: stats });
});

// GET /api/admin/charts/attendance-trend
export const getAttendanceTrend = asyncHandler(async (_req: Request, res: Response) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const data = await Promise.all(
    last7Days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const records = await Attendance.find({ date: { $gte: day, $lt: nextDay } });
      let total = 0, present = 0;
      for (const rec of records) {
        for (const r of rec.records) {
          total++;
          if (r.status === "present" || r.status === "late") present++;
        }
      }
      return {
        day: day.toLocaleDateString("en", { weekday: "short" }),
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );

  res.json({ success: true, data });
});

// GET /api/admin/audit-logs
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { action, page, limit } = req.query;
  const filter: Record<string, unknown> = {};
  if (action) filter.action = action;

  const result = await paginate(AuditLog, filter, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sort: { createdAt: -1 },
    populate: [{ path: "user", select: "name email role" }]
  });

  res.json({ success: true, ...result });
});
