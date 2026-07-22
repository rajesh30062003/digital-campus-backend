import mongoose, { Document, Schema } from "mongoose";

export type WorkflowType =
  | "admissions"
  | "attendance"
  | "fee_reminders"
  | "result_publication"
  | "certificate_generation"
  | "leave_approval"
  | "notifications"
  | "inventory"
  | "library"
  | "placement"
  | "research"
  | "hr"
  | "payroll"
  | "transport"
  | "hostel"
  | "hospital";

export interface IApprovalStep {
  stepIndex: number;
  roleRequired: string;
  approverName?: string;
  approverEmail?: string;
  approverRole?: string;
  status: "pending" | "approved" | "rejected";
  comments?: string;
  updatedAt?: Date;
  digitalSignature?: {
    signatureHash: string;
    timestamp: Date;
    signedBy: string;
    signerRole: string;
  };
}

export interface INotificationLog {
  channel: "email" | "sms" | "push";
  recipient: string;
  subject: string;
  message: string;
  status: "sent" | "queued" | "failed";
  dispatchedAt: Date;
}

export interface IWorkflowAudit {
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: Date;
  details: string;
  signatureHash?: string;
}

export interface IWorkflowInstance extends Document {
  _id: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  workflowType: WorkflowType;
  title: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  currentStep: number;
  payload: Record<string, any>;
  approvalChain: IApprovalStep[];
  digitalSignature?: {
    isSigned: boolean;
    signatureHash: string;
    signerName: string;
    signerRole: string;
    signedAt: Date;
    documentHash: string;
  };
  notifications: INotificationLog[];
  auditTrail: IWorkflowAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const approvalStepSchema = new Schema<IApprovalStep>({
  stepIndex: { type: Number, required: true },
  roleRequired: { type: String, required: true },
  approverName: { type: String },
  approverEmail: { type: String },
  approverRole: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  comments: { type: String },
  updatedAt: { type: Date },
  digitalSignature: {
    signatureHash: { type: String },
    timestamp: { type: Date },
    signedBy: { type: String },
    signerRole: { type: String },
  },
});

const notificationLogSchema = new Schema<INotificationLog>({
  channel: { type: String, enum: ["email", "sms", "push"], required: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["sent", "queued", "failed"], default: "sent" },
  dispatchedAt: { type: Date, default: Date.now },
});

const workflowAuditSchema = new Schema<IWorkflowAudit>({
  action: { type: String, required: true },
  actorName: { type: String, required: true },
  actorRole: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, required: true },
  signatureHash: { type: String },
});

const workflowInstanceSchema = new Schema<IWorkflowInstance>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "InstitutionConfig" },
    workflowType: {
      type: String,
      required: true,
      enum: [
        "admissions",
        "attendance",
        "fee_reminders",
        "result_publication",
        "certificate_generation",
        "leave_approval",
        "notifications",
        "inventory",
        "library",
        "placement",
        "research",
        "hr",
        "payroll",
        "transport",
        "hostel",
        "hospital",
      ],
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    requesterRole: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected", "completed"],
      default: "pending",
    },
    currentStep: { type: Number, default: 0 },
    payload: { type: Schema.Types.Mixed, default: {} },
    approvalChain: [approvalStepSchema],
    digitalSignature: {
      isSigned: { type: Boolean, default: false },
      signatureHash: { type: String },
      signerName: { type: String },
      signerRole: { type: String },
      signedAt: { type: Date },
      documentHash: { type: String },
    },
    notifications: [notificationLogSchema],
    auditTrail: [workflowAuditSchema],
  },
  { timestamps: true }
);

workflowInstanceSchema.index({ institutionId: 1, workflowType: 1, status: 1 });
workflowInstanceSchema.index({ createdAt: -1 });

export const WorkflowInstance = mongoose.model<IWorkflowInstance>("WorkflowInstance", workflowInstanceSchema);

export interface IWorkflowRule extends Document {
  _id: mongoose.Types.ObjectId;
  institutionId?: mongoose.Types.ObjectId;
  workflowType: WorkflowType;
  name: string;
  description: string;
  triggerEvent: string;
  isEnabled: boolean;
  approvalRoles: string[];
  notificationChannels: ("email" | "sms" | "push")[];
  requiresDigitalSignature: boolean;
  createdAt: Date;
}

const workflowRuleSchema = new Schema<IWorkflowRule>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: "InstitutionConfig" },
    workflowType: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    triggerEvent: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
    approvalRoles: [{ type: String }],
    notificationChannels: [{ type: String, enum: ["email", "sms", "push"] }],
    requiresDigitalSignature: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const WorkflowRule = mongoose.model<IWorkflowRule>("WorkflowRule", workflowRuleSchema);
