// lifeos-data.jsx — Life OS seed data + helpers. Dates are live (today = device date).
const _now = new Date();
const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate(), 9, 0);
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY_ISO = isoOf(TODAY);
const toDate = (iso) => new Date(iso && iso.length === 10 ? iso + 'T09:00' : iso);
const M_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const D_TH = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const money = (n) => window.__losHide ? '฿ •••' : ((n || 0) < 0 ? '−฿' : '฿') + Math.round(Math.abs(n || 0)).toLocaleString('en-US');
const dShort = (iso) => { if (!iso) return '—'; const d = toDate(iso); return `${d.getDate()} ${M_TH[d.getMonth()]}` + (d.getFullYear() !== TODAY.getFullYear() ? ' ' + d.getFullYear() : ''); };
const dLong = (iso) => { if (!iso) return '—'; const d = toDate(iso); return `${d.getDate()} ${M_TH[d.getMonth()]} ${d.getFullYear()}`; };
const daysTo = (iso) => iso ? Math.round((toDate(iso) - TODAY) / 86400000) : 99999;
const relDay = (n) => isoOf(new Date(TODAY.getTime() + n * 86400000));
function dueLabel(iso) {
  if (!iso) return { text: 'ไม่ระบุวัน', tone: '' };
  const n = daysTo(iso);
  if (n < 0) return { text: `เกินกำหนด ${-n} วัน`, tone: 'red' };
  if (n === 0) return { text: 'วันนี้', tone: 'red' };
  if (n === 1) return { text: 'พรุ่งนี้', tone: 'red' };
  if (n <= 7) return { text: `อีก ${n} วัน`, tone: 'amber' };
  return { text: `อีก ${n} วัน`, tone: '' };
}
const lid = () => Math.random().toString(36).slice(2, 9);
function addMonths(iso, n) {
  const d = toDate(iso), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return isoOf(d);
}
const CYCLE_MONTHS = { 'รายเดือน': 1, 'เดือน': 1, 'ทุก 3 เดือน': 3, 'ทุก 6 เดือน': 6, 'รายปี': 12, 'ปี': 12, 'ทุกปี': 12 };
const addCycle = (iso, cycle) => addMonths(iso, CYCLE_MONTHS[cycle] || 1);
function occurrences(start, cycle, from, to) {
  const out = []; let d = start, k = 0;
  while (d && d <= to && k++ < 60) { if (d >= from) out.push(d); d = addCycle(d, cycle); }
  return out;
}

