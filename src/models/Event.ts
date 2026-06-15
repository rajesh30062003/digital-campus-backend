import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: "cultural" | "technical" | "sports" | "seminar" | "workshop" | "other";
  organizer: mongoose.Types.ObjectId;
  venue: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxParticipants?: number;
  registeredParticipants: mongoose.Types.ObjectId[];
  banner?: string;
  isPublished: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["cultural", "technical", "sports", "seminar", "workshop", "other"],
      required: true,
    },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    venue: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: Date,
    maxParticipants: Number,
    registeredParticipants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    banner: String,
    isPublished: { type: Boolean, default: false },
    tags: [String],
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1, category: 1 });

export const Event = mongoose.model<IEvent>("Event", eventSchema);
