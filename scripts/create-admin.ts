/**
 * npm run create-admin
 *
 * Creates an admin account if one does not already exist.
 * Safe to run repeatedly.
 */

import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/database";
import { User }  from "../src/models/User";

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@campus.edu";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME     = process.env.ADMIN_NAME     || "Admin User";

const run = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      console.log(`\n✅ Admin already exists: ${existing.email} (role: ${existing.role})`);

      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log("   Role has been updated to admin.");
      }

      process.exit(0);
    }

    const admin = await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     "admin",
      isActive: true,
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Admin account created");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Email   : ${admin.email}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (err: any) {
    console.error("❌ create-admin failed:", err?.message || err);
    process.exit(1);
  }
};

run();
