import { Request, Response } from "express";
import { InstitutionConfig } from "../models/InstitutionConfig";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import asyncHandler from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

// Preset limits for subscription tiers
export const SUBSCRIPTION_PLANS = {
  Trial: {
    name: "Trial",
    price: 0,
    storageQuota: 1 * 1024 * 1024 * 1024, // 1 GB
    userQuota: 20,
    licensedModules: ["admissions", "academics", "timetable", "results", "attendance"]
  },
  Basic: {
    name: "Basic",
    price: 49,
    storageQuota: 10 * 1024 * 1024 * 1024, // 10 GB
    userQuota: 200,
    licensedModules: ["admissions", "academics", "departments", "courses", "attendance", "timetable", "results", "examination", "fees", "library", "hr"]
  },
  Professional: {
    name: "Professional",
    price: 149,
    storageQuota: 50 * 1024 * 1024 * 1024, // 50 GB
    userQuota: 1500,
    licensedModules: ["admissions", "academics", "departments", "courses", "attendance", "timetable", "results", "examination", "fees", "library", "hostel", "transport", "hr", "research", "placement", "parents", "alumni", "inventory", "laboratory"]
  },
  Enterprise: {
    name: "Enterprise",
    price: 499,
    storageQuota: 1000 * 1024 * 1024 * 1024, // 1 TB
    userQuota: 100000,
    licensedModules: [
      "admissions", "academics", "departments", "courses", "attendance", "timetable",
      "examination", "results", "fees", "library", "hostel", "transport", "hr",
      "research", "placement", "parents", "alumni", "inventory", "hospital",
      "clinical-postings", "laboratory", "pharmacy", "ai-assistant"
    ]
  }
};

// 1. Institution Onboarding Wizard (Public)
export const onboardInstitution = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      subdomain,
      institutionType,
      adminName,
      adminEmail,
      adminPassword,
      plan = "Trial"
    } = req.body;

    if (!name || !subdomain || !adminEmail || !adminPassword || !adminName) {
      throw new AppError("Please provide all onboarding details including administrator credentials", 400);
    }

    const normalizedSubdomain = subdomain.toLowerCase().trim();

    // Validate subdomain uniqueness
    const existingInst = await InstitutionConfig.findOne({ subdomain: normalizedSubdomain });
    if (existingInst) {
      throw new AppError("Subdomain already registered in our campus grid", 409);
    }

    // Validate email uniqueness
    const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingUser) {
      throw new AppError("Administrator email already in use", 409);
    }

    // Resolve subscription parameters
    const planLimits = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.Trial;

    // A. Create Institution config
    const tenant = await InstitutionConfig.create({
      name,
      institutionType: institutionType || "College",
      subdomain: normalizedSubdomain,
      primaryColor: "#6d28d9",
      secondaryColor: "#4f46e5",
      subscriptionPlan: planLimits.name as any,
      subscriptionStatus: "Active",
      storageQuota: planLimits.storageQuota,
      userQuota: planLimits.userQuota,
      licensedModules: planLimits.licensedModules,
      enabledModules: planLimits.licensedModules, // Start with all licensed modules enabled
      monthlyPrice: planLimits.price,
      userCount: 1,
      storageUsed: 0
    });

    if (!tenant) {
      throw new AppError("Failed to create institution profile", 500);
    }

    // B. Create Admin User linked to this Tenant
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: "admin",
      institutionId: tenant._id,
      isActive: true,
      isEmailVerified: true
    });

    // C. Write Onboarding Audit Log
    await AuditLog.create({
      institutionId: tenant._id,
      user: adminUser._id,
      userName: adminUser.name,
      userRole: "admin",
      action: "TENANT_ONBOARDED",
      details: {
        institutionName: tenant.name,
        subdomain: tenant.subdomain,
        tier: tenant.subscriptionPlan,
        limits: { users: tenant.userQuota, storage: tenant.storageQuota }
      },
      ipAddress: req.ip
    });

    // D. Return JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback_secret_key";
    const token = jwt.sign({ id: adminUser._id.toString() }, jwtSecret, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "Institution successfully onboarded to SaaS grid!",
      data: {
        token,
        user: adminUser,
        tenant
      }
    });
  }
);

