const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");
const { MongoMemoryServer } = require("mongodb-memory-server");
const authRoutes = require("../routes/authRoutes");
const { notFound, errorHandler } = require("../middleware/errorMiddleware");

process.env.JWT_SECRET = "test_secret";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe("auth flow", () => {
  const credentials = { name: "Test User", email: "test@example.com", password: "password123" };

  it("signs up, then logs in, then accesses a protected route with the token", async () => {
    const signup = await request(app).post("/api/auth/signup").send(credentials);
    expect(signup.status).toBe(201);
    expect(signup.body.token).toBeDefined();

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });
    expect(login.status).toBe(200);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(credentials.email);
  });

  it("rejects login with the wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });

  it("rejects a protected route with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
