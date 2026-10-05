// Trimmed from design-reference/lifeos-forms.jsx (BANK_OPTS) and lifeos-ui.jsx
// (BANK_MARKS colors). Full bank logo images (BANK_IMG/logoUrl) are deferred —
// this is the plain colored-badge fallback the prototype itself uses when a
// logo can't be loaded.
export const BANK_OPTIONS: [string, string][] = [
  ["kbank", "กสิกรไทย"], ["scb", "ไทยพาณิชย์"], ["ktb", "กรุงไทย"], ["bbl", "กรุงเทพ"],
  ["ttb", "ทีทีบี"], ["bay", "กรุงศรี"], ["gsb", "ออมสิน"], ["ktc", "KTC"],
  ["cardx", "CardX (SCB)"], ["krungsricard", "กรุงศรี คาร์ด / The 1"], ["firstchoice", "กรุงศรี เฟิร์สช้อยส์"],
  ["aeon", "อิออน (AEON)"], ["amex", "American Express"], ["umay", "UMAY+"], ["citi", "Citi (UOB)"],
  ["uob", "ยูโอบี"], ["cimb", "ซีไอเอ็มบี"], ["lhb", "แลนด์ แอนด์ เฮ้าส์"], ["kkp", "เกียรตินาคินภัทร"],
  ["tisco", "ทิสโก้"], ["baac", "ธ.ก.ส."], ["ghb", "อาคารสงเคราะห์"], ["ibank", "อิสลาม"],
  ["icbc", "ไอซีบีซี"], ["linebk", "LINE BK"], ["dime", "Dime!"], ["make", "MAKE by KBank"],
  ["kept", "Kept by Krungsri"], ["paotang", "เป๋าตัง"], ["clicx", "ClicX"], ["truemoney", "TrueMoney"],
  ["shopeepay", "ShopeePay"], ["cash", "เงินสด / อื่นๆ"],
];

const BANK_COLOR: Record<string, { bg: string; fg: string; short: string }> = {
  kbank: { bg: "#00A94F", fg: "#fff", short: "K" }, scb: { bg: "#4E2A84", fg: "#fff", short: "SCB" },
  ktb: { bg: "#00A0E9", fg: "#fff", short: "KTB" }, bbl: { bg: "#1E4598", fg: "#fff", short: "BBL" },
  ttb: { bg: "#0B54A4", fg: "#fff", short: "ttb" }, bay: { bg: "#FFD400", fg: "#4B3B00", short: "BAY" },
  gsb: { bg: "#EB198D", fg: "#fff", short: "GSB" }, ktc: { bg: "#0B3D91", fg: "#fff", short: "KTC" },
  truemoney: { bg: "#F04B24", fg: "#fff", short: "TMN" }, uob: { bg: "#0B3B8C", fg: "#fff", short: "UOB" },
  cimb: { bg: "#D7182A", fg: "#fff", short: "CIMB" }, cash: { bg: "#2F3542", fg: "#fff", short: "฿" },
};

export function bankBadge(bank: string | null | undefined): { bg: string; fg: string; short: string } {
  if (bank && BANK_COLOR[bank]) return BANK_COLOR[bank];
  const short = (bank || "?").slice(0, 2).toUpperCase();
  return { bg: "var(--panel-2)", fg: "var(--ink-soft)", short };
}

export function bankLabel(bank: string | null | undefined): string {
  return BANK_OPTIONS.find(([k]) => k === bank)?.[1] ?? bank ?? "";
}
