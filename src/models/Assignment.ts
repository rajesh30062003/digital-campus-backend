import mongoose, { Document, Schema } from "mongoose";

export interface ISubmission {
  student: mongoose.Types.ObjectId;
  fileUrl?: string;
  content?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  status: "submitted" | "graded" | "late";
}

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  course: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  dueDate: Date;
  totalMarks: number;
  attachments?: string[];
  submissions: ISubmission[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl: String,
  content: String,
  submittedAt: { type: Date, default: Date.now },
  grade: { type: Number, min: 0 },
  feedback: String,
  gradedAt: Date,
  gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["submitted", "graded", "late"], default: "submitted" },
});

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    faculty: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true, min: 1 },
    attachments: [String],
    submissions: [submissionSchema],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, dueDate: 1 });

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema
);
