import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "student" | "faculty" | "admin";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  semester?: number;
  avatar?: string;
  phone?: string;
  bio?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  // Faculty-specific
  designation?: string;
  qualification?: string;
  experience?: number;
  // Internal tokens (not returned in JSON)
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true,
                match: [/^\S+@\S+\.\S+$/, "Invalid email format"] },
    password: { type: String, required: true, minlength: 6, select: false },
    role:     { type: String, enum: ["student", "faculty", "admin"], default: "student" },
    // studentId: sparse unique — null values are allowed for non-students
    studentId:   { type: String, trim: true, sparse: true, unique: true },
    department:  { type: String, trim: true },
    semester:    { type: Number, min: 1, max: 10 },
    avatar:      { type: String },
    phone:       { type: String },
    bio:         { type: String, maxlength: 500 },
    isActive:         { type: Boolean, default: true },
    isEmailVerified:  { type: Boolean, default: false },
    // Faculty fields
    designation:   { type: String, trim: true },
    qualification: { type: String, trim: true },
    experience:    { type: Number, min: 0 },
    // Token fields — never returned in JSON
    refreshToken:          { type: String, select: false },
    resetPasswordToken:    { type: String, select: false },
    resetPasswordExpires:  { type: Date,   select: false },
  },
  { timestamps: true }
);

// email already has unique:true — no extra index needed
// studentId already has sparse+unique — no extra index needed

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
