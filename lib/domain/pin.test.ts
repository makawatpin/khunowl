import { describe, expect, it } from "vitest";
import { pinHash } from "./pin";

describe("pinHash", () => {
  it("is deterministic for the same PIN", () => {
    expect(pinHash("1234")).toBe(pinHash("1234"));
  });
  it("differs for different PINs", () => {
    expect(pinHash("1234")).not.toBe(pinHash("4321"));
  });
  it("always returns a numeric string (unsigned 32-bit)", () => {
    expect(pinHash("0000")).toMatch(/^\d+$/);
  });
});
