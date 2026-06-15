# Digital Campus — Backend API

Full-featured REST API for the Digital Campus platform. Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Security | Helmet, CORS, Rate Limiting |
| Validation | express-validator |
| Dev server | tsx (hot reload) |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET at minimum
```

### 3. Seed the database
```bash
npm run seed
```

### 4. Run in development
```bash
npm run dev
# API available at http://localhost:5000
```

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@campus.edu | Admin@1234 |
| Faculty | priya.sharma@campus.edu | Faculty@1234 |
| Student | rajesh.kumar@campus.edu | Student@1234 |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <accessToken>
```

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login, get tokens |
| POST | `/refresh` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Logout |
| POST | `/forgot-password` | ❌ | Request password reset |
| PATCH | `/reset-password/:token` | ❌ | Reset password |
| GET | `/me` | ✅ | Get current user |

**Register body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@campus.edu",
  "password": "Secret@123",
  "role": "student",
  "studentId": "CS2021001",
  "department": "Computer Science",
  "semester": 5
}
```

---

### Users — `/api/users`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | admin | List all users |
| GET | `/:id` | any | Get user by ID |
| PATCH | `/profile` | any | Update own profile |
| PATCH | `/change-password` | any | Change password |
| PATCH | `/:id` | admin | Update any user |
| DELETE | `/:id` | admin | Deactivate user |

---

### Courses — `/api/courses`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | any | List courses (filterable) |
| GET | `/my-courses` | any | My enrolled/teaching courses |
| GET | `/:id` | any | Course details + students |
| POST | `/` | faculty/admin | Create course |
| PATCH | `/:id` | faculty/admin | Update course |
| DELETE | `/:id` | admin | Deactivate course |
| POST | `/:id/enroll` | student | Enroll in course |
| DELETE | `/:id/enroll` | student | Unenroll |

**Query params:** `?department=CS&semester=5&faculty=<id>&search=algo&page=1&limit=20`

---

### Assignments — `/api/courses/:courseId/assignments`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | any | List assignments in course |
| POST | `/` | faculty | Create assignment |
| GET | `/:id` | any | Get assignment (students see own submission only) |
| PATCH | `/:id` | faculty | Update assignment |
| POST | `/:id/submit` | student | Submit assignment |
| PATCH | `/:id/grade/:studentId` | faculty | Grade a submission |

---

### Attendance — `/api/courses/:courseId/attendance`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/` | faculty | Mark attendance for a class |
| GET | `/` | faculty | Get all attendance records |
| GET | `/my` | student | My attendance + % |
| GET | `/stats` | faculty | Stats per student |

**Mark attendance body:**
```json
{
  "date": "2025-06-15",
  "records": [
    { "student": "<studentId>", "status": "present" },
    { "student": "<studentId2>", "status": "absent", "remark": "medical leave" }
  ]
}
```

---

### Announcements — `/api/announcements`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | any | List (filtered by audience) |
| GET | `/:id` | any | Get (increments views) |
| POST | `/` | faculty/admin | Create |
| PATCH | `/:id` | faculty/admin | Update |
| DELETE | `/:id` | faculty/admin | Delete |

**Query params:** `?category=exam&department=CS&page=1`

---

### Events — `/api/events`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | any | List events |
| GET | `/:id` | any | Event details |
| POST | `/` | faculty/admin | Create event |
| PATCH | `/:id` | faculty/admin | Update |
| DELETE | `/:id` | faculty/admin | Delete |
| POST | `/:id/register` | any | Register for event |
| DELETE | `/:id/register` | any | Unregister |

**Query params:** `?category=technical&upcoming=true`

---

### Discussions — `/api/courses/:courseId/discussions`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | any | List discussions |
| POST | `/` | any | Create discussion |
| GET | `/:id` | any | Get with replies |
| POST | `/:id/replies` | any | Add reply |
| PATCH | `/:id/like` | any | Toggle like |
| DELETE | `/:id` | owner/admin | Delete |

---

## Project Structure

```
src/
├── config/
│   └── database.ts          # MongoDB connection
├── controllers/
│   ├── authController.ts    # Register, login, tokens, password
│   ├── userController.ts    # CRUD, profile, password change
│   ├── courseController.ts  # Courses + enrollment
│   ├── assignmentController.ts  # Assignments + submissions + grading
│   ├── attendanceController.ts  # Mark + stats + student view
│   ├── announcementController.ts
│   ├── eventController.ts   # Events + registration
│   └── discussionController.ts  # Forum per course
├── middleware/
│   ├── auth.ts              # protect + restrictTo
│   └── errorHandler.ts      # Global error + 404
├── models/
│   ├── User.ts
│   ├── Course.ts
│   ├── Assignment.ts
│   ├── Attendance.ts
│   ├── Announcement.ts
│   ├── Event.ts
│   └── Discussion.ts
├── routes/                  # One file per resource
├── utils/
│   ├── AppError.ts          # Custom error class
│   ├── asyncHandler.ts      # Wraps async controllers
│   └── paginate.ts          # Reusable pagination helper
└── index.ts                 # App bootstrap
scripts/
└── seed.ts                  # Dev seed data
```

---

## Response Format

All responses follow a consistent shape:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/digital_campus
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change_this_too
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:3000
```

---

## Scripts

```bash
npm run dev      # Development with hot reload
npm run build    # Compile TypeScript
npm run start    # Production (after build)
npm run seed     # Populate DB with sample data
```
