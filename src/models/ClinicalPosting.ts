import mongoose, { Document, Schema } from "mongoose";

export interface IClinicalPosting extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  department: string; // e.g., Repertory, Materia Medica, Practice of Medicine, Gynecology
  startDate: Date;
  endDate: Date;
  supervisor: mongoose.Types.ObjectId; // faculty in-charge
  attendanceCount: number;
  totalDays: number;
  performanceGrade?: string; // e.g., A, B, C, F
  feedback?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clinicalPostingSchema = new Schema<IClinicalPosting>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    supervisor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attendanceCount: { type: Number, required: true, default: 0, min: 0 },
    totalDays: { type: Number, required: true, default: 15 },
    performanceGrade: { type: String, trim: true },
    feedback: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clinicalPostingSchema.index({ student: 1 });
clinicalPostingSchema.index({ supervisor: 1 });
clinicalPostingSchema.index({ department: 1 });

export const ClinicalPosting = mongoose.model<IClinicalPosting>("ClinicalPosting", clinicalPostingSchema);
