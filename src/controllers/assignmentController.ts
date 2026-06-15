import { Request, Response } from "express";
import { Assignment } from "../models/Assignment";
import { Course } from "../models/Course";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

// GET /api/courses/:courseId/assignments
export const getCourseAssignments = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const assignments = await Assignment.find({
      course: req.params.courseId,
      ...(user.role === "student" && { isPublished: true }),
    }).populate("faculty", "name");

    res.json({ success: true, data: { assignments } });
  }
);

// GET /api/assignments/:id
export const getAssignmentById = asyncHandler(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const assignment = await Assignment.findById(req.params.id)
      .populate("faculty", "name email")
      .populate("course", "title code");

    if (!assignment) throw new AppError("Assignment not found", 404);

    // Students only see their own submission
    if (user.role === "student") {
      const mySubmission = assignment.submissions.find(
        (s) => s.student.toString() === user._id.toString()
      );
      return res.json({
        success: true,
        data: {
          assignment: {
            ...assignment.toObject(),
            submissions: mySubmission ? [mySubmission] : [],
          },
        },
      });
    }

    res.json({ success: true, data: { assignment } });
  }
);

// POST /api/courses/:courseId/assignments  (faculty)
export const createAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new AppError("Course not found", 404);

    if (course.faculty.toString() !== (req as any).user._id.toString()) {
      throw new AppError("Only the course faculty can create assignments", 403);
    }

    const assignment = await Assignment.create({
      ...req.body,
      course: req.params.courseId,
      faculty: (req as any).user._id,
    });

    res.status(201).json({ success: true, data: { assignment } });
  }
);

// PATCH /api/assignments/:id  (faculty)
export const updateAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError("Assignment not found", 404);

    if (assignment.faculty.toString() !== (req as any).user._id.toString()) {
      throw new AppError("Not authorized", 403);
    }

    const updated = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: { assignment: updated } });
  }
);

// POST /api/assignments/:id/submit  (student)
export const submitAssignment = asyncHandler(
  async (req: Request, res: Response) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError("Assignment not found", 404);
    if (!assignment.isPublished) throw new AppError("Assignment is not open", 400);

    const studentId = (req as any).user._id;
    const alreadySubmitted = assignment.submissions.some(
      (s) => s.student.toString() === studentId.toString()
    );
    if (alreadySubmitted) throw new AppError("Already submitted", 409);

    const isLate = new Date() > assignment.dueDate;
    assignment.submissions.push({
      student: studentId,
      content: req.body.content,
      fileUrl: req.body.fileUrl,
      submittedAt: new Date(),
      status: isLate ? "late" : "submitted",
    });

    await assignment.save();
    res.json({ success: true, message: isLate ? "Submitted (late)" : "Submitted successfully" });
  }
);

// PATCH /api/assignments/:id/grade/:studentId  (faculty)
export const gradeSubmission = asyncHandler(
  async (req: Request, res: Response) => {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) throw new AppError("Assignment not found", 404);

    if (assignment.faculty.toString() !== (req as any).user._id.toString()) {
      throw new AppError("Not authorized", 403);
    }

    const submission = assignment.submissions.find(
      (s) => s.student.toString() === req.params.studentId
    );
    if (!submission) throw new AppError("Submission not found", 404);

    submission.grade = req.body.grade;
    submission.feedback = req.body.feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = (req as any).user._id;
    submission.status = "graded";

    await assignment.save();
    res.json({ success: true, message: "Graded successfully" });
  }
);
