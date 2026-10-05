import { z } from "zod";

/** Form `<input inputMode="decimal">` values arrive as strings, sometimes comma-grouped. */
export const zMoney = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isNaN(n) ? undefined : n;
}, z.number());

export const zPositiveMoney = zMoney.pipe(z.number().positive("ระบุจำนวนเงินให้ถูกต้อง"));
export const zNonNegativeMoney = zMoney.pipe(z.number().nonnegative());

export const zOptionalText = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : null));

export const zEmptyToUndefined = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? v.trim() : undefined));
