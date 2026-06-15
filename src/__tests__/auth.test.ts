/**
 * Auth Controller Tests
 * Run with: npx jest --config jest.config.json
 * Requires: npm install -D jest ts-jest supertest @types/jest @types/supertest mongodb-memory-server
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("POST /api/auth/register", () => {
  it("should register a new user with default student role", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Student",
      email: "student@test.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe("student");
    expect(res.body.accessToken).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "User One",
      email: "dup@test.com",
      password: "password123",
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "User Two",
      email: "dup@test.com",
      password: "password456",
    });
    expect(res.status).toBe(409);
  });

  it("should reject short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Short Pass",
      email: "short@test.com",
      password: "123",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Login User",
      email: "login@test.com",
      password: "password123",
    });
  });

  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe("login@test.com");
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@test.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("should reject unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@test.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("should return current user with valid token", async () => {
    const reg = await request(app).post("/api/auth/register").send({
      name: "Me User",
      email: "me@test.com",
      password: "password123",
    });
    const token = reg.body.accessToken;
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("me@test.com");
  });

  it("should reject request without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