// ── Money ───────────────────────────────────────────────
const LOS_ACCOUNTS = [
  { id: 'cash', name: 'เงินสด', type: 'เงินสด', bal: 3200, bank: 'cash' },
  { id: 'kbank', name: 'กสิกร K PLUS', type: 'ออมทรัพย์', bal: 21450, bank: 'kbank', last4: '4529' },
  { id: 'scb', name: 'ไทยพาณิชย์', type: 'ออมทรัพย์', bal: 16200, bank: 'scb', last4: '8812' },
  { id: 'wallet', name: 'TrueMoney', type: 'e-Wallet', bal: 2000, bank: 'truemoney', last4: '7127' },
];
const LOS_CARDS = [
  { id: 'ktc', name: 'KTC Visa Platinum', bank: 'ktc', network: 'VISA', last4: '3301', limit: 80000, used: 18420, statement: '2026-09-25', due: '2026-10-10', min: 1850 },
  { id: 'scbm', name: 'SCB M Card', bank: 'scb', network: 'Mastercard', last4: '6604', limit: 50000, used: 6130, statement: '2026-09-18', due: '2026-09-28', min: 620 },
];
const LOS_BILLS = [
  { id: 'b_net', domain: 'ais.th', name: 'อินเทอร์เน็ต AIS Fibre', amount: 699, cycle: 'รายเดือน', due: '2026-09-21', account: 'kbank', auto: true },
  { id: 'b_phone', domain: 'ais.th', name: 'ค่ามือถือ', amount: 599, cycle: 'รายเดือน', due: '2026-09-24', account: 'kbank', auto: true },
  { id: 'b_elec', domain: 'mea.or.th', name: 'ค่าไฟ MEA', amount: 1240, cycle: 'รายเดือน', due: '2026-09-28', account: 'scb', auto: false },
  { id: 'b_rent', name: 'ค่าเช่าคอนโด', amount: 8000, cycle: 'รายเดือน', due: '2026-10-01', account: 'scb', auto: false },
  { id: 'b_ins', domain: 'aia.co.th', name: 'ประกันชีวิต AIA', amount: 1500, cycle: 'รายเดือน', due: '2026-10-05', account: 'kbank', auto: true },
];
const LOS_SUBS = [
  { id: 's_net', domain: 'netflix.com', name: 'Netflix', price: 419, cycle: 'เดือน', next: '2026-10-15', src: 'ktc' },
  { id: 's_spot', domain: 'spotify.com', name: 'Spotify', price: 149, cycle: 'เดือน', next: '2026-09-27', src: 'ktc' },
  { id: 's_icl', domain: 'icloud.com', name: 'iCloud 2TB', price: 349, cycle: 'เดือน', next: '2026-10-03', src: 'scbm' },
  { id: 's_gpt', domain: 'chatgpt.com', name: 'ChatGPT Plus', price: 700, cycle: 'เดือน', next: '2026-10-08', src: 'ktc' },
  { id: 's_adobe', domain: 'adobe.com', name: 'Adobe Photography', price: 3990, cycle: 'ปี', next: '2027-02-12', src: 'ktc' },
];
const LOS_INCOME = [{ id: 'i_sal', name: 'เงินเดือน', amount: 58000, day: 25, account: 'kbank' }];
const LOS_PLANS = [{ id: 'p1', name: 'โซฟา SB Design ผ่อน 0%', card: 'ktc', total: 24000, months: 10, paid: 4 }];
const EXP_CATS = ['อาหาร', 'เดินทาง', 'ช้อปปิ้ง', 'บ้าน', 'บิล/ค่าน้ำไฟ', 'บันเทิง', 'สุขภาพ', 'รถ', 'อื่นๆ'];
const INC_CATS = ['เงินเดือน', 'ฟรีแลนซ์', 'โบนัส', 'ขายของ', 'อื่นๆ'];
const LOS_BUDGETS = { 'อาหาร': 8000, 'เดินทาง': 3000, 'ช้อปปิ้ง': 5000, 'บิล/ค่าน้ำไฟ': 4000, 'บันเทิง': 2000, 'รถ': 4000 };
const LOS_TXNS = [
  { id: 'x01', type: 'expense', amount: 8000, date: '2026-09-01', src: 'scb', cat: 'บ้าน', name: 'ค่าเช่าคอนโด' },
  { id: 'x02', type: 'expense', amount: 1040, date: '2026-09-01', src: 'ktc', cat: 'รถ', name: 'เติมน้ำมัน Yaris' },
  { id: 'x03', type: 'expense', amount: 1890, date: '2026-09-04', src: 'ktc', cat: 'ช้อปปิ้ง', name: 'Uniqlo' },
  { id: 'x04', type: 'expense', amount: 640, date: '2026-09-06', src: 'wallet', cat: 'อาหาร', name: 'MK สุกี้' },
  { id: 'x05', type: 'expense', amount: 1240, date: '2026-09-08', src: 'kbank', cat: 'อาหาร', name: 'ซูเปอร์มาร์เก็ต Tops' },
  { id: 'x06', type: 'expense', amount: 320, date: '2026-09-10', src: 'wallet', cat: 'เดินทาง', name: 'Grab' },
  { id: 'x07', type: 'expense', amount: 1111, date: '2026-09-14', src: 'ktc', cat: 'รถ', name: 'เติมน้ำมัน Yaris' },
  { id: 'x08', type: 'expense', amount: 450, date: '2026-09-15', src: 'cash', cat: 'สุขภาพ', name: 'ร้านยา' },
  { id: 'x09', type: 'expense', amount: 980, date: '2026-09-17', src: 'kbank', cat: 'บันเทิง', name: 'ตั๋วหนัง + ป๊อปคอร์น' },
  { id: 'x10', type: 'expense', amount: 1560, date: '2026-09-19', src: 'kbank', cat: 'อาหาร', name: 'ข้าวกับเพื่อน' },
  { id: 'x11', type: 'expense', amount: 185, date: '2026-09-21', src: 'wallet', cat: 'เดินทาง', name: 'BTS + MRT' },
  { id: 'x12', type: 'income', amount: 6500, date: '2026-09-12', src: 'kbank', cat: 'ฟรีแลนซ์', name: 'งานออกแบบโลโก้' },
];
const LOS_NOTIS_DONE = {};
const allSources = () => [...LOS_ACCOUNTS.map(a => ({ ...a, kind: 'account' })), ...LOS_CARDS.map(c => ({ ...c, kind: 'card' }))];
const srcName = (id) => (LOS_ACCOUNTS.find(a => a.id === id) || LOS_CARDS.find(c => c.id === id) || { name: '—' }).name;
const totalBalance = () => LOS_ACCOUNTS.reduce((s, a) => s + (+a.bal || 0), 0);
const cardDebt = () => LOS_CARDS.reduce((s, c) => s + (+c.used || 0), 0);
const monthKey = () => TODAY_ISO.slice(0, 7);
const monthTx = (type) => LOS_TXNS.filter(t => t.type === type && t.date.startsWith(monthKey()));
const monthSpend = () => monthTx('expense').reduce((s, t) => s + t.amount, 0);
const monthIncome = () => monthTx('income').reduce((s, t) => s + t.amount, 0);
const catSpend = () => { const m = {}; monthTx('expense').forEach(t => { m[t.cat] = (m[t.cat] || 0) + t.amount; }); return m; };
function nextIncomeDate(day) {
  const dim = (y, m) => new Date(y, m + 1, 0).getDate();
  let d = new Date(TODAY.getFullYear(), TODAY.getMonth(), Math.min(day, dim(TODAY.getFullYear(), TODAY.getMonth())), 9);
  if (isoOf(d) < TODAY_ISO) d = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, Math.min(day, dim(TODAY.getFullYear(), TODAY.getMonth() + 1)), 9);
  return isoOf(d);
}
function forecast(days = 10) {
  const end = relDay(days), items = [];
  LOS_BILLS.forEach(b => {
    if (b.due < TODAY_ISO) items.push({ name: b.name + ' (ค้างจ่าย)', amount: -b.amount, date: TODAY_ISO });
    occurrences(b.due, b.cycle, TODAY_ISO, end).forEach(d => items.push({ name: b.name, amount: -b.amount, date: d }));
  });
  LOS_SUBS.forEach(s => { if (LOS_ACCOUNTS.find(a => a.id === s.src)) occurrences(s.next, s.cycle, TODAY_ISO, end).forEach(d => items.push({ name: s.name, amount: -s.price, date: d })); });
  LOS_CARDS.forEach(c => { if (c.used > 0 && c.due <= end) items.push({ name: 'ชำระ ' + c.name, amount: -c.used, date: c.due < TODAY_ISO ? TODAY_ISO : c.due }); });
  LOS_INCOME.forEach(i => { let d = nextIncomeDate(i.day), k = 0; while (d <= end && k++ < 24) { items.push({ name: i.name, amount: +i.amount, date: d }); d = addMonths(d, 1); } });
  items.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const out = items.filter(i => i.amount < 0).reduce((s, i) => s - i.amount, 0);
  const inc = items.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0);
  return { start: totalBalance(), out, inc, end: totalBalance() - out + inc, items };
}
const subsMonthly = () => LOS_SUBS.reduce((s, x) => s + (CYCLE_MONTHS[x.cycle] === 12 ? x.price / 12 : x.price), 0);
function upcomingPayments(days = 10) {
  const out = [];
  LOS_BILLS.forEach(b => { if (daysTo(b.due) <= days) out.push({ key: 'b' + b.id, kind: 'bill', ref: b, name: b.name, amount: b.amount, date: b.due, domain: b.domain, sub: b.auto ? 'ตัดอัตโนมัติ · ' + srcName(b.account) : 'จ่ายเอง · ' + srcName(b.account) }); });
  LOS_CARDS.forEach(c => { if (c.used > 0 && daysTo(c.due) <= days) out.push({ key: 'c' + c.id, kind: 'card', ref: c, name: 'ชำระ ' + c.name, amount: c.used, date: c.due, bank: c.bank, sub: 'ขั้นต่ำ ' + money(c.min) }); });
  LOS_SUBS.forEach(s => { if (daysTo(s.next) <= days) out.push({ key: 's' + s.id, kind: 'sub', ref: s, name: s.name, amount: s.price, date: s.next, domain: s.domain, sub: 'ตัดผ่าน ' + srcName(s.src) }); });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}

