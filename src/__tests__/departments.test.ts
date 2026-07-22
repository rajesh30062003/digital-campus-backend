/**
 * Department API Tests
 */

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index";

let mongo: MongoMemoryServer;
let adminToken: string;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  // Create admin user and get token
  const reg = await request(app).post("/api/auth/register").send({
    name: "Admin User",
    email: "admin@test.com",
    password: "admin1234",
  });
  // Manually elevate to admin in DB
  await mongoose.connection.collection("users").updateOne(
    { email: "admin@test.com" },
    { $set: { role: "admin" } }
  );
  const login = await request(app).post("/api/auth/login").send({
    email: "admin@test.com",
    password: "admin1234",
  });
  adminToken = login.body.accessToken;
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe("GET /api/departments", () => {
  it("should return empty array when no departments exist", async () => {
    const res = await request(app)
      .get("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.departments).toBeInstanceOf(Array);
  });
});

describe("POST /api/departments", () => {
  it("should create a department as admin", async () => {
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Computer Science", code: "CSE", description: "CS Dept" });
    expect(res.status).toBe(201);
    expect(res.body.data.department.name).toBe("Computer Science");
    expect(res.body.data.department.code).toBe("CSE");
  });

  it("should reject duplicate department code", async () => {
    await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "CS", code: "CSE" });
    const res = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Computer Science", code: "CSE" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("should reject unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/departments")
      .send({ name: "Physics", code: "PHY" });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/departments/:id", () => {
  it("should update a department", async () => {
    const create = await request(app)
      .post("/api/departments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Electronics", code: "ECE" });
    const id = create.body.data.department._id;

    const res = await request(app)
      .patch(`/api/departments/${id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Electronics & Communication" });
    expect(res.status).toBe(200);
    expect(res.body.data.department.description).toBe("Electronics & Communication");
  });
});