// 2. Fetch Subscription Plans (Public / Tenant Config)
export const getSubscriptionPlans = asyncHandler(
  async (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: SUBSCRIPTION_PLANS
    });
  }
);

// 3. Super Super Admin: Get All Institutions
export const superGetAllInstitutions = asyncHandler(
  async (req: Request, res: Response) => {
    const tenants = await InstitutionConfig.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  }
);

// 4. Super Super Admin: Update Institution Details, Subscription, Licensed Modules, Quotas
export const superUpdateInstitution = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const tenant = await InstitutionConfig.findById(id);
    if (!tenant) throw new AppError("Institution not found", 404);

    // If upgrading subscription plan, synchronize plan defaults
    if (updateData.subscriptionPlan && updateData.subscriptionPlan !== tenant.subscriptionPlan) {
      const planLimits = SUBSCRIPTION_PLANS[updateData.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];
      if (planLimits) {
        updateData.storageQuota = planLimits.storageQuota;
        updateData.userQuota = planLimits.userQuota;
        updateData.licensedModules = planLimits.licensedModules;
        updateData.monthlyPrice = planLimits.price;
      }
    }

    Object.assign(tenant, updateData);
    await tenant.save();

    // Log Super Admin Action
    const actor = (req as any).user;
    await AuditLog.create({
      institutionId: tenant._id,
      user: actor._id,
      userName: actor.name,
      userRole: "superadmin",
      action: "TENANT_MODIFIED_BY_SUPER_ADMIN",
      details: {
        modifiedFields: Object.keys(updateData),
        newPlan: tenant.subscriptionPlan,
        storageQuota: tenant.storageQuota,
        userQuota: tenant.userQuota
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Tenant parameters updated successfully",
      data: tenant
    });
  }
);

// 5. Super Super Admin: Delete/Deactivate Tenant
export const superDeleteInstitution = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenant = await InstitutionConfig.findById(id);
    if (!tenant) throw new AppError("Institution not found", 404);

    // Deactivate users under this tenant
    await User.updateMany({ institutionId: tenant._id }, { isActive: false });

    await tenant.deleteOne();

    res.status(200).json({
      success: true,
      message: "Institution successfully decommissioned and archived"
    });
  }
);

// 6. Tenant Admin: Update Branding, Domain mapping & White-label Config
export const tenantUpdateConfig = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const { name, logo, primaryColor, secondaryColor, academicStructure, examinationRules, attendanceRules, feeStructure, language, timezone, address, contactDetails, subdomain, domain, isWhiteLabeled, enabledModules } = req.body;

    // Filter enabledModules against licensedModules to enforce module licensing
    let moduleSwitch = enabledModules;
    if (enabledModules) {
      moduleSwitch = enabledModules.filter((mod: string) => tenant.licensedModules.includes(mod));
    }

    // Prevent changing white-label configuration if the plan isn't Enterprise
    let applyWhiteLabel = isWhiteLabeled;
    if (isWhiteLabeled && tenant.subscriptionPlan !== "Enterprise") {
      applyWhiteLabel = false; // Graceful fallback
    }

    // Apply mappings
    if (name) tenant.name = name;
    if (logo !== undefined) tenant.logo = logo;
    if (primaryColor) tenant.primaryColor = primaryColor;
    if (secondaryColor) tenant.secondaryColor = secondaryColor;
    if (academicStructure) tenant.academicStructure = academicStructure;
    if (examinationRules !== undefined) tenant.examinationRules = examinationRules;
    if (attendanceRules !== undefined) tenant.attendanceRules = attendanceRules;
    if (feeStructure !== undefined) tenant.feeStructure = feeStructure;
    if (language) tenant.language = language;
    if (timezone) tenant.timezone = timezone;
    if (address !== undefined) tenant.address = address;
    if (contactDetails !== undefined) tenant.contactDetails = contactDetails;
    if (subdomain) {
      // Check subdomain uniqueness
      const existing = await InstitutionConfig.findOne({ subdomain: subdomain.toLowerCase(), _id: { $ne: tenant._id } });
      if (existing) throw new AppError("Subdomain already mapped to another tenant", 400);
      tenant.subdomain = subdomain.toLowerCase();
    }
    if (domain) {
      // Check domain uniqueness
      const existing = await InstitutionConfig.findOne({ domain: domain.toLowerCase(), _id: { $ne: tenant._id } });
      if (existing) throw new AppError("Custom domain already mapped to another tenant", 400);
      tenant.domain = domain.toLowerCase();
    }
    if (applyWhiteLabel !== undefined) tenant.isWhiteLabeled = applyWhiteLabel;
    if (moduleSwitch !== undefined) tenant.enabledModules = moduleSwitch;

    await tenant.save();

    // Log update
    const actor = (req as any).user;
    await AuditLog.create({
      institutionId: tenant._id,
      user: actor._id,
      userName: actor.name,
      userRole: actor.role,
      action: "TENANT_CONFIG_UPDATED",
      details: {
        updatedFields: Object.keys(req.body)
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      data: tenant
    });
  }
);