// ── Assets / Purchases / Warranty ───────────────────────
const LOS_ASSETS = [
  { id: 'a_iphone', name: 'iPhone 17 Pro', kind: 'อุปกรณ์', brand: 'Apple', price: 46900, bought: '2025-10-02', store: 'Apple Store ไอคอนสยาม', serial: 'F7XQ2LL9G4', warranty: '2026-10-02' },
  { id: 'a_mac', name: 'MacBook Pro 14"', kind: 'อุปกรณ์', brand: 'Apple', price: 74900, bought: '2024-06-18', store: 'Studio7', serial: 'C02X1Q8JQ6', warranty: '2027-06-18' },
  { id: 'a_tv', name: 'ทีวี LG OLED 55"', kind: 'เครื่องใช้ไฟฟ้า', brand: 'LG', price: 42000, bought: '2024-11-11', store: 'Power Buy', serial: 'LG55C3TH', warranty: '2026-11-11' },
  { id: 'a_cam', name: 'Fujifilm X-T5', kind: 'อุปกรณ์', brand: 'Fujifilm', price: 63900, bought: '2023-03-05', store: 'Big Camera', serial: 'FX5T2291', warranty: '2025-03-05' },
  { id: 'a_air', name: 'แอร์ Daikin 18000 BTU', kind: 'เครื่องใช้ไฟฟ้า', brand: 'Daikin', price: 28500, bought: '2023-04-20', store: 'HomePro', serial: 'DK18KTH22', warranty: '2028-04-20' },
  { id: 'a_wash', name: 'เครื่องซักผ้า Samsung', kind: 'เครื่องใช้ไฟฟ้า', brand: 'Samsung', price: 17900, bought: '2022-08-09', store: 'HomePro', serial: 'SM9KG2022', warranty: '2025-08-09' },
];
const ASSET_KINDS = ['อุปกรณ์', 'เครื่องใช้ไฟฟ้า', 'เฟอร์นิเจอร์', 'เครื่องประดับ', 'อื่นๆ'];
const warrantyState = (iso) => { if (!iso) return { label: 'ไม่มีประกัน', tone: '' }; const n = daysTo(iso); return n < 0 ? { label: 'หมดประกันแล้ว', tone: '' } : n <= 45 ? { label: `หมดใน ${n} วัน`, tone: 'amber' } : { label: `เหลือ ${Math.round(n / 30)} เดือน`, tone: 'green' }; };
const assetValue = () => LOS_ASSETS.filter(a => !a.sold).reduce((s, a) => s + (+a.price || 0), 0);

// ── Home ────────────────────────────────────────────────
const LOS_HOME = { name: 'คอนโด ลาดพร้าว 71', kind: 'เช่า', rent: 8000, since: '2024-02-01', size: '32 ตร.ม.' };
const LOS_HOME_TASKS = [
  { id: 'h1', name: 'ล้างแอร์', every: 'ทุก 6 เดือน', last: '2026-04-02', next: '2026-10-02', cost: 700 },
  { id: 'h2', name: 'เปลี่ยนไส้กรองน้ำ', every: 'ทุก 6 เดือน', last: '2026-03-15', next: '2026-09-15', cost: 450 },
  { id: 'h3', name: 'ล้างเครื่องซักผ้า', every: 'ทุกปี', last: '2025-12-01', next: '2026-12-01', cost: 800 },
  { id: 'h4', name: 'ตรวจระบบไฟ', every: 'ทุกปี', last: '2026-01-20', next: '2027-01-20', cost: 1200 },
];

