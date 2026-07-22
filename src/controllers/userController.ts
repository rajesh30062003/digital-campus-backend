import { Request, Response } from "express";
import { User } from "../models/User";
import asyncHandler from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { paginate } from "../utils/paginate";

// GET /api/users  (admin only)
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, department, search, page, limit, isActive } = req.query;

  const filter: Record<string, unknown> = {};
  if (role)       filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (search) {
    filter.$or = [
      { name:      { $regex: search, $options: "i" } },
      { email:     { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
    ];
  }

  const result = await paginate(User, filter, {
    page:  Number(page)  || 1,
    limit: Number(limit) || 20,
    sort:  { createdAt: -1 },
  });

  res.json({ success: true, ...result });
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: { user } });
});

// PATCH /api/users/profile  (own)
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const allowed = ["name", "phone", "bio", "avatar", "department", "semester"];
  const updates: Record<string, unknown> = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(
    (req as any).user._id,
    updates,
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: { user } });
});

// PATCH /api/users/:id  (admin only)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const allowed = [
    "name", "role", "department", "semester", "isActive", "isEmailVerified",
    "phone", "bio", "studentId", "designation", "qualification", "experience",
  ];
  const updates: Record<string, unknown> = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, data: { user } });
});

// DELETE /api/users/:id  (admin only) — soft delete
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!user) throw new AppError("User not found", 404);
  res.json({ success: true, message: "User deactivated successfully" });
});

// PATCH /api/users/change-password  (own)
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    throw new AppError("Both currentPassword and newPassword are required", 400);
  if (newPassword.length < 6)
    throw new AppError("New password must be at least 6 characters", 400);

  const user = await User.findById((req as any).user._id).select("+password");
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError("Current password is incorrect", 401);

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password changed successfully" });
});
