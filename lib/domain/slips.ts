// Ported from design-reference/lifeos-slips.jsx — pure text parsing only.
// Tesseract.js OCR wiring (image → text) is a client-side concern that lands with
// README §10 step 9; this module takes OCR'd text and extracts a transaction draft.
const TH_MONTHS: Record<string, number> = {
  "มค": 1, "มกราคม": 1, "กพ": 2, "กุมภาพันธ์": 2, "มีค": 3, "มีนาคม": 3, "เมย": 4, "เมษายน": 4,
  "พค": 5, "พฤษภาคม": 5, "มิย": 6, "มิถุนายน": 6, "กค": 7, "กรกฎาคม": 7, "สค": 8, "สิงหาคม": 8,
  "กย": 9, "กันยายน": 9, "ตค": 10, "ตุลาคม": 10, "พย": 11, "พฤศจิกายน": 11, "ธค": 12, "ธันวาคม": 12,
};
const EN_MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function slipYear(yRaw: number): number {
  let y = yRaw;
  if (y < 100) y += y >= 40 ? 2500 : 2000;
  if (y > 2400) y -= 543; // Buddhist Era → Gregorian
  return y;
}
function slipIso(y: number, m: number, d: number): string | null {
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` : null;
}

export function slipDate(text: string, todayISO: string): string {
  const thRe = /(\d{1,2})\s*([ก-๙.]{2,12})\s*(\d{2,4})/g;
  let m: RegExpExecArray | null;
  while ((m = thRe.exec(text))) {
    const key = m[2].replace(/[.\s]/g, "");
    if (TH_MONTHS[key]) {
      const iso = slipIso(slipYear(+m[3]), TH_MONTHS[key], +m[1]);
      if (iso) return iso;
    }
  }
  const en = text.match(/(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*,?\s*(\d{2,4})/i);
  if (en) {
    const iso = slipIso(slipYear(+en[3]), EN_MONTHS[en[2].toLowerCase()], +en[1]);
    if (iso) return iso;
  }
  const numeric = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (numeric) {
    const iso = slipIso(slipYear(+numeric[3]), +numeric[2], +numeric[1]);
    if (iso) return iso;
  }
  return todayISO;
}

function slipNum(s: string): number | null {
  const m = (s || "").replace(/\s/g, "").match(/(\d{1,3}(?:,\d{3})+|\d+)\.\d{2}/);
  return m ? parseFloat(m[0].replace(/,/g, "")) : null;
}

export function slipAmount(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (/จำนวน|amount|ยอดเงิน|ยอดชำระ|ยอดโอน/i.test(lines[i]) && !/ค่าธรรมเนียม|fee/i.test(lines[i])) {
      const v = slipNum(lines[i]) ?? slipNum(lines[i + 1] ?? "");
      if (v && v > 0) return v;
    }
  }
  for (const l of lines) {
    if (/บาท|THB|฿/i.test(l) && !/ค่าธรรมเนียม|fee/i.test(l)) {
      const v = slipNum(l);
      if (v && v > 0) return v;
    }
  }
  const all = lines.map(slipNum).filter((v): v is number => !!v && v > 0);
  return all.length ? Math.max(...all) : 0;
}

export function slipRef(lines: string[], text: string): string {
  for (let i = 0; i < lines.length; i++) {
    const k = lines[i].match(/(เลขที่รายการ|รหัสอ้างอิง|หมายเลขอ้างอิง|เลขอ้างอิง|ref(?:erence)?\.?\s*(?:no|id)?|transaction\s*(?:id|no)?)/i);
    if (k) {
      const rest = lines[i].slice(lines[i].indexOf(k[0]) + k[0].length) + " " + (lines[i + 1] || "");
      const m = rest.replace(/[:：]/g, " ").match(/[A-Za-z0-9]{10,}/g);
      const hit = m && m.find((x) => /\d{4,}/.test(x));
      if (hit) return hit;
    }
  }
  const toks = (text.match(/[A-Za-z0-9]{14,}/g) || []).filter((x) => (x.match(/\d/g) || []).length >= 6);
  return toks[0] || "";
}

const NAME_RE = /(นางสาว|นาย|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|บจก\.?|บริษัท|หจก\.?|ร้าน|MRS?\.?|MS\.?|MISS)\s*[^\d\n]{2,40}/i;
const slipClean = (s: string): string =>
  (s || "")
    .replace(/[xX*•\d][xX*•\d\-\s]{5,}.*$/, "")
    .replace(/(ธนาคาร|bank).*$/i, "")
    .replace(/[|"'`_]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 40);

export function slipNames(lines: string[]): { to: string; from: string } {
  const after = (re: RegExp): string => {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(re);
      if (m) {
        const r = lines[i].slice((m.index ?? 0) + m[0].length).replace(/^[\s:：]+/, "");
        return r.length > 1 ? r : lines[i + 1] || "";
      }
    }
    return "";
  };
  let to = after(/^(ไปยัง|ไปที่|ถึง|ผู้รับ(เงิน)?|to)\b/i);
  let from = after(/^(จาก|ผู้โอน|from)\b/i);
  const names = lines.filter((l) => NAME_RE.test(l)).map((l) => l.match(NAME_RE)![0]);
  if (!to && names.length >= 2) to = names[1];
  if (!from && names.length) from = names[0];
  if (!to) {
    const k = lines.findIndex((l) => /ชำระ(เงิน)?|จ่ายบิล|payment|merchant|ร้านค้า|biller/i.test(l));
    if (k >= 0) to = lines[k + 1] || "";
  }
  return { to: slipClean(to), from: slipClean(from) };
}