// ── Vehicle ─────────────────────────────────────────────
const LOS_VEHICLES = [
  {
    id: 'v_yaris', kind: 'รถยนต์', brand: 'Toyota', model: 'Yaris Ativ 1.2 Sport', year: 2022, plate: '2กก 1234 กรุงเทพฯ',
    vin: 'MR2B29F3X0123456', color: 'เทา', bought: '2022-05-14', price: 599000, mileage: 14450, serviceEvery: 5000,
    insurance: { company: 'วิริยะประกันภัย', policy: 'VIR-2026-884213', premium: 15200, expiry: '2026-10-20' },
    prb: { expiry: '2026-10-20', premium: 645 }, tax: { expiry: '2026-11-14', premium: 1200 },
  },
  {
    id: 'v_pcx', kind: 'มอเตอร์ไซค์', brand: 'Honda', model: 'PCX 160', year: 2024, plate: '1ขค 8899 กรุงเทพฯ',
    vin: 'MLHJK5410P5012233', color: 'ดำ', bought: '2024-03-02', price: 89400, mileage: 6120, serviceEvery: 4000,
    insurance: { company: 'ทิพยประกันภัย', policy: 'TIP-2026-110945', premium: 4200, expiry: '2027-03-01' },
    prb: { expiry: '2027-03-01', premium: 324 }, tax: { expiry: '2027-03-31', premium: 100 },
  },
];
const LOS_SERVICE = [
  { id: 'sv1', vid: 'v_yaris', cat: 'ซ่อมบำรุง', name: 'เปลี่ยนน้ำมันเครื่อง + กรอง', date: '2026-06-02', mileage: 10000, cost: 2400, provider: 'Toyota ลาดพร้าว', note: 'ช่างแนะนำเปลี่ยนใบปัดน้ำฝนรอบหน้า', items: [{ name: 'น้ำมันเครื่อง 4 ลิตร', price: 1450 }, { name: 'กรองน้ำมันเครื่อง', price: 280 }, { name: 'แหวนน็อตถ่าย', price: 25 }, { name: 'ค่าแรง', price: 488 }, { name: 'VAT 7%', price: 157 }, { name: 'ตรวจเช็กช่วงล่าง', price: 0 }] },
  { id: 'sv0', vid: 'v_yaris', cat: 'ล้าง/ดูแล', name: 'ล้างรถ + ดูดฝุ่น', date: '2026-08-10', mileage: 0, cost: 250, provider: '' },
  { id: 'sv2', vid: 'v_yaris', name: 'เช็กระยะ 10,000 กม.', date: '2026-06-02', mileage: 10000, cost: 1800, provider: 'Toyota ลาดพร้าว' },
  { id: 'sv3', vid: 'v_yaris', name: 'เปลี่ยนยาง 4 เส้น', date: '2026-02-18', mileage: 7200, cost: 14800, provider: 'B-Quik' },
  { id: 'sv4', vid: 'v_yaris', name: 'เปลี่ยนแบตเตอรี่', date: '2025-11-08', mileage: 5400, cost: 3200, provider: 'B-Quik' },
  { id: 'sv5', vid: 'v_pcx', name: 'เปลี่ยนน้ำมันเครื่อง', date: '2026-08-22', mileage: 6000, cost: 420, provider: 'Honda Wing ลาดพร้าว' },
  { id: 'sv6', vid: 'v_pcx', name: 'เปลี่ยนยางหลัง', date: '2026-05-10', mileage: 4300, cost: 1650, provider: 'ร้านช่างเอ' },
];
const LOS_FUEL = [
  { id: 'f1', vid: 'v_yaris', date: '2026-09-14', mileage: 14450, liters: 32.1, perL: 34.6, total: 1111 },
  { id: 'f2', vid: 'v_yaris', date: '2026-09-01', mileage: 13960, liters: 30.4, perL: 34.2, total: 1040 },
  { id: 'f3', vid: 'v_yaris', date: '2026-08-18', mileage: 13480, liters: 33.0, perL: 33.9, total: 1119 },
  { id: 'f4', vid: 'v_yaris', date: '2026-08-04', mileage: 12950, liters: 31.2, perL: 34.1, total: 1064 },
  { id: 'f5', vid: 'v_pcx', date: '2026-09-12', mileage: 6120, liters: 5.6, perL: 34.6, total: 194 },
  { id: 'f6', vid: 'v_pcx', date: '2026-09-02', mileage: 5900, liters: 5.2, perL: 34.2, total: 178 },
  { id: 'f7', vid: 'v_pcx', date: '2026-08-21', mileage: 5680, liters: 5.4, perL: 33.9, total: 183 },
];
const serviceOf = (vid) => LOS_SERVICE.filter(s => s.vid === vid).sort((a, b) => a.date < b.date ? 1 : -1);
const fuelOf = (vid) => LOS_FUEL.filter(f => f.vid === vid).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : b.mileage - a.mileage);
const nextServiceKm = (v) => { const e = +v.serviceEvery || 5000; return Math.ceil(((+v.mileage || 0) + 1) / e) * e; };
function fuelStats(vid) {
  const rows = fuelOf(vid), legs = [];
  for (let i = 0; i < rows.length - 1; i++) { const km = rows[i].mileage - rows[i + 1].mileage; if (km > 0) legs.push({ kmPerL: km / rows[i].liters, costPerKm: rows[i].total / km }); }
  const avg = (k) => legs.length ? legs.reduce((s, l) => s + l[k], 0) / legs.length : 0;
  return { kmPerL: avg('kmPerL'), costPerKm: avg('costPerKm'), monthly: rows.filter(r => r.date.startsWith(monthKey())).reduce((s, f) => s + f.total, 0), legs: legs.length };
}
const vehicleYearCost = (v) => { const y = String(TODAY.getFullYear()); return serviceOf(v.id).filter(s => s.date.startsWith(y)).reduce((s, x) => s + x.cost, 0) + fuelOf(v.id).filter(f => f.date.startsWith(y)).reduce((s, f) => s + f.total, 0) + (+(v.insurance || {}).premium || 0) + (+(v.prb || {}).premium || 0) + (+(v.tax || {}).premium || 0); };
const vehicleName = (v) => `${v.brand} ${v.model}`.trim();

