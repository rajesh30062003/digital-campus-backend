import mongoose, { Document, Schema } from "mongoose";

export interface IInstitutionConfig extends Document {
  name: string;
  institutionType: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  academicStructure: "Semester" | "Year";
  enabledModules: string[];
  examinationRules?: string;
  attendanceRules?: string;
  feeStructure?: string;
  language: string;
  timezone: string;
  address?: string;
  contactDetails?: string;

  // SaaS Tenant Fields
  subdomain?: string;
  domain?: string;
  isWhiteLabeled: boolean;
  subscriptionPlan: "Trial" | "Basic" | "Professional" | "Enterprise";
  subscriptionStatus: "Active" | "Past Due" | "Suspended" | "Cancelled";
  storageQuota: number; // in bytes
  storageUsed: number;  // in bytes
  userQuota: number;
  userCount: number;
  billingCycle: "Monthly" | "Annual";
  nextBillingDate: Date;
  monthlyPrice: number;
  licensedModules: string[];

  createdAt: Date;
  updatedAt: Date;
}

const institutionConfigSchema = new Schema<IInstitutionConfig>(
  {
    name: { type: String, required: true, default: "Digital Campus" },
    institutionType: { type: String, required: true, default: "Medical College" },
    logo: { type: String, default: "" },
    primaryColor: { type: String, default: "#6d28d9" }, // Default violet-700
    secondaryColor: { type: String, default: "#4f46e5" }, // Default indigo-600
    academicStructure: { type: String, enum: ["Semester", "Year"], default: "Semester" },
    enabledModules: {
      type: [String],
      default: [
        "admissions",
        "academics",
        "departments",
        "courses",
        "attendance",
        "timetable",
        "examination",
        "results",
        "fees",
        "library",
        "hostel",
        "transport",
        "hr",
        "research",
        "placement",
        "parents",
        "alumni",
        "inventory",
        "hospital",
        "clinical-postings",
        "laboratory",
        "pharmacy",
        "ai-assistant"
      ]
    },
    examinationRules: { type: String, default: "Pass criteria is 50% average across papers." },
    attendanceRules: { type: String, default: "Minimum 75% attendance is required to sit for examinations." },
    feeStructure: { type: String, default: "Tuition fee: $5,000/year, Library fee: $200/year" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    address: { type: String, default: "123 Educational Blvd, Academic City" },
    contactDetails: { type: String, default: "phone: +1-234-567-8900, email: info@digitalcampus.edu" },

    // SaaS Tenant Fields
    subdomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    domain: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    isWhiteLabeled: { type: Boolean, default: false },
    subscriptionPlan: {
      type: String,
      enum: ["Trial", "Basic", "Professional", "Enterprise"],
      default: "Trial"
    },
    subscriptionStatus: {
      type: String,
      enum: ["Active", "Past Due", "Suspended", "Cancelled"],
      default: "Active"
    },
    storageQuota: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5GB in bytes
    storageUsed: { type: Number, default: 0 },
    userQuota: { type: Number, default: 500 },
    userCount: { type: Number, default: 1 },
    billingCycle: { type: String, enum: ["Monthly", "Annual"], default: "Monthly" },
    nextBillingDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    monthlyPrice: { type: Number, default: 49.00 },
    licensedModules: {
      type: [String],
      default: [
        "admissions",
        "academics",
        "departments",
        "courses",
        "attendance",
        "timetable",
        "examination",
        "results",
        "fees",
        "library",
        "hostel",
        "transport",
        "hr",
        "research",
        "placement",
        "parents",
        "alumni",
        "inventory",
        "hospital",
        "clinical-postings",
        "laboratory",
        "pharmacy",
        "ai-assistant"
      ]
    }
  },
  { timestamps: true }
);

export const InstitutionConfig = mongoose.model<IInstitutionConfig>("InstitutionConfig", institutionConfigSchema);
