/**
 * Digital Campus — Database Seed Script
 *
 * Usage:  npm run seed
 *
 * Drops all existing data and inserts clean demo records so the
 * application can be started immediately with known credentials.
 *
 * DEFAULT LOGIN ACCOUNTS
 * ─────────────────────────────────────────────────────────────────
 *   ADMIN   email: admin@campus.edu       password: Admin@123
 *   FACULTY email: faculty@campus.edu     password: Faculty@123
 *   STUDENT email: student@campus.edu     password: Student@123
 * ─────────────────────────────────────────────────────────────────
 */

import dotenv from "dotenv";
dotenv.config();

import connectDB       from "../src/config/database";
import { User }        from "../src/models/User";
import { Department }  from "../src/models/Department";
import { Course }      from "../src/models/Course";
import { Announcement }from "../src/models/Announcement";
import { Assignment }  from "../src/models/Assignment";
import { Attendance }  from "../src/models/Attendance";
import { Book }        from "../src/models/Library";
import { Company, Job }from "../src/models/Placement";
import { Timetable }   from "../src/models/Timetable";
import { Exam, Marks } from "../src/models/Marks";
import { Event }       from "../src/models/Event";

// ─────────────────────────────────────────────────────────────────────────────
// Credentials — change here to customise the seed
// ─────────────────────────────────────────────────────────────────────────────
const CREDENTIALS = {
  admin:   { email: "admin@campus.edu",   password: "Admin@123" },
  faculty: { email: "faculty@campus.edu", password: "Faculty@123" },
  student: { email: "student@campus.edu", password: "Student@123" },
};

