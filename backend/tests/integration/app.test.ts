import request from "supertest";
import app from "../../src/app";

describe("GET /", () => {
  test("returns the health-check message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Event api is working" });
  });
});

describe("security headers", () => {
  test("helmet sets its defensive headers on every response", async () => {
    const response = await request(app).get("/");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    // helmet removes this one rather than setting it.
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  test("rate limiting stays out of the way under NODE_ENV=test", async () => {
    // The suite fires far more than the configured budget; if the limiters were
    // active here every later test would start failing with a 429.
    const responses = await Promise.all(
      Array.from({ length: 40 }, () => request(app).get("/api/events"))
    );

    expect(responses.some((response) => response.status === 429)).toBe(false);
  });
});
