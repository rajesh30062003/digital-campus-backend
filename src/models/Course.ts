import mongoose, { Document, Schema } from "mongoose";

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  code: string;
  description: string;
  department: string;
  semester: number;
  credits: number;
  faculty: mongoose.Types.ObjectId;
  enrolledStudents: mongoose.Types.ObjectId[];
  schedule: { day: string; startTime: string; endTime: string; room: string; }[];
  syllabus?: string;
  maxEnrollment: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title:            { type: String, required: true, trim: true },
    code:             { type: String, required: true, unique: true, uppercase: true, trim: true },
    description:      { type: String, required: true },
    department:       { type: String, required: true },
    semester:         { type: Number, required: true, min: 1, max: 10 },
    credits:          { type: Number, required: true, min: 1, max: 6 },
    faculty:          { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "User" }],
    schedule: [{
      day:       { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
      startTime: String,
      endTime:   String,
      room:      String,
    }],
    syllabus:      { type: String },
    maxEnrollment: { type: Number, default: 60 },
    isActive:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Only compound index — code already has unique:true so no extra index needed
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ faculty: 1 });

export const Course = mongoose.model<ICourse>("Course", courseSchema);
