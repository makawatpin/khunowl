import { describe, expect, it } from "vitest";
import { isOwnUploadPath } from "./uploads";

const uid = "3f2b8a1c-0d4e-4f6a-9b7c-1e2d3c4b5a69";
const file = "0b9f5a3e-2c1d-4e8f-a7b6-5c4d3e2f1a0b";

describe("isOwnUploadPath", () => {
  it("accepts <uid>/<kind>/<uuid>.<ext> for the caller's own folder", () => {
    expect(isOwnUploadPath(`${uid}/receipts/${file}.jpg`, uid, "receipts")).toBe(true);
    expect(isOwnUploadPath(`${uid}/docs/${file}.pdf`, uid, "docs")).toBe(true);
  });
  it("rejects another user's folder", () => {
    expect(isOwnUploadPath(`aaaaaaaa-0d4e-4f6a-9b7c-1e2d3c4b5a69/receipts/${file}.jpg`, uid, "receipts")).toBe(false);
  });
  it("rejects the wrong kind folder", () => {
    expect(isOwnUploadPath(`${uid}/docs/${file}.jpg`, uid, "receipts")).toBe(false);
  });
  it("rejects traversal and malformed names", () => {
    expect(isOwnUploadPath(`${uid}/receipts/../x/${file}.jpg`, uid, "receipts")).toBe(false);
    expect(isOwnUploadPath(`${uid}/receipts/evil.jpg`, uid, "receipts")).toBe(false);
    expect(isOwnUploadPath(`${uid}/receipts/${file}`, uid, "receipts")).toBe(false);
  });
});