// ── Documents / Tasks ───────────────────────────────────
const LOS_DOCS = [
  { id: 'd1', name: 'พาสปอร์ต', type: 'เอกสารบุคคล', expiry: '2029-04-11', rel: '' },
  { id: 'd2', name: 'ใบขับขี่รถยนต์', type: 'เอกสารบุคคล', expiry: '2027-05-14', rel: 'Toyota Yaris' },
  { id: 'd3', name: 'กรมธรรม์ประกันรถ', type: 'ประกัน', expiry: '2026-10-20', rel: 'Toyota Yaris' },
  { id: 'd4', name: 'พ.ร.บ. รถยนต์', type: 'ประกัน', expiry: '2026-10-20', rel: 'Toyota Yaris' },
  { id: 'd5', name: 'ป้ายภาษีรถ', type: 'ทะเบียน', expiry: '2026-11-14', rel: 'Toyota Yaris' },
  { id: 'd6', name: 'ใบเสร็จ iPhone 17 Pro', type: 'ใบเสร็จ', expiry: '', rel: 'iPhone 17 Pro' },
  { id: 'd7', name: 'AppleCare+ iPhone', type: 'ประกัน', expiry: '2026-10-02', rel: 'iPhone 17 Pro' },
  { id: 'd8', name: 'สัญญาเช่าคอนโด', type: 'สัญญา', expiry: '2027-01-31', rel: 'คอนโด ลาดพร้าว 71' },
  { id: 'd9', name: 'ใบรับประกันแอร์ Daikin', type: 'ใบรับประกัน', expiry: '2028-04-20', rel: 'แอร์ Daikin' },
];
const DOC_TYPES = ['เอกสารบุคคล', 'ประกัน', 'ทะเบียน', 'ใบเสร็จ', 'ใบรับประกัน', 'สัญญา', 'อื่นๆ'];
const LOS_TASKS = [
  { id: 't1', name: 'โทรนัดศูนย์เช็กระยะ 15,000 กม.', due: '2026-09-24', pri: 'สูง', rel: 'Toyota Yaris', done: false },
  { id: 't2', name: 'ต่อประกันรถ + พ.ร.บ.', due: '2026-10-10', pri: 'สูง', rel: 'Toyota Yaris', done: false },
  { id: 't3', name: 'นัดช่างล้างแอร์', due: '2026-09-25', pri: 'กลาง', rel: 'แอร์ Daikin', done: false },
  { id: 't4', name: 'ส่งเอกสารเคลมประกันสุขภาพ', due: '2026-09-23', pri: 'กลาง', rel: '', done: false },
];

