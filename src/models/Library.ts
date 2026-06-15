import mongoose, { Document, Schema } from "mongoose";

// ── Book ──────────────────────────────────────────────────────────────────────
export interface IBook extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  author: string;
  isbn: string;
  publisher?: string;
  year?: number;
  edition?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  coverImage?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBook>(
  {
    title:           { type: String, required: true, trim: true },
    author:          { type: String, required: true, trim: true },
    isbn:            { type: String, required: true, unique: true, trim: true },
    publisher:       { type: String, trim: true },
    year:            { type: Number },
    edition:         { type: String },
    category:        { type: String, required: true },
    totalCopies:     { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    location:        { type: String },
    coverImage:      { type: String },
    description:     { type: String },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// isbn already unique — add text index for search, category for filter
bookSchema.index({ title: "text", author: "text" });
bookSchema.index({ category: 1 });

export const Book = mongoose.model<IBook>("Book", bookSchema);

// ── BookIssue ─────────────────────────────────────────────────────────────────
export interface IBookIssue extends Document {
  _id: mongoose.Types.ObjectId;
  book: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine: number;
  finePaid: boolean;
  status: "issued" | "returned" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

const bookIssueSchema = new Schema<IBookIssue>(
  {
    book:       { type: Schema.Types.ObjectId, ref: "Book", required: true },
    student:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    issuedBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    issueDate:  { type: Date, default: Date.now },
    dueDate:    { type: Date, required: true },
    returnDate: { type: Date },
    fine:       { type: Number, default: 0 },
    finePaid:   { type: Boolean, default: false },
    status:     { type: String, enum: ["issued", "returned", "overdue"], default: "issued" },
  },
  { timestamps: true }
);

bookIssueSchema.index({ student: 1, status: 1 });
bookIssueSchema.index({ book: 1 });
bookIssueSchema.index({ dueDate: 1, status: 1 });

export const BookIssue = mongoose.model<IBookIssue>("BookIssue", bookIssueSchema);
