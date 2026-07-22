import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine extends Document {
  _id: mongoose.Types.ObjectId;
  name: string; // e.g., Aconitum napellus, Arsenicum album, Belladonna
  potency: string; // e.g., Q, 30C, 200C, 1M, LM1
  form: "dilution" | "mother_tincture" | "globules" | "tablets" | "ointment" | "other";
  quantity: number; // stock count
  unit: string; // e.g., bottles, grams, ml
  price: number;
  minStockLevel: number; // threshold for restocking alerts
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true },
    potency: { type: String, required: true, trim: true },
    form: { 
      type: String, 
      required: true, 
      enum: ["dilution", "mother_tincture", "globules", "tablets", "ointment", "other"],
      default: "globules" 
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, default: "bottles" },
    price: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, required: true, min: 0, default: 5 },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

medicineSchema.index({ name: 1, potency: 1, form: 1 }, { unique: true });

export const Medicine = mongoose.model<IMedicine>("Medicine", medicineSchema);
