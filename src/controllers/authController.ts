import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import { logAudit } from "../utils/auditLogger";

// ── Token generation ──────────────────────────────────────────────────────────
const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

// Build the standard auth response — includes BOTH `token` and `accessToken`
// as well as `refreshToken` for security rotation
const buildAuthResponse = (user: any) => {
  const token = signToken(user._id.toString());
  const refreshToken = jwt.sign(
    { id: user._id.toString(), type: "refresh" },
    process.env.JWT_SECRET || "fallback_jwt_secret_key_2026",
    { expiresIn: "7d" }
  );

  return {
    success: true,
    token,          // test-expected field
    accessToken: token, // frontend-expected field
    refreshToken,
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
      twoFactorEnabled: user.twoFactorEnabled || false,
    },
  };
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new AppError("Email and password are required", 400));

    // Must select +password and +twoFactorSecret because they have select:false in schema
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password +twoFactorSecret +refreshToken");

    if (!user)
      return next(new AppError("Invalid email or password", 401));

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return next(new AppError(`Account temporarily locked due to multiple failed logins. Try again in ${waitMins} minute(s).`, 429));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        await logAudit({
          user: user._id,
          userName: user.name,
          userRole: user.role,
          action: "ACCOUNT_LOCKED_FAILED_LOGINS",
          details: { email: user.email },
          ipAddress: req.ip,
        });
      }
      await user.save();
      return next(new AppError("Invalid email or password", 401));
    }

    // Reset lockout counters on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    if (!user.isActive)
      return next(new AppError("Your account has been deactivated. Contact admin.", 403));

    // Record session
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 10);
    user.activeSessions = user.activeSessions || [];
    user.activeSessions.unshift({
      sessionId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      createdAt: new Date(),
      lastActive: new Date(),
    });
    // Keep max 10 active sessions
    if (user.activeSessions.length > 10) {
      user.activeSessions = user.activeSessions.slice(0, 10);
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const secret = process.env.JWT_SECRET || "fallback_jwt_secret_key_2026";
      const tempToken = jwt.sign(
        { id: user._id.toString(), purpose: "2fa_pending" },
        secret,
        { expiresIn: "5m" }
      );
      await user.save();

      return res.status(200).json({
        success: true,
        twoFactorRequired: true,
        tempToken,
        message: "Two-Factor Authentication required. Enter code from your authenticator app.",
      });
    }

    // Standard login complete
    await user.save();

    await logAudit({
      user: user._id,
      userName: user.name,
      userRole: user.role,
      action: "USER_LOGIN",
      details: { email: user.email, sessionId },
      ipAddress: req.ip,
    });

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
