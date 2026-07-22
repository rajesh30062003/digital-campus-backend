import mongoose, { Document, Schema } from "mongoose";

export interface IPatient extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  contact?: string;
  address?: string;
  caseNumber: string;
  type: "OPD" | "IPD";
  department: string; // e.g., Materia Medica, Repertory, Practice of Medicine
  status: "active" | "discharged" | "referred";
  admissionDate: Date;
  dischargeDate?: Date;
  wardNo?: string;
  bedNo?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    contact: { type: String, trim: true },
    address: { type: String, trim: true },
    caseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, required: true, enum: ["OPD", "IPD"], default: "OPD" },
    department: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ["active", "discharged", "referred"], default: "active" },
    admissionDate: { type: Date, required: true, default: Date.now },
    dischargeDate: { type: Date },
    wardNo: { type: String, trim: true },
    bedNo: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

patientSchema.index({ caseNumber: 1 });
patientSchema.index({ department: 1 });
patientSchema.index({ type: 1, status: 1 });

export const Patient = mongoose.model<IPatient>("Patient", patientSchema);