// ─────────────────────────────────────────────────────────────────────────────
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("\n🗑  Clearing existing data …");

    // Drop in dependency order (children before parents)
    await Marks.deleteMany({});
    await Exam.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});
    await Announcement.deleteMany({});
    await Event.deleteMany({});
    await Timetable.deleteMany({});
    await Course.deleteMany({});
    await Department.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await User.deleteMany({});

    console.log("✅ Collections cleared");

    // ── USERS ─────────────────────────────────────────────────────────────────
    console.log("\n👤 Creating users …");

    /**
     * User.create() fires the pre-save hook which calls bcrypt.hash().
     * Passwords are therefore stored hashed — exactly as the login controller
     * expects them when it calls user.comparePassword().
     */
    const [admin, faculty1, faculty2, student1, student2, student3] = await User.create([
      // ── PRIMARY DEMO ACCOUNTS (used in test credentials) ──
      {
        name:       "Admin User",
        email:      CREDENTIALS.admin.email,
        password:   CREDENTIALS.admin.password,
        role:       "admin",
        department: "Administration",
        phone:      "9000000001",
        isActive:   true,
      },
      {
        name:          "Dr. Priya Sharma",
        email:         CREDENTIALS.faculty.email,
        password:      CREDENTIALS.faculty.password,
        role:          "faculty",
        department:    "Computer Science",
        designation:   "Associate Professor",
        qualification: "Ph.D Computer Science",
        experience:    10,
        phone:         "9000000002",
        isActive:      true,
      },
      {
        name:          "Prof. Arjun Mehta",
        email:         "arjun.mehta@campus.edu",
        password:      "Faculty@123",
        role:          "faculty",
        department:    "Electronics",
        designation:   "Assistant Professor",
        qualification: "M.Tech Electronics",
        experience:    7,
        phone:         "9000000003",
        isActive:      true,
      },
      // ── PRIMARY DEMO STUDENT ──
      {
        name:       "Rahul Verma",
        email:      CREDENTIALS.student.email,
        password:   CREDENTIALS.student.password,
        role:       "student",
        studentId:  "STU2024001",
        department: "Computer Science",
        semester:   5,
        phone:      "9000000004",
        isActive:   true,
      },
      {
        name:       "Sneha Gupta",
        email:      "sneha.g@campus.edu",
        password:   "Student@123",
        role:       "student",
        studentId:  "STU2024002",
        department: "Computer Science",
        semester:   5,
        phone:      "9000000005",
        isActive:   true,
      },
      {
        name:       "Amit Patel",
        email:      "amit.p@campus.edu",
        password:   "Student@123",
        role:       "student",
        studentId:  "STU2024003",
        department: "Electronics",
        semester:   5,
        phone:      "9000000006",
        isActive:   true,
      },
    ]);

    console.log(`   Created ${6} users`);

    // ── DEPARTMENTS ───────────────────────────────────────────────────────────
    console.log("🏛  Creating departments …");

    await Department.create([
      { name: "Computer Science",       code: "CSE", description: "B.Tech Computer Science & Engineering",   hod: faculty1._id },
      { name: "Electronics",            code: "ECE", description: "B.Tech Electronics & Communication",      hod: faculty2._id },
      { name: "Mechanical",             code: "ME",  description: "B.Tech Mechanical Engineering" },
      { name: "Civil",                  code: "CE",  description: "B.Tech Civil Engineering" },
      { name: "Information Technology", code: "IT",  description: "B.Tech Information Technology" },
    ]);

    console.log("   Created 5 departments");

    // ── COURSES ───────────────────────────────────────────────────────────────
    console.log("📚 Creating courses …");

    const [ds, os, dbms, de] = await Course.create([
      {
        title:            "Data Structures & Algorithms",
        code:             "CS301",
        description:      "Fundamental data structures: arrays, linked lists, trees, graphs, and algorithm analysis.",
        department:       "Computer Science",
        semester:         5,
        credits:          4,
        faculty:          faculty1._id,
        enrolledStudents: [student1._id, student2._id],
        maxEnrollment:    60,
      },
      {
        title:            "Operating Systems",
        code:             "CS302",
        description:      "OS concepts: processes, threads, memory management, file systems and I/O.",
        department:       "Computer Science",
        semester:         5,
        credits:          4,
        faculty:          faculty1._id,
        enrolledStudents: [student1._id, student2._id],
        maxEnrollment:    60,
      },
      {
        title:            "Database Management Systems",
        code:             "CS303",
        description:      "Relational databases, SQL, normalisation, transactions and introduction to NoSQL.",
        department:       "Computer Science",
        semester:         5,
        credits:          3,
        faculty:          faculty1._id,
        enrolledStudents: [student1._id, student2._id],
        maxEnrollment:    60,
      },
      {
        title:            "Digital Electronics",
        code:             "EC301",
        description:      "Combinational and sequential logic circuits, flip-flops, counters and registers.",
        department:       "Electronics",
        semester:         5,
        credits:          4,
        faculty:          faculty2._id,
        enrolledStudents: [student3._id],
        maxEnrollment:    60,
      },
    ]);

    console.log("   Created 4 courses");

    // ── TIMETABLE ─────────────────────────────────────────────────────────────
    console.log("🗓  Creating timetables …");

    await Timetable.create([
      {
        department: "Computer Science",
        semester:   5,
        session:    "2024-25",
        slots: [
          { day: "Mon", startTime: "09:00", endTime: "10:00", course: ds._id,   faculty: faculty1._id, room: "LH-101" },
          { day: "Mon", startTime: "11:00", endTime: "12:00", course: os._id,   faculty: faculty1._id, room: "LH-102" },
          { day: "Tue", startTime: "09:00", endTime: "10:00", course: dbms._id, faculty: faculty1._id, room: "LH-103" },
          { day: "Tue", startTime: "11:00", endTime: "12:00", course: ds._id,   faculty: faculty1._id, room: "LH-101" },
          { day: "Wed", startTime: "09:00", endTime: "10:00", course: os._id,   faculty: faculty1._id, room: "LH-102" },
          { day: "Wed", startTime: "11:00", endTime: "12:00", course: dbms._id, faculty: faculty1._id, room: "LH-103" },
          { day: "Thu", startTime: "09:00", endTime: "10:00", course: ds._id,   faculty: faculty1._id, room: "LH-101" },
          { day: "Thu", startTime: "14:00", endTime: "15:00", course: os._id,   faculty: faculty1._id, room: "LH-104" },
          { day: "Fri", startTime: "09:00", endTime: "10:00", course: dbms._id, faculty: faculty1._id, room: "LH-103" },
          { day: "Fri", startTime: "11:00", endTime: "12:00", course: ds._id,   faculty: faculty1._id, room: "LH-101" },
        ],
      },
      {
        department: "Electronics",
        semester:   5,
        session:    "2024-25",
        slots: [
          { day: "Mon", startTime: "10:00", endTime: "11:00", course: de._id, faculty: faculty2._id, room: "LH-201" },
          { day: "Wed", startTime: "10:00", endTime: "11:00", course: de._id, faculty: faculty2._id, room: "LH-201" },
          { day: "Fri", startTime: "10:00", endTime: "11:00", course: de._id, faculty: faculty2._id, room: "LH-201" },
        ],
      },
    ]);

    console.log("   Created 2 timetables");

    // ── ASSIGNMENTS ───────────────────────────────────────────────────────────
    console.log("📝 Creating assignments …");

    const dueNext = new Date(); dueNext.setDate(dueNext.getDate() + 7);
    const duePast = new Date(); duePast.setDate(duePast.getDate() - 3);

    await Assignment.create([
      {
        title:       "Implement a Binary Search Tree",
        description: "Implement a BST with insert, delete, search and all traversal methods in C++ or Java. Include a README explaining complexity.",
        course:      ds._id,
        faculty:     faculty1._id,
        dueDate:     dueNext,
        totalMarks:  20,
        isPublished: true,
      },
      {
        title:       "Process Scheduling Simulation",
        description: "Simulate FCFS, SJF and Round Robin scheduling. Compare average waiting times with a table.",
        course:      os._id,
        faculty:     faculty1._id,
        dueDate:     dueNext,
        totalMarks:  25,
        isPublished: true,
      },
      {
        title:       "SQL Queries on University Database",
        description: "Write SQL queries on the provided university schema covering joins, aggregations and subqueries.",
        course:      dbms._id,
        faculty:     faculty1._id,
        dueDate:     duePast,
        totalMarks:  15,
        isPublished: true,
        submissions: [
          {
            student:     student1._id,
            content:     "SELECT s.name, c.title FROM students s JOIN enrolments e ON s.id = e.student_id JOIN courses c ON c.id = e.course_id;",
            submittedAt: new Date(duePast.getTime() - 3_600_000),
            status:      "submitted",
          },
        ],
      },
    ]);

    console.log("   Created 3 assignments");

    // ── ATTENDANCE ────────────────────────────────────────────────────────────
    console.log("📅 Creating attendance records …");

    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(d0); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(d0); d2.setDate(d2.getDate() - 2);
    const d3 = new Date(d0); d3.setDate(d3.getDate() - 3);

    await Attendance.create([
      { course: ds._id,   faculty: faculty1._id, date: d0, records: [{ student: student1._id, status: "present" }, { student: student2._id, status: "present" }] },
      { course: ds._id,   faculty: faculty1._id, date: d1, records: [{ student: student1._id, status: "present" }, { student: student2._id, status: "absent" }] },
      { course: os._id,   faculty: faculty1._id, date: d2, records: [{ student: student1._id, status: "present" }, { student: student2._id, status: "present" }] },
      { course: dbms._id, faculty: faculty1._id, date: d3, records: [{ student: student1._id, status: "late"    }, { student: student2._id, status: "present" }] },
    ]);

    console.log("   Created 4 attendance sessions");

    // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────
    console.log("📢 Creating announcements …");

    /**
     * IMPORTANT: The Announcement schema requires the field 'author' (ObjectId).
     * Do NOT use 'createdBy' — that field does not exist in the schema.
     */
    await Announcement.create([
      {
        title:          "Mid-Semester Examinations Schedule",
        content:        "Mid-semester examinations for all departments will be held from the 15th to the 22nd. Check the portal for subject-wise schedules.",
        category:       "exam",
        author:         admin._id,          // ← required field
        targetAudience: ["student", "faculty"],
        isPinned:       true,
      },
      {
        title:          "Annual Technical Fest – TechVision 2025",
        content:        "TechVision 2025 is scheduled on 28th–30th of this month. Register now — prizes worth ₹1,00,000!",
        category:       "event",
        author:         admin._id,
        targetAudience: ["all"],
        isPinned:       false,
      },
      {
        title:          "Library Hours Extended During Exams",
        content:        "The library will remain open until 10 PM on weekdays during the examination period.",
        category:       "general",
        author:         admin._id,
        targetAudience: ["all"],
        isPinned:       false,
      },
      {
        title:          "Campus Placement Drive – Infosys",
        content:        "Infosys will hold a campus drive for CSE, IT and ECE students. Register before the 10th. Minimum CGPA: 6.5.",
        category:       "academic",
        author:         admin._id,
        targetAudience: ["student"],
        isPinned:       true,
      },
      {
        title:          "Data Structures Assignment Reminder",
        content:        "Reminder: the BST assignment is due in 7 days. Submit on the portal before the deadline.",
        category:       "academic",
        author:         faculty1._id,
        targetAudience: ["student"],
        department:     "Computer Science",
        isPinned:       false,
      },
    ]);

    console.log("   Created 5 announcements");

    // ── EVENTS ────────────────────────────────────────────────────────────────
    console.log("🎉 Creating events …");

    const evStart  = new Date(); evStart.setDate(evStart.getDate() + 14);
    const evEnd    = new Date(evStart); evEnd.setDate(evEnd.getDate() + 2);
    const evDL     = new Date(); evDL.setDate(evDL.getDate() + 10);

    await Event.create([
      {
        title:                "TechVision 2025 – Annual Tech Fest",
        description:          "3-day festival: hackathon, coding contest, robotics, paper presentations, cultural events.",
        category:             "technical",
        organizer:            admin._id,
        venue:                "Main Auditorium & Sports Ground",
        startDate:            evStart,
        endDate:              evEnd,
        registrationDeadline: evDL,
        maxParticipants:      500,
        isPublished:          true,
        tags:                 ["hackathon", "coding", "robotics"],
      },
      {
        title:           "Seminar on AI & Machine Learning",
        description:     "Industry experts discuss the latest trends in AI and ML.",
        category:        "seminar",
        organizer:       faculty1._id,
        venue:           "Seminar Hall A",
        startDate:       new Date(Date.now() + 7 * 86_400_000),
        endDate:         new Date(Date.now() + 7 * 86_400_000 + 3 * 3_600_000),
        maxParticipants: 100,
        isPublished:     true,
        tags:            ["AI", "ML"],
      },
    ]);

    console.log("   Created 2 events");

    // ── LIBRARY ───────────────────────────────────────────────────────────────
    console.log("📖 Adding books …");

    await Book.create([
      { title: "Introduction to Algorithms",   author: "Cormen et al.",           isbn: "978-0262046305", publisher: "MIT Press",      year: 2022, category: "Computer Science", totalCopies: 5, availableCopies: 3, location: "A-01" },
      { title: "Operating System Concepts",    author: "Abraham Silberschatz",    isbn: "978-1119800361", publisher: "Wiley",           year: 2021, category: "Computer Science", totalCopies: 4, availableCopies: 4, location: "A-02" },
      { title: "Database System Concepts",     author: "Abraham Silberschatz",    isbn: "978-0078022159", publisher: "McGraw Hill",     year: 2020, category: "Computer Science", totalCopies: 3, availableCopies: 2, location: "A-03" },
      { title: "Computer Networks",            author: "Andrew Tanenbaum",        isbn: "978-0132126953", publisher: "Prentice Hall",   year: 2011, category: "Computer Science", totalCopies: 3, availableCopies: 3, location: "A-04" },
      { title: "Digital Design",               author: "M. Morris Mano",          isbn: "978-0132774208", publisher: "Prentice Hall",   year: 2012, category: "Engineering",      totalCopies: 4, availableCopies: 4, location: "B-01" },
      { title: "Engineering Mathematics",      author: "B.S. Grewal",             isbn: "978-9352015573", publisher: "Khanna Pub.",     year: 2020, category: "Mathematics",      totalCopies: 8, availableCopies: 6, location: "C-01" },
      { title: "The Pragmatic Programmer",     author: "Hunt & Thomas",           isbn: "978-0135957059", publisher: "Addison-Wesley",  year: 2019, category: "Computer Science", totalCopies: 2, availableCopies: 2, location: "A-05" },
      { title: "Clean Code",                   author: "Robert C. Martin",        isbn: "978-0132350884", publisher: "Prentice Hall",   year: 2008, category: "Computer Science", totalCopies: 3, availableCopies: 3, location: "A-06" },
    ]);

    console.log("   Added 8 books");

    // ── PLACEMENT ─────────────────────────────────────────────────────────────
    console.log("💼 Creating placement data …");

    const [tcs, infosys, amazon, wipro] = await Company.create([
      { name: "TCS",     industry: "Technology", location: "Pan India",     website: "https://www.tcs.com",     contactEmail: "campus@tcs.com" },
      { name: "Infosys", industry: "Technology", location: "Pune / Mysore", website: "https://www.infosys.com", contactEmail: "campus@infosys.com" },
      { name: "Amazon",  industry: "E-Commerce", location: "Hyderabad",     website: "https://www.amazon.jobs", contactEmail: "campus@amazon.com" },
      { name: "Wipro",   industry: "Technology", location: "Bangalore",     website: "https://www.wipro.com",   contactEmail: "campus@wipro.com" },
    ]);

    const dl = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };

    await Job.create([
      { company: tcs._id,     title: "Systems Engineer",  description: "Full-stack dev role at TCS Digital.",           requirements: ["B.Tech/B.E", "6+ CGPA"],     eligibleBranches: ["Computer Science", "Information Technology", "Electronics"], minimumCGPA: 6.0, package: "₹7 LPA",        jobType: "full-time",  location: "Pan India",  lastDateToApply: dl(30), status: "open", postedBy: admin._id },
      { company: infosys._id, title: "Software Engineer", description: "Software dev at Infosys Digital Commerce.",     requirements: ["B.Tech/B.E", "6.5+ CGPA"],   eligibleBranches: ["Computer Science", "Information Technology"],               minimumCGPA: 6.5, package: "₹6.5 LPA",      jobType: "full-time",  location: "Pune",       lastDateToApply: dl(20), status: "open", postedBy: admin._id },
      { company: amazon._id,  title: "SDE Intern",        description: "2-month summer internship at Amazon India.",    requirements: ["Pre-final year", "7+ CGPA"], eligibleBranches: ["Computer Science", "Information Technology"],               minimumCGPA: 7.0, package: "₹80,000/month", jobType: "internship", location: "Hyderabad",  lastDateToApply: dl(15), status: "open", postedBy: admin._id },
      { company: wipro._id,   title: "Project Engineer",  description: "Wipro WILP – Work Integrated Learning Program.", requirements: ["B.Tech/B.E", "6+ CGPA"],    eligibleBranches: ["Computer Science", "Electronics", "Information Technology"], minimumCGPA: 6.0, package: "₹6 LPA",        jobType: "full-time",  location: "Bangalore",  lastDateToApply: dl(25), status: "open", postedBy: admin._id },
    ]);

    console.log("   Created 4 companies and 4 jobs");

    // ── EXAMS & MARKS ─────────────────────────────────────────────────────────
    console.log("📊 Creating exams and marks …");

    const examDate = new Date(); examDate.setDate(examDate.getDate() - 10);

    const [exam1, exam2] = await Exam.create([
      { title: "Data Structures Mid-Term",    type: "internal", course: ds._id,   department: "Computer Science", semester: 5, session: "2024-25", date: examDate, totalMarks: 50, passingMarks: 20, isPublished: true, createdBy: faculty1._id },
      { title: "Operating Systems Mid-Term",  type: "internal", course: os._id,   department: "Computer Science", semester: 5, session: "2024-25", date: examDate, totalMarks: 50, passingMarks: 20, isPublished: true, createdBy: faculty1._id },
    ]);

    await Marks.create([
      { exam: exam1._id, student: student1._id, course: ds._id, marksObtained: 42, enteredBy: faculty1._id },
      { exam: exam1._id, student: student2._id, course: ds._id, marksObtained: 35, enteredBy: faculty1._id },
      { exam: exam2._id, student: student1._id, course: os._id, marksObtained: 38, enteredBy: faculty1._id },
      { exam: exam2._id, student: student2._id, course: os._id, marksObtained: 44, enteredBy: faculty1._id },
    ]);

    console.log("   Created 2 exams and 4 mark records");

    // ── DONE ──────────────────────────────────────────────────────────────────
    printCredentials();
    process.exit(0);

  } catch (err: any) {
    console.error("\n❌ Seed failed:", err?.message || err);
    if (err?.errors) {
      // Print individual Mongoose validation messages
      for (const [field, e] of Object.entries(err.errors as any)) {
        console.error(`   • ${field}: ${(e as any).message}`);
      }
    }
    process.exit(1);
  }
};

function printCredentials() {
  const LINE = "━".repeat(60);
  console.log(`\n${LINE}`);
  console.log("  DEFAULT LOGIN ACCOUNTS");
  console.log(LINE);
  console.log(`  ADMIN   email: ${CREDENTIALS.admin.email.padEnd(30)} password: ${CREDENTIALS.admin.password}`);
  console.log(`  FACULTY email: ${CREDENTIALS.faculty.email.padEnd(30)} password: ${CREDENTIALS.faculty.password}`);
  console.log(`  STUDENT email: ${CREDENTIALS.student.email.padEnd(30)} password: ${CREDENTIALS.student.password}`);
  console.log(LINE);
  console.log("\n  Additional accounts:");
  console.log("  arjun.mehta@campus.edu   / Faculty@123");
  console.log("  sneha.g@campus.edu       / Student@123");
  console.log("  amit.p@campus.edu        / Student@123");
  console.log(`${LINE}\n`);
}

seedDatabase();
