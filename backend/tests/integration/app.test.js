const request = require("supertest");
const app = require("../../src/app");

describe("GET /", () => {
  test("returns the health-check message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Event api is working" });
  });
});
