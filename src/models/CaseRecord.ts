import mongoose, { Document, Schema } from "mongoose";

export interface IFollowUp {
  date: Date;
  statusDetails: string;
  remedyPrescribed?: string;
  potencyPrescribed?: string;
}

export interface ICaseRecord extends Document {
  _id: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  caseTaker: mongoose.Types.ObjectId; // User (student or doctor)
  chiefComplaints: string; // Chief complaints with LSM-C details
  pastHistory?: string;
  familyHistory?: string;
  physicalGenerals: {
    appetite?: string;
    thirst?: string;
    desires?: string;
    aversions?: string;
    thermalRelation?: "hot" | "chilly" | "ambothermal";
    sleep?: string;
    dreams?: string;
    perspiration?: string;
  };
  mentalGenerals?: string; // Temperament, fears, anxieties, mood
  miasmaticAnalysis?: "psora" | "sycosis" | "syphilis" | "tubercular" | "mixed";
  repertorization?: string; // Rubrics selected, repertory sheet notes
  remedySelectionReason?: string; // Simillimum justification
  followUps: IFollowUp[];
  createdAt: Date;
  updatedAt: Date;
}

const caseRecordSchema = new Schema<ICaseRecord>(
  {
    patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    caseTaker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chiefComplaints: { type: String, required: true },
    pastHistory: { type: String },
    familyHistory: { type: String },
    physicalGenerals: {
      appetite: { type: String },
      thirst: { type: String },
      desires: { type: String },
      aversions: { type: String },
      thermalRelation: { type: String, enum: ["hot", "chilly", "ambothermal"] },
      sleep: { type: String },
      dreams: { type: String },
      perspiration: { type: String },
    },
    mentalGenerals: { type: String },
    miasmaticAnalysis: { 
      type: String, 
      enum: ["psora", "sycosis", "syphilis", "tubercular", "mixed"] 
    },
    repertorization: { type: String },
    remedySelectionReason: { type: String },
    followUps: [
      {
        date: { type: Date, required: true, default: Date.now },
        statusDetails: { type: String, required: true },
        remedyPrescribed: { type: String },
        potencyPrescribed: { type: String },
      },
    ],
  },
  { timestamps: true }
);

caseRecordSchema.index({ patient: 1 });
caseRecordSchema.index({ caseTaker: 1 });

export const CaseRecord = mongoose.model<ICaseRecord>("CaseRecord", caseRecordSchema);
