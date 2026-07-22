# Digital Campus ERP — Standalone Backend

> **Node.js + Express + TypeScript + MongoDB Backend REST API**  
> *Independent Backend Repository for Digital Campus ERP System*

---

## 🌟 Overview

`digital-campus-backend` is the standalone Express backend engine for the Digital Campus Enterprise Resource Planning (ERP) platform. It provides high-performance RESTful API endpoints for authentication, RBAC authorization, multi-tenant university management, course registration, grading, AI clinical support, and enterprise audit logging.

---

## 📁 Repository Directory Structure

```
digital-campus-backend/
├── scripts/                # CLI administration scripts (seed, create-admin, reset-users)
├── src/
│   ├── config/             # Database connection & env validation
│   ├── controllers/        # REST route controller handlers
│   ├── middleware/         # Auth JWT verification, RBAC, tenant context, error handling
│   ├── models/             # Mongoose schemas with compound indexes
│   ├── routes/             # Express API route declarations
│   ├── services/           # Business domain logic & background tasks
│   ├── utils/              # Cryptographic helpers, logger, JWT signers
│   └── index.ts            # Main Express application entry point
├── .env.example            # Sample environment variables
├── .gitignore              # Git ignore rules
├── jest.config.json        # Unit & integration testing configuration
├── package.json            # Node.js dependencies & scripts
├── render.yaml             # Render Infrastructure as Code blueprint
└── tsconfig.json           # TypeScript configuration
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or a **MongoDB Atlas** cluster URI.

### 2. Installation
```bash
# Navigate to backend project directory
cd digital-campus-backend

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in `.env` with your database and JWT secret key:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/digital_campus_erp
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### 4. Seed Database (Optional)
Populate initial default administrator and demo user accounts:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
The Express server will start listening at [http://localhost:5000](http://localhost:5000).

---

## 📦 Production Build & Testing

```bash
# Run Unit & Integration Tests
npm test

# Build TypeScript to dist/ JavaScript
npm run build

# Start Production Server
npm start
```

---

## ☁️ Deployment to Render

`digital-campus-backend` is ready for instant deployment to **Render**.

### Step-by-Step Render Deployment:

1. **Push to GitHub**:
   Create a standalone GitHub repository named `digital-campus-backend` and push this directory.
   ```bash
   git init
   git add .
   git commit -m "Initial commit of digital-campus-backend"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/digital-campus-backend.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Log in to your [Render Dashboard](https://dashboard.render.com).
   - Click **New +** > **Web Service**.
   - Connect your GitHub repository `digital-campus-backend`.
   - Set the build settings:
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Starter or Standard

3. **Configure Environment Variables in Render**:
   Under **Environment**, set:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's internal port)
   - `MONGODB_URI`: `mongodb+srv://...` (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: A strong random string (32+ characters)
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
   - `CORS_ORIGIN`: `https://your-frontend.vercel.app`
   - `GEMINI_API_KEY`: Your Gemini API key

4. Click **Create Web Service**. Render will build and deploy the containerized Express backend.

---

## 🔐 System Architecture & Security Highlights

- **JWT Dual Token Architecture**: Short-lived access tokens with HTTP-only secure refresh token rotation.
- **Role-Based Access Control (RBAC)**: Enforced via `authorize("admin", "superadmin")` middleware.
- **Defensive Input Sanitization**: Rejects XSS and Mongo Injection payloads before reaching controllers.
- **Performance**: High-efficiency compression, indexing on user and course collections, and connection pooling.
