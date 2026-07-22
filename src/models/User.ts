import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "student" | "faculty" | "admin" | "superadmin";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  institutionId?: mongoose.Types.ObjectId; // Tenant isolation key
  studentId?: string;
  department?: string;
  semester?: number;
  avatar?: string;
  phone?: string;
  bio?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  // Enterprise Security Additions
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
  activeSessions?: Array<{
    sessionId: string;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
    lastActive: Date;
  }>;
  failedLoginAttempts?: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
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
    role:     { type: String, enum: ["student", "faculty", "admin", "superadmin"], default: "student" },
    institutionId: { type: Schema.Types.ObjectId, ref: "InstitutionConfig" },
    // studentId: sparse unique — null values are allowed for non-students
    studentId:   { type: String, trim: true, sparse: true, unique: true },
    department:  { type: String, trim: true },
    semester:    { type: Number, min: 1, max: 10 },
    avatar:      { type: String },
    phone:       { type: String },
    bio:         { type: String, maxlength: 500 },
    isActive:         { type: Boolean, default: true },
    isEmailVerified:  { type: Boolean, default: false },
    // Enterprise Security Fields
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret:  { type: String, select: false },
    twoFactorRecoveryCodes: [{ type: String, select: false }],
    activeSessions: [
      {
        sessionId: { type: String, required: true },
        ip: { type: String },
        userAgent: { type: String },
        createdAt: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
      },
    ],
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    passwordChangedAt: { type: Date },
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

userSchema.index({ role: 1, department: 1 });
userSchema.index({ institutionId: 1, role: 1 });
userSchema.index({ createdAt: -1 });

userSchema.pre("save", async function (this: any) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
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
    delete ret.twoFactorSecret;
    delete ret.twoFactorRecoveryCodes;
    return ret;
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