// 7. Tenant Admin: Simulate Billing Payment & Renewal
export const processBillingPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;
    const { amountPaid, paymentMethod = "SaaS Card Gateway" } = req.body;

    // Process renewal: advance billing date by 1 month or 1 year
    const durationDays = tenant.billingCycle === "Annual" ? 365 : 30;
    tenant.nextBillingDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    tenant.subscriptionStatus = "Active";
    await tenant.save();

    // Audit logs entry
    const actor = (req as any).user;
    await AuditLog.create({
      institutionId: tenant._id,
      user: actor?._id,
      userName: actor?.name || "Billing Automation",
      userRole: actor?.role || "admin",
      action: "BILLING_PAYMENT_PROCESSED",
      details: {
        plan: tenant.subscriptionPlan,
        cycle: tenant.billingCycle,
        amount: amountPaid || tenant.monthlyPrice,
        method: paymentMethod,
        nextBillingDate: tenant.nextBillingDate
      },
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: `Successfully processed transaction of $${amountPaid || tenant.monthlyPrice}. Subscription extended.`,
      data: tenant
    });
  }
);

// 8. Tenant/SaaS Audit Logs & Usage Analytics
export const getTenantUsageAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = (req as any).tenant;

    // Calculate user count dynamically
    const currentUsers = await User.countDocuments({ institutionId: tenant._id });
    
    // Update tenant cache if mismatch
    if (tenant.userCount !== currentUsers) {
      tenant.userCount = currentUsers;
      await tenant.save();
    }

    // Get audit trails for logs tab
    const logs = await AuditLog.find({ institutionId: tenant._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Dynamic analytics metrics
    const modulesEnabledCount = tenant.enabledModules.length;
    const modulesLicensedCount = tenant.licensedModules.length;
    
    res.status(200).json({
      success: true,
      data: {
        subscription: {
          plan: tenant.subscriptionPlan,
          status: tenant.subscriptionStatus,
          cycle: tenant.billingCycle,
          nextBillingDate: tenant.nextBillingDate,
          monthlyPrice: tenant.monthlyPrice
        },
        usage: {
          userQuota: tenant.userQuota,
          userCount: currentUsers,
          userPercentage: Math.round((currentUsers / tenant.userQuota) * 100) || 0,
          storageQuota: tenant.storageQuota,
          storageUsed: tenant.storageUsed,
          storagePercentage: Math.round((tenant.storageUsed / tenant.storageQuota) * 100) || 0,
          modulesEnabled: modulesEnabledCount,
          modulesLicensed: modulesLicensedCount
        },
        auditLogs: logs
      }
    });
  }
);