// ── Calendar / Notifications / Search ───────────────────
function calendarEvents() {
  const ev = [], from = addMonths(TODAY_ISO, -2), to = relDay(420);
  LOS_BILLS.forEach(b => occurrences(b.due, b.cycle, from, to).forEach(d => ev.push({ date: d, kind: 'bill', title: b.name, sub: money(b.amount), tone: 'red', domain: b.domain })));
  LOS_SUBS.forEach(s => occurrences(s.next, s.cycle, from, to).forEach(d => ev.push({ date: d, kind: 'sub', title: s.name, sub: money(s.price), tone: 'accent', domain: s.domain })));
  LOS_CARDS.forEach(c => { if (c.used > 0) ev.push({ date: c.due, kind: 'card', title: 'ชำระ ' + c.name, sub: money(c.used), tone: 'red' }); });
  LOS_INCOME.forEach(i => { let d = nextIncomeDate(i.day), k = 0; while (d <= to && k++ < 14) { ev.push({ date: d, kind: 'income', title: i.name, sub: money(i.amount), tone: 'green' }); d = addMonths(d, 1); } });
  LOS_ASSETS.forEach(a => { if (a.warranty && daysTo(a.warranty) >= 0) ev.push({ date: a.warranty, kind: 'warranty', title: 'ประกัน ' + a.name + ' หมด', sub: 'รับประกันสินค้า', tone: 'amber' }); });
  LOS_HOME_TASKS.forEach(h => ev.push({ date: h.next, kind: 'home', title: h.name, sub: LOS_HOME.name, tone: 'green' }));
  LOS_VEHICLES.forEach(v => {
    if (v.insurance && v.insurance.expiry) ev.push({ date: v.insurance.expiry, kind: 'vehicle', title: 'ประกันรถหมด · ' + v.model, sub: v.plate, tone: 'amber' });
    if (v.tax && v.tax.expiry) ev.push({ date: v.tax.expiry, kind: 'vehicle', title: 'ภาษีรถหมด · ' + v.model, sub: v.plate, tone: 'amber' });
  });
  LOS_TASKS.filter(t => !t.done).forEach(t => ev.push({ date: t.due, kind: 'task', title: t.name, sub: 'งาน · ' + t.pri, tone: '' }));
  LOS_DOCS.forEach(d => { if (d.expiry && daysTo(d.expiry) >= 0 && daysTo(d.expiry) < 400 && !['ประกัน', 'ทะเบียน'].includes(d.type)) ev.push({ date: d.expiry, kind: 'doc', title: d.name + ' หมดอายุ', sub: 'เอกสาร', tone: 'amber' }); });
  return ev.sort((a, b) => a.date < b.date ? -1 : 1);
}
function notifications() {
  const n = [], add = (o) => n.push({ ...o, id: o.key + '@' + o.date, done: !!LOS_NOTIS_DONE[o.key + '@' + o.date] });
  LOS_BILLS.filter(b => daysTo(b.due) <= 8).forEach(b => add({ key: 'bill:' + b.id, group: 'ต้องจ่าย', tone: 'red', title: b.name, sub: money(b.amount) + ' · ' + dueLabel(b.due).text, date: b.due, action: { kind: 'payBill', id: b.id, label: 'จ่าย' }, domain: b.domain }));
  LOS_CARDS.filter(c => c.used > 0 && daysTo(c.due) <= 8).forEach(c => add({ key: 'card:' + c.id, group: 'ต้องจ่าย', tone: 'red', title: 'ชำระ ' + c.name, sub: money(c.used) + ' · ' + dueLabel(c.due).text, date: c.due, action: { kind: 'payCard', id: c.id, label: 'ชำระ' } }));
  LOS_ASSETS.filter(a => a.warranty && daysTo(a.warranty) >= 0 && daysTo(a.warranty) <= 45).forEach(a => add({ key: 'war:' + a.id, group: 'ใกล้หมดอายุ', tone: 'amber', title: 'ประกัน ' + a.name, sub: dueLabel(a.warranty).text, date: a.warranty }));
  LOS_VEHICLES.forEach(v => {
    if (v.insurance && daysTo(v.insurance.expiry) <= 45) add({ key: 'vins:' + v.id, group: 'ใกล้หมดอายุ', tone: 'amber', title: 'ประกันรถ ' + v.model, sub: dueLabel(v.insurance.expiry).text, date: v.insurance.expiry });
    if (v.tax && daysTo(v.tax.expiry) <= 45) add({ key: 'vtax:' + v.id, group: 'ใกล้หมดอายุ', tone: 'amber', title: 'ภาษีรถ ' + v.model, sub: dueLabel(v.tax.expiry).text, date: v.tax.expiry });
    const left = nextServiceKm(v) - v.mileage;
    if (left <= 1000) add({ key: 'vsvc:' + v.id + ':' + nextServiceKm(v), group: 'ต้องเตรียม', tone: 'accent', title: `เช็กระยะ ${nextServiceKm(v).toLocaleString()} กม. · ${v.model}`, sub: `อีก ${left.toLocaleString()} กม.`, date: TODAY_ISO });
  });
  LOS_DOCS.filter(d => d.expiry && daysTo(d.expiry) >= 0 && daysTo(d.expiry) <= 30 && !['ประกัน', 'ทะเบียน'].includes(d.type)).forEach(d => add({ key: 'doc:' + d.id, group: 'ใกล้หมดอายุ', tone: 'amber', title: d.name, sub: dueLabel(d.expiry).text, date: d.expiry }));
  LOS_HOME_TASKS.filter(h => daysTo(h.next) <= 20).forEach(h => add({ key: 'home:' + h.id, group: 'ต้องเตรียม', tone: 'green', title: h.name, sub: h.every + ' · ' + dueLabel(h.next).text, date: h.next, action: { kind: 'homeDone', id: h.id, label: 'ทำแล้ว' } }));
  LOS_TASKS.filter(t => !t.done && daysTo(t.due) <= 1).forEach(t => add({ key: 'task:' + t.id, group: 'ต้องเตรียม', tone: 'accent', title: t.name, sub: 'งาน · ' + dueLabel(t.due).text, date: t.due, action: { kind: 'taskDone', id: t.id, label: 'เสร็จ' } }));
  return n.sort((a, b) => a.date < b.date ? -1 : 1);
}
const openNotiCount = () => notifications().filter(n => !n.done).length;
function searchAll(q) {
  const s = q.trim().toLowerCase(); if (!s) return [];
  const hit = (txt) => String(txt || '').toLowerCase().includes(s);
  const out = [];
  LOS_ACCOUNTS.forEach(a => { if (hit(a.name) || hit(a.last4)) out.push({ kind: 'บัญชี', title: a.name, sub: money(a.bal), nav: 'money' }); });
  LOS_CARDS.forEach(c => { if (hit(c.name) || hit(c.last4)) out.push({ kind: 'บัตรเครดิต', title: c.name, sub: `ใช้ไป ${money(c.used)} · ชำระ ${dShort(c.due)}`, nav: 'bills' }); });
  LOS_TXNS.forEach(t => { if (hit(t.name) || hit(t.cat) || hit(t.note)) out.push({ kind: 'รายการเงิน', title: t.name, sub: `${dShort(t.date)} · ${t.type === 'income' ? '+' : ''}${money(t.amount)} · ${t.cat || ''}`, nav: 'money' }); });
  LOS_BILLS.forEach(b => { if (hit(b.name)) out.push({ kind: 'บิล', title: b.name, sub: `${money(b.amount)} · ${dueLabel(b.due).text}`, nav: 'bills' }); });
  LOS_SUBS.forEach(x => { if (hit(x.name)) out.push({ kind: 'สมาชิกรายเดือน', title: x.name, sub: `${money(x.price)}/${x.cycle}`, nav: 'bills' }); });
  LOS_ASSETS.forEach(a => { if (hit(a.name) || hit(a.brand) || hit(a.serial) || hit(a.store)) out.push({ kind: 'ทรัพย์สิน', title: a.name, sub: `${a.brand} · ${money(a.price)} · ${a.store}`, nav: 'assets' }); });
  LOS_VEHICLES.forEach(v => { if (hit(vehicleName(v)) || hit(v.plate)) out.push({ kind: 'รถ', title: vehicleName(v), sub: v.plate, nav: 'vehicle' }); });
  LOS_SERVICE.forEach(v => { if (hit(v.name) || hit(v.provider)) out.push({ kind: 'ประวัติรถ', title: v.name, sub: `${dShort(v.date)} · ${money(v.cost)} · ${v.provider}`, nav: 'vehicle' }); });
  LOS_DOCS.forEach(d => { if (hit(d.name) || hit(d.rel) || hit(d.type)) out.push({ kind: 'เอกสาร', title: d.name, sub: d.type + (d.rel ? ' · ' + d.rel : ''), nav: 'docs' }); });
  LOS_HOME_TASKS.forEach(h => { if (hit(h.name)) out.push({ kind: 'ดูแลบ้าน', title: h.name, sub: h.every + ' · ครั้งถัดไป ' + dShort(h.next), nav: 'home' }); });
  LOS_TASKS.forEach(t => { if (hit(t.name) || hit(t.rel)) out.push({ kind: 'งาน', title: t.name, sub: 'กำหนด ' + dShort(t.due) + (t.done ? ' · เสร็จแล้ว' : ''), nav: 'calendar' }); });
  return out;
}
Object.assign(window, {
  TODAY, TODAY_ISO, isoOf, toDate, M_TH, MONTHS_TH, D_TH, money, dShort, dLong, daysTo, relDay, dueLabel, lid, addMonths, addCycle, occurrences, CYCLE_MONTHS,
  LOS_ACCOUNTS, LOS_CARDS, LOS_BILLS, LOS_SUBS, LOS_INCOME, LOS_PLANS, LOS_TXNS, LOS_BUDGETS, LOS_NOTIS_DONE, EXP_CATS, INC_CATS,
  allSources, srcName, totalBalance, cardDebt, monthKey, monthTx, monthSpend, monthIncome, catSpend, nextIncomeDate, forecast, subsMonthly, upcomingPayments,
  LOS_ASSETS, ASSET_KINDS, warrantyState, assetValue, LOS_HOME, LOS_HOME_TASKS,
  LOS_VEHICLES, LOS_SERVICE, LOS_FUEL, fuelStats, vehicleYearCost, serviceOf, fuelOf, nextServiceKm, vehicleName,
  LOS_DOCS, DOC_TYPES, LOS_TASKS, calendarEvents, notifications, openNotiCount, searchAll,
});

