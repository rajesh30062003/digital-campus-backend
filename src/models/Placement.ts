import mongoose, { Document, Schema } from "mongoose";

// ── Company ───────────────────────────────────────────────────────────────────
export interface ICompany extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  logo?: string;
  website?: string;
  industry: string;
  description?: string;
  location: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name:         { type: String, required: true, trim: true },
    logo:         { type: String },
    website:      { type: String },
    industry:     { type: String, required: true },
    description:  { type: String },
    location:     { type: String, required: true },
    contactEmail: { type: String },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

companySchema.index({ industry: 1 });

export const Company = mongoose.model<ICompany>("Company", companySchema);

// ── Job ───────────────────────────────────────────────────────────────────────
export interface IJob extends Document {
  _id: mongoose.Types.ObjectId;
  company: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requirements: string[];
  eligibleBranches: string[];
  minimumCGPA?: number;
  package: string;
  jobType: "full-time" | "internship" | "part-time";
  location: string;
  lastDateToApply: Date;
  interviewDate?: Date;
  status: "open" | "closed" | "completed";
  postedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    company:          { type: Schema.Types.ObjectId, ref: "Company", required: true },
    title:            { type: String, required: true, trim: true },
    description:      { type: String, required: true },
    requirements:     [{ type: String }],
    eligibleBranches: [{ type: String }],
    minimumCGPA:      { type: Number },
    package:          { type: String, required: true },
    jobType:          { type: String, enum: ["full-time", "internship", "part-time"], default: "full-time" },
    location:         { type: String, required: true },
    lastDateToApply:  { type: Date, required: true },
    interviewDate:    { type: Date },
    status:           { type: String, enum: ["open", "closed", "completed"], default: "open" },
    postedBy:         { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, lastDateToApply: -1 });
jobSchema.index({ company: 1 });

export const Job = mongoose.model<IJob>("Job", jobSchema);

// ── Application ────────────────────────────────────────────────────────────────
export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  status: "applied" | "shortlisted" | "interviewed" | "selected" | "rejected";
  interviewDate?: Date;
  feedback?: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    job:          { type: Schema.Types.ObjectId, ref: "Job",  required: true },
    student:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl:    { type: String },
    coverLetter:  { type: String },
    status:       { type: String, enum: ["applied", "shortlisted", "interviewed", "selected", "rejected"], default: "applied" },
    interviewDate:{ type: Date },
    feedback:     { type: String },
    appliedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate applications from same student to same job
applicationSchema.index({ job: 1, student: 1 }, { unique: true });
applicationSchema.index({ student: 1 });

export const Application = mongoose.model<IApplication>("Application", applicationSchema);
