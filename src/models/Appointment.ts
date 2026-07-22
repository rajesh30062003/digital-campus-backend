import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId; // faculty consultant
  student?: mongoose.Types.ObjectId; // assisting student intern
  dateTime: Date;
  symptoms?: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  tokenNumber: number; // Daily serial number
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User" },
    dateTime: { type: Date, required: true },
    symptoms: { type: String, trim: true },
    status: { 
      type: String, 
      required: true, 
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled" 
    },
    tokenNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

// Compound index to help lookup a doctor's schedule on a specific date range
appointmentSchema.index({ doctor: 1, dateTime: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ status: 1 });

export const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);
