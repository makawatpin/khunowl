import { formatInTimeZone } from "date-fns-tz";

const TZ = "Asia/Bangkok";

/** "Today" as an Asia/Bangkok `date` string — never read `new Date()` raw (CLAUDE.md). */
export function todayISOInBangkok(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

export function nowHourInBangkok(): number {
  return Number(formatInTimeZone(new Date(), TZ, "H"));
}

const DAY_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTH_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export function todayLongLabelInBangkok(): string {
  const iso = todayISOInBangkok();
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = DAY_TH[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday} ${d} ${MONTH_TH[m - 1]} ${y}`;
}
