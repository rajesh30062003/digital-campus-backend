import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId; // Multi-tenant key
  user?: mongoose.Types.ObjectId;
  userName?: string;
  userRole?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "InstitutionConfig" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    userRole: { type: String },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexes for super fast auditing queries and filtering
auditLogSchema.index({ institutionId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
