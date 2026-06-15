import mongoose, { Document, Schema } from "mongoose";

export interface ITimetableSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  startTime: string;
  endTime: string;
  course: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  room: string;
}

export interface ITimetable extends Document {
  _id: mongoose.Types.ObjectId;
  department: string;
  semester: number;
  session: string;
  slots: ITimetableSlot[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timetableSlotSchema = new Schema<ITimetableSlot>({
  day: { type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  faculty: { type: Schema.Types.ObjectId, ref: "User", required: true },
  room: { type: String, required: true },
});

const timetableSchema = new Schema<ITimetable>(
  {
    department: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 10 },
    session: { type: String, required: true },
    slots: [timetableSlotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, semester: 1, session: 1 });

export const Timetable = mongoose.model<ITimetable>("Timetable", timetableSchema);
