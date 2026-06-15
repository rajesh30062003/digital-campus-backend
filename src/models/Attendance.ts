import mongoose, { Document, Schema } from "mongoose";

export interface IAttendanceRecord {
  student: mongoose.Types.ObjectId;
  status: "present" | "absent" | "late" | "excused";
  remark?: string;
}

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  date: Date;
  records: IAttendanceRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  student: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status:  { type: String, enum: ["present", "absent", "late", "excused"], required: true },
  remark:  String,
});

const attendanceSchema = new Schema<IAttendance>(
  {
    course:  { type: Schema.Types.ObjectId, ref: "Course", required: true },
    faculty: { type: Schema.Types.ObjectId, ref: "User",   required: true },
    date:    { type: Date, required: true },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// Unique constraint prevents duplicate attendance for same course on same day
attendanceSchema.index({ course: 1, date: 1 }, { unique: true });
// For student-centric queries
attendanceSchema.index({ "records.student": 1 });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
