/**
 * npm run reset-users
 *
 * Deletes and recreates the three default user accounts.
 * All other data (courses, assignments, etc.) is preserved.
 *
 * WARNING: This will delete ALL users and recreate only the defaults.
 *          Use this only for development / testing resets.
 */

import dotenv from "dotenv";
dotenv.config();

import connectDB from "../src/config/database";
import { User }  from "../src/models/User";

const DEFAULTS = [
  {
    name:       "Admin User",
    email:      "admin@campus.edu",
    password:   "Admin@123",
    role:       "admin"   as const,
    department: "Administration",
    isActive:   true,
  },
  {
    name:          "Dr. Priya Sharma",
    email:         "faculty@campus.edu",
    password:      "Faculty@123",
    role:          "faculty" as const,
    department:    "Computer Science",
    designation:   "Associate Professor",
    qualification: "Ph.D Computer Science",
    experience:    10,
    isActive:      true,
  },
  {
    name:       "Rahul Verma",
    email:      "student@campus.edu",
    password:   "Student@123",
    role:       "student"  as const,
    studentId:  "STU0000001",
    department: "Computer Science",
    semester:   5,
    isActive:   true,
  },
];

const run = async () => {
  try {
    await connectDB();

    console.log("\n🗑  Removing all users …");
    await User.deleteMany({});

    console.log("👤 Recreating default users …");
    for (const data of DEFAULTS) {
      await User.create(data);
      console.log(`   ✅ ${data.role.toUpperCase().padEnd(8)} ${data.email}  /  ${data.password}`);
    }

    const LINE = "━".repeat(60);
    console.log(`\n${LINE}`);
    console.log("  DEFAULT LOGIN ACCOUNTS");
    console.log(LINE);
    for (const u of DEFAULTS) {
      console.log(`  ${u.role.toUpperCase().padEnd(8)} email: ${u.email.padEnd(30)} password: ${u.password}`);
    }
    console.log(`${LINE}\n`);

    process.exit(0);
  } catch (err: any) {
    console.error("❌ reset-users failed:", err?.message || err);
    process.exit(1);
  }
};

run();
