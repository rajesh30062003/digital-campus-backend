import mongoose, { Document, Schema } from "mongoose";

// ── Exam ──────────────────────────────────────────────────────────────────────
export interface IExam extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: "internal" | "semester" | "practical" | "viva";
  course: mongoose.Types.ObjectId;
  department: string;
  semester: number;
  session: string;
  date: Date;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    title:        { type: String, required: true, trim: true },
    type:         { type: String, enum: ["internal", "semester", "practical", "viva"], required: true },
    course:       { type: Schema.Types.ObjectId, ref: "Course", required: true },
    department:   { type: String, required: true },
    semester:     { type: Number, required: true },
    session:      { type: String, required: true },
    date:         { type: Date, required: true },
    totalMarks:   { type: Number, required: true, min: 1 },
    passingMarks: { type: Number, required: true },
    isPublished:  { type: Boolean, default: false },
    createdBy:    { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// No duplicates — unique compound indexes
examSchema.index({ course: 1, type: 1 });
examSchema.index({ department: 1, semester: 1, session: 1 });

export const Exam = mongoose.model<IExam>("Exam", examSchema);

// ── Marks ─────────────────────────────────────────────────────────────────────
export interface IMarks extends Document {
  _id: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  marksObtained: number;
  grade: string;
  remarks?: string;
  enteredBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gradeFromPercent = (pct: number): string => {
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B+";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
};

const marksSchema = new Schema<IMarks>(
  {
    exam:          { type: Schema.Types.ObjectId, ref: "Exam",   required: true },
    student:       { type: Schema.Types.ObjectId, ref: "User",   required: true },
    course:        { type: Schema.Types.ObjectId, ref: "Course", required: true },
    marksObtained: { type: Number, required: true, min: 0 },
    grade:         { type: String, default: "F" },
    remarks:       { type: String },
    enteredBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Prevent duplicate marks for same student in same exam
marksSchema.index({ exam: 1, student: 1 }, { unique: true });
marksSchema.index({ student: 1, course: 1 });

marksSchema.pre("save", async function (next) {
  if (this.isModified("marksObtained")) {
    const exam = await Exam.findById(this.exam);
    if (exam) {
      this.grade = gradeFromPercent((this.marksObtained / exam.totalMarks) * 100);
    }
  }
  next();
});

export const Marks = mongoose.model<IMarks>("Marks", marksSchema);
