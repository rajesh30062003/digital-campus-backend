import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";

// ── Token generation ──────────────────────────────────────────────────────────
const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

// Build the standard auth response — includes BOTH `token` and `accessToken`
// so the frontend (accessToken) and tests (token) both work
const buildAuthResponse = (user: any) => {
  const token = signToken(user._id.toString());
  return {
    success: true,
    token,          // test-expected field
    accessToken: token, // frontend-expected field
    user: {
      id:            user._id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      studentId:     user.studentId  ?? null,
      department:    user.department ?? null,
      semester:      user.semester   ?? null,
      avatar:        user.avatar     ?? null,
      phone:         user.phone      ?? null,
      designation:   user.designation   ?? null,
      qualification: user.qualification ?? null,
      isActive:      user.isActive,
    },
  };
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError("Email and password are required", 400));

    // Must select +password because it has select:false in schema
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user)
      return next(new AppError("Invalid email or password", 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return next(new AppError("Invalid email or password", 401));

    if (!user.isActive)
      return next(new AppError("Your account has been deactivated. Contact admin.", 403));

    res.status(200).json(buildAuthResponse(user));
  }
);

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Public: always creates a student account
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return next(new AppError("Name, email and password are required", 400));
    if (password.length < 6)
      return next(new AppError("Password must be at least 6 characters", 400));

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return next(new AppError("An account with this email already exists", 409));

    const user = await User.create({ name, email: email.toLowerCase().trim(), password, role: "student" });

    res.status(201).json(buildAuthResponse(user));
  }
);

// ── POST /api/auth/create-user ────────────────────────────────────────────────
// Admin only: create any role
export const createUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name, email, password, role,
      department, semester, studentId,
      designation, qualification, experience, phone,
    } = req.body;

    if (!name || !email || !password)
      return next(new AppError("Name, email and password are required", 400));
    if (password.length < 6)
      return next(new AppError("Password must be at least 6 characters", 400));

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
      return next(new AppError("An account with this email already exists", 409));

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || "student",
      department,
      semester,
      studentId: studentId || undefined, // avoid storing empty string in sparse unique field
      designation,
      qualification,
      experience,
      phone,
    });

    res.status(201).json(buildAuthResponse(user));
  }
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: any, res: Response) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);
  res.status(200).json({ success: true, user });
});
