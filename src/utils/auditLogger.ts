import { AuditLog } from "../models/AuditLog";
import mongoose from "mongoose";

interface LogAuditOptions {
  user?: mongoose.Types.ObjectId | string;
  userName?: string;
  userRole?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const logAudit = async (options: LogAuditOptions): Promise<void> => {
  try {
    const { user, userName, userRole, action, details = {}, ipAddress } = options;
    
    await AuditLog.create({
      user: user ? new mongoose.Types.ObjectId(user.toString()) : undefined,
      userName,
      userRole,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    // Avoid interrupting main application transactions on logging failure
    console.error("⚠️  Failed to create audit log entry:", error);
  }
};
