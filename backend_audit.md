# Backend Audit Report — Digital Campus University ERP

This document contains a comprehensive, professional, and thorough backend audit of the University ERP system. It assesses the Express.js & MongoDB architecture against enterprise-ready production standards and lays out a corrective action plan to implement in Step 3.

---

## 1. System Overview & Architecture

The backend is built as a modular Express.js + Mongoose + TypeScript application. 
- **Server Entry Point**: `/backend/src/index.ts` (routes, global middleware, error handlers)
- **Database Entry Point**: `/backend/src/config/database.ts` (connection pooling, MongoMemoryServer fallback)
- **Centralized Error Handling**: CENTRALIZED handler in `/backend/src/middleware/errorHandler.ts` using a custom `/backend/src/utils/AppError.ts` subclass
- **Routing**: Nested routers utilizing `{ mergeParams: true }` for clean domain hierarchies (e.g., `/api/courses/:courseId/assignments`)
- **Authentication**: JWT-based session management (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`)
- **Authorization**: Role-Based Access Control (RBAC) via the `restrictTo(...roles)` middleware (`student`, `faculty`, `admin`)

---

## 2. Comprehensive Audit Checklist & Status

Below is the status of the ERP backend evaluated against the criteria of Step 2:

| Audit Aspect | Status | Findings / Details |
| :--- | :--- | :--- |
| **Authentication & JWT** | ✅ PASS | Standard JWT generation (7d expiration) in `authController.ts` with custom token lookup and active account guards. Secure authorization headers (`Bearer token`). |
| **Password Hashing** | ✅ PASS | Secure hashing with `bcryptjs` (salt rounds: 12) via a pre-save hook on the User model. Password extraction is prevented by default (`select: false`). |
| **Role-Based Authorization** | ✅ PASS | Active role checks for `student`, `faculty`, and `admin` roles correctly restricting endpoints. |
| **Database Connection & Models** | ✅ PASS | Connection pooling and timeouts configured. Dynamic fallback to `MongoMemoryServer` if `MONGODB_URI` is omitted. Schema design has clean relations and indexed lookup fields. |
| ** central Error Handling** | ✅ PASS | centralized `errorHandler` catching Mongoose validation, 11000 duplicate keys, invalid CastErrors, and expired/invalid JWT tokens without leaking info in production. |
| **Pagination Engine** | ✅ PASS | Custom `/backend/src/utils/paginate.ts` utility utilized across several controllers, supporting sorting, pagination metadata, and populating paths. |
| **Search & Filtering** | ✅ PASS | Regexp and text indexing employed for student searching, book retrieval, placement job filtering, and event indexing. |
| **Database Queries & Race Conditions** | ⚠️ RISK | **Critical concurrency risk found** in `libraryController.ts`: `issueBook` and `returnBook` do separate non-atomic reads and writes. High concurrent load can result in negative copy counts or double checkouts. |
| **File Upload Module** | ⚠️ MISSING | Multer is imported as a dependency in `package.json`, but no upload controller, service, or route is defined to support real student profile pictures or homework file uploads. |
| **Email Service** | ⚠️ MISSING | Nodemailer is listed in dependencies, but no transactional email utility exists to support password resets, placement alerts, or mark release announcements. |
| **Audit Logs** | ⚠️ MISSING | No centralized enterprise-grade system tracking changes to records (grades, timetable, user accounts). |
| **Transactions & Backups** | ⚠️ MISSING | No transactional safety or built-in schema tools for database recovery. |
| **Rate Limiting** | ✅ PASS | Global API rate limits (100 req / 15 mins) and Auth rate limits (15 req / 15 mins) configured inside `src/index.ts`. |
| **Security Headers** | ✅ PASS | Secure security headers configured using `helmet` middleware. CORS is configured. |

---

## 3. Core Findings & Security Gaps

### 🚨 Concurrency & Race Conditions in `libraryController.ts`
* **Vulnerable Code**:
  ```typescript
  const book = await Book.findById(req.body.bookId);
  if (book.availableCopies < 1) throw new AppError("No copies available", 400);
  ...
  book.availableCopies -= 1;
  await book.save();
  ```
* **Implications**: If multiple users request the last book copy simultaneously, both will find `availableCopies === 1`, issue the book, and save the book with `availableCopies === 0`, causing double allocation.
* **Resolution**: Replace with an atomic Mongoose/MongoDB operation:
  ```typescript
  const book = await Book.findOneAndUpdate(
    { _id: req.body.bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );
  ```

### 🚨 Lack of a Secure File Upload Controller
* **Implications**: The frontend references `fileUrl` and `avatar` fields, but students and users cannot upload physical files directly to the server.
* **Resolution**: Construct a robust `/api/upload` router with a safe, sandbox-compliant local disk storage Multer setup, checking mime types and sizes.

### 🚨 Missing Email/Nodemailer Integration
* **Implications**: No way to alert students or faculty of important updates.
* **Resolution**: Standardize a transactional email service in `/backend/src/utils/email.ts` using dummy transport configurations or secure SMTP inputs.

### 🚨 Missing Audit Logging Service
* **Implications**: Changes to critical ERP data like timetable slots, marks, and user states are untracked.
* **Resolution**: Introduce an `AuditLog` database schema and utility function to securely log all sensitive mutations (who made the change, when, and what changed).

---

## 4. Step 3 Action Plan (Implementation)

To complete the backend module and achieve enterprise-level production readiness, we will:

1. **Fix Concurrency Vulnerability**: Rewrite library checkout logic to use atomic `$inc` with positive count criteria.
2. **Implement File Upload Route**: Create a modular Multer-based `/api/upload` endpoint with file extension constraints.
3. **Implement centralized Transactional Email Utility**: Build a reusable `sendEmail` service utilizing nodemailer.
4. **Create an Audit Log System**: Create a database model `AuditLog` and a helper function to record security/data mutation events.
5. **Ensure Type Safety**: Keep compiling and verifying the type system via `tsc`.

---
*Report compiled by Principal Backend Architect & Senior Node.js Engineer.*
