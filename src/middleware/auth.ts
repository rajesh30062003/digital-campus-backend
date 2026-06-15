import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, UserRole } from "../models/User";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Not authenticated — provide a Bearer token", 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded: jwt.JwtPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    } catch {
      throw new AppError("Token is invalid or expired", 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new AppError("User no longer exists", 401);
    if (!user.isActive) throw new AppError("Account is deactivated", 403);

    (req as any).user = user;
    next();
  }
);

export const restrictTo = (...roles: UserRole[]) =>
  (_req: Request, __res: Response, next: NextFunction) => {
    const user = (_req as any).user;
    if (!roles.includes(user.role)) {
      return next(new AppError("You don't have permission to do this", 403));
    }
    next();
  };