// trips & split with friends
const LOS_FRIENDS = [{ id: 'mint', name: 'มิ้นท์', color: '#23A36A' }, { id: 'bank', name: 'แบงค์', color: '#3E82CF' }, { id: 'fah', name: 'ฟ้า', color: '#8A5CC4' }, { id: 'guy', name: 'กาย', color: '#E09338' }];
const LOS_TRIPS = [
  { id: 't_jp', name: 'ตะลุยญี่ปุ่น', start: relDay(25), end: relDay(31), currency: 'JPY', rate: 0.23, members: ['me', 'mint', 'bank'], settlements: [], expenses: [
    { id: 'te1', title: 'JR Pass 7 วัน', cat: 'เดินทาง', paidBy: 'me', date: relDay(-20), splitMode: 'equal', amount: 29650, split: ['me', 'mint', 'bank'] },
    { id: 'te2', title: 'โรงแรม Shinjuku 3 คืน', cat: 'ที่พัก', paidBy: 'mint', date: relDay(-18), splitMode: 'equal', amount: 48000, split: ['me', 'mint', 'bank'] },
    { id: 'te3', title: 'ตั๋ว DisneySea', cat: 'เที่ยว/ตั๋ว', paidBy: 'me', date: relDay(-10), splitMode: 'custom', amount: 28200, shares: { me: 10000, mint: 10000, bank: 8200 } },
  ] },
  { id: 't_hy', name: 'เที่ยวหาดใหญ่', start: relDay(-40), end: relDay(-37), currency: 'THB', rate: 1, members: ['me', 'mint', 'bank', 'fah'], settlements: [{ id: 'ts1', from: 'fah', to: 'me', amt: 1500, date: relDay(-35) }], expenses: [
    { id: 'th1', title: 'ตั๋วเครื่องบินไป-กลับ', cat: 'เดินทาง', paidBy: 'me', date: relDay(-40), splitMode: 'equal', amount: 7200, split: ['me', 'mint', 'bank', 'fah'] },
    { id: 'th2', title: 'โรงแรม 2 คืน', cat: 'ที่พัก', paidBy: 'mint', date: relDay(-40), splitMode: 'equal', amount: 6400, split: ['me', 'mint', 'bank', 'fah'] },
    { id: 'th3', title: 'รถตู้เหมาวัน', cat: 'เดินทาง', paidBy: 'bank', date: relDay(-39), splitMode: 'equal', amount: 1800, split: ['me', 'mint', 'bank', 'fah'] },
    { id: 'th4', title: 'คาเฟ่ริมทะเล', cat: 'อาหาร', paidBy: 'me', date: relDay(-38), splitMode: 'equal', amount: 560, split: ['me', 'mint', 'fah'] },
    { id: 'th5', title: 'ดินเนอร์ร้านซีฟู้ด', cat: 'อาหาร', paidBy: 'bank', date: relDay(-38), splitMode: 'items', items: [
      { id: 'i1', name: 'กุ้งเผา + ปูผัดผงกะหรี่', price: 1200, people: ['me', 'mint', 'bank', 'fah'] },
      { id: 'i2', name: 'ไวน์แดง 1 ขวด', price: 900, people: ['me', 'bank', 'fah'] },
      { id: 'i3', name: 'มะพร้าวน้ำหอม', price: 80, people: ['mint'] },
      { id: 'i4', name: 'น้ำส้ม', price: 70, people: ['me'] },
      { id: 'i5', name: 'เบียร์ 2 ขวด', price: 240, people: ['bank', 'fah'] },
    ] },
  ] },
];
Object.assign(window, { LOS_FRIENDS, LOS_TRIPS });