export const SLIP_BANKS: [string, RegExp][] = [
  ["make", /make\s?by\s?k/i], ["kept", /\bkept\b/i], ["paotang", /เป๋าตัง|paotang/i], ["clicx", /clicx/i],
  ["kbank", /กสิกร|k\s?plus|kbank|kasikorn/i], ["scb", /ไทยพาณิชย์|scb\s?easy|\bscb\b/i],
  ["ktb", /กรุงไทย|krungthai|\bktb\b|เป๋าตัง/i], ["bay", /กรุงศรี|krungsri/i], ["ttb", /\bttb\b|ทีทีบี|ทหารไทย/i],
  ["gsb", /ออมสิน|mymo|\bgsb\b/i], ["bbl", /ธนาคารกรุงเทพ|bangkok\s?bank|bualuang/i],
  ["truemoney", /true\s?money|ทรูมันนี่/i], ["uob", /\buob\b|ยูโอบี/i], ["cimb", /cimb|ซีไอเอ็มบี/i],
  ["lhb", /lh\s?bank|แลนด์\s?แอนด์|\blhb\b/i], ["kkp", /\bkkp\b|เกียรตินาคิน/i], ["tisco", /tisco|ทิสโก้/i],
  ["baac", /ธ\.?ก\.?ส|baac/i], ["ghb", /อาคารสงเคราะห์|\bghb\b|ธอส/i], ["ibank", /ธนาคารอิสลาม|ibank/i],
  ["icbc", /icbc|ไอซีบีซี/i], ["linebk", /line\s?bk/i], ["dime", /\bdime\b/i], ["shopeepay", /shopee\s?pay|ช้อปปี้เพย์/i],
];

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ["รถ", /\bptt\b|ปตท|shell|เชลล์|bangchak|บางจาก|caltex|esso|น้ำมัน|pt\s?station/i],
  ["เดินทาง", /grab(?!food)|bolt|\bbts\b|\bmrt\b|taxi|แท็กซี่|easy\s?pass|m-?flow|ทางด่วน/i],
  ["บิล/ค่าน้ำไฟ", /การไฟฟ้า|\bmea\b|\bpea\b|ประปา|\bais\b|true\s?move|dtac|3bb|internet|ค่าไฟ|ค่าน้ำ/i],
  ["ช้อปปิ้ง", /shopee|lazada|ลาซาด้า|ช้อปปี้|central|uniqlo|homepro|โฮมโปร|ikea|tiktok/i],
  ["บันเทิง", /netflix|spotify|youtube|major|sf\s?cinema|steam|disney/i],
  ["สุขภาพ", /โรงพยาบาล|hospital|คลินิก|clinic|ร้านยา|pharmacy|ทันตกรรม/i],
  ["อาหาร", /อาหาร|food|cafe|คาเฟ่|กาแฟ|coffee|ข้าว|ก๋วยเตี๋ยว|ชาบู|หมูกระทะ|7-?eleven|เซเว่น|lotus|โลตัส|big\s?c|makro|แม็คโคร|tops|line\s?man|foodpanda|robinhood/i],
];

export function slipCategory(opts: {
  name: string;
  text: string;
  expenseCategories: string[];
  pastCategoryForName?: (name: string) => string | undefined;
}): string {
  const { name, text, expenseCategories, pastCategoryForName } = opts;
  const past = name ? pastCategoryForName?.(name) : undefined;
  if (past && expenseCategories.includes(past)) return past;
  const hit = CATEGORY_KEYWORDS.find(([c, re]) => expenseCategories.includes(c) && (re.test(name || "") || re.test(text)));
  return hit ? hit[0] : expenseCategories.includes("อื่นๆ") ? "อื่นๆ" : expenseCategories[expenseCategories.length - 1];
}

export interface ParsedSlip {
  amount: number;
  date: string;
  time: string;
  ref: string;
  name: string;
  from: string;
  bank: string;
  category: string;
  type: "expense";
  raw: string;
}

export function parseSlip(opts: {
  text: string;
  todayISO: string;
  expenseCategories: string[];
  pastCategoryForName?: (name: string) => string | undefined;
}): ParsedSlip {
  const { text, todayISO, expenseCategories, pastCategoryForName } = opts;
  const lines = (text || "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const head = lines.slice(0, 6).join(" ");
  const bank = (SLIP_BANKS.find(([, re]) => re.test(head)) || SLIP_BANKS.find(([, re]) => re.test(text)) || [""])[0];
  const { to, from } = slipNames(lines);
  const tm = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  const name = to || "โอนเงิน";
  return {
    amount: slipAmount(lines),
    date: slipDate(text, todayISO),
    time: tm ? `${tm[1].padStart(2, "0")}:${tm[2]}` : "",
    ref: slipRef(lines, text),
    name,
    from,
    bank,
    category: slipCategory({ name, text, expenseCategories, pastCategoryForName }),
    type: "expense",
    raw: text,
  };
}

/** True if this slip was likely already imported (same bank ref, or same amount+date+name as an existing txn). */
export function slipIsDuplicate(
  p: Pick<ParsedSlip, "ref" | "type" | "amount" | "date" | "name">,
  existingRefs: ReadonlySet<string>,
  batchRefs: readonly string[],
  existingTxns: readonly { type: string; amount: number; date: string; name: string }[],
): boolean {
  if (p.ref && (existingRefs.has(`slip:${p.ref}`) || batchRefs.includes(p.ref))) return true;
  return existingTxns.some((t) => t.type === p.type && Math.abs(t.amount - p.amount) < 0.01 && t.date === p.date && t.name === p.name);
}
