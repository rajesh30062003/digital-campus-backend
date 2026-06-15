import mongoose, { Document, Schema } from "mongoose";

export interface IDepartment extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  hod?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    hod:         { type: Schema.Types.ObjectId, ref: "User" },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

// name and code already have unique:true — no extra indexes needed

export const Department = mongoose.model<IDepartment>("Department", departmentSchema);