// home construction / renovation projects
const LOS_PROJECTS = [{"id":"pj1","name":"น็อคดาวน์ ต่อเติมหลังบ้าน","kind":"ต่อเติม","status":"กำลังทำ","start":"2023-09-24","end":"","budget":500000,"note":"ต่อเติมครัวและห้องน้ำหลังบ้าน","phases":["น็อคดาวน์","งานดิน","โครงสร้าง","พื้น","ประปา","ห้องน้ำ","ไฟฟ้า","หลังคา"],"bills":[{"id":"pb1","date":"2023-09-24","shop":"พี่แมน","phase":"น็อคดาวน์","items":[{"name":"ค่าแรงขุดต้นไม้","qty":1,"price":150}],"note":""},{"id":"pb2","date":"2023-09-24","shop":"ที่อาจ","phase":"งานดิน","items":[{"name":"ค่าดิน (คันละ 480)","qty":12,"price":480}],"note":""},{"id":"pb3","date":"2023-09-25","shop":"Homepro","phase":"ประปา","items":[{"name":"ถังบำบัด DOS 1200 ลิตร","qty":1,"price":4890}],"note":""},{"id":"pb4","date":"2023-09-27","shop":"บัวใหญ่ค้าเหล็ก","phase":"โครงสร้าง","items":[{"name":"เพลท 6x6","qty":16,"price":80},{"name":"น็อต 3 หุน 5\"","qty":64,"price":10},{"name":"น็อตตัวเมีย 3 หุน 0.5 กก.","qty":1,"price":50}],"note":""},{"id":"pb5","date":"2023-10-03","shop":"ชูมิตร","phase":"ประปา","items":[{"name":"เหล็กไวเมช 2x50 ม.","qty":1,"price":1740},{"name":"ท่อ PVC 4 นิ้ว","qty":2,"price":585},{"name":"สามทาง 4\"x2\"","qty":1,"price":320},{"name":"สามทาง 4\" บาง","qty":1,"price":135},{"name":"ข้องอ 4\" บาง","qty":2,"price":90},{"name":"ท่อ PVC 2 นิ้ว","qty":2,"price":165},{"name":"ข้องอ 2\" บาง","qty":10,"price":25},{"name":"กาวท่อ 500g","qty":1,"price":290},{"name":"อิฐแดงเล็ก","qty":100,"price":1.3}],"note":""},{"id":"pb6","date":"2023-10-03","shop":"เกษรประจักษ์","phase":"ประปา","items":[{"name":"ถังส้วม 60 ซม.","qty":1,"price":80},{"name":"ฝาถัง 60 ซม.","qty":1,"price":40}],"note":""},{"id":"pb7","date":"2023-10-05","shop":"CPAC โนนตาเถร","phase":"พื้น","items":[{"name":"เทพื้น CPAC (คิว)","qty":7,"price":2225.6}],"note":""},{"id":"pb8","date":"2023-10-05","shop":"เกษรประจักษ์","phase":"พื้น","items":[{"name":"ทรายหยาบ 1 คิว","qty":1,"price":450},{"name":"หิน 1 คิว","qty":1,"price":680},{"name":"ปูนช้าง","qty":3,"price":155}],"note":""},{"id":"pb9","date":"2023-10-10","shop":"CPAC โนนตาเถร","phase":"พื้น","items":[{"name":"เทพื้น CPAC (คิว)","qty":6,"price":2225.6}],"note":""},{"id":"pb10","date":"2023-10-11","shop":"HOMEPRO","phase":"ห้องน้ำ","items":[{"name":"สุขภัณฑ์ MOYA SN-T005 3/4.8L","qty":2,"price":2785}],"note":"สั่งผ่าน Shopee"},{"id":"pb11","date":"2023-10-17","shop":"บัวใหญ่ค้าเหล็ก","phase":"โครงสร้าง","items":[{"name":"เหล็กกล่อง 4x4 หนา 1.5","qty":6,"price":800},{"name":"เหล็กกล่อง 4x2 หนา 1.2","qty":16,"price":450},{"name":"เหล็กกล่อง 2x1 หนา 1.2","qty":11,"price":220}],"note":""}],"crews":[{"id":"cw1","name":"พี่แมน","role":"ผู้รับเหมา (ค่าแรง)","phone":"","contract":228000,"scope":"ค่าแรงทั้งโครงการ ไม่รวมวัสดุ","draws":[{"id":"dw1","date":"2023-09-25","amt":10000,"note":"เบิกงวดแรก"},{"id":"dw2","date":"2023-10-05","amt":30000,"note":"เบิกค่าแรง"}]}]}];
Object.assign(window, { LOS_PROJECTS });
