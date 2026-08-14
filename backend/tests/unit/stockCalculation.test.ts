import { calculateAvailableStock } from "../../src/services/stockCalculation";

describe("calculateAvailableStock", () => {
  test("subtracts reserved quantity from total count", () => {
    expect(calculateAvailableStock(10, 3)).toBe(7);
  });

  test("returns 0 when reserved quantity equals total count", () => {
    expect(calculateAvailableStock(5, 5)).toBe(0);
  });

  test("allows a request that exactly matches remaining stock", () => {
    const available = calculateAvailableStock(10, 8);
    const requested = 2;
    expect(requested <= available).toBe(true);
  });

  test("rejects a request greater than remaining stock", () => {
    const available = calculateAvailableStock(10, 9);
    const requested = 2;
    expect(requested <= available).toBe(false);
  });
});
