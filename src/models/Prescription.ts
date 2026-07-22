import mongoose, { Document, Schema } from "mongoose";

export interface IPrescriptionItem {
  medicineName: string;
  potency: string;
  dosage: string; // e.g., 4 globules, 5 drops
  frequency: string; // e.g., thrice daily, hourly
  duration: string; // e.g., 7 days, 1 month
  instruction?: string; // e.g., before meals, on empty stomach
}

export interface IPrescription extends Document {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId; // prescribing consultant/faculty
  student?: mongoose.Types.ObjectId; // student intern assisting the case
  symptoms: string;
  diagnosis?: string;
  medicines: IPrescriptionItem[];
  labTests?: string[]; // advisory labs (e.g., CBC, Liver Function, Widal)
  dispensed: boolean;
  dispensedAt?: Date;
  visitDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User" },
    symptoms: { type: String, required: true, trim: true },
    diagnosis: { type: String, trim: true },
    medicines: [
      {
        medicineName: { type: String, required: true },
        potency: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instruction: { type: String, trim: true },
      },
    ],
    labTests: [{ type: String, trim: true }],
    dispensed: { type: Boolean, default: false },
    dispensedAt: { type: Date },
    visitDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ dispensed: 1 });

export const Prescription = mongoose.model<IPrescription>("Prescription", prescriptionSchema);
