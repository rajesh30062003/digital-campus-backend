import { Request, Response } from "express";
import { InstitutionConfig } from "../models/InstitutionConfig";

export const getInstitutionConfig = async (req: Request, res: Response) => {
  try {
    let config = await InstitutionConfig.findOne();
    if (!config) {
      // Seed default config if none exists
      config = await InstitutionConfig.create({
        name: "Universal Digital Campus",
        institutionType: "Medical College",
        primaryColor: "#059669", // Emerald-600 default
        secondaryColor: "#0d9488", // Teal-600 default
        academicStructure: "Semester",
        enabledModules: [
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
      });
    }
    return res.status(200).json({
      status: "success",
      data: config
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to retrieve configuration"
    });
  }
};

export const updateInstitutionConfig = async (req: Request, res: Response) => {
  try {
    let config = await InstitutionConfig.findOne();
    if (!config) {
      config = new InstitutionConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    await config.save();

    return res.status(200).json({
      status: "success",
      data: config
    });
  } catch (error: any) {
    return res.status(400).json({
      status: "error",
      message: error.message || "Failed to update configuration"
    });
  }
};
