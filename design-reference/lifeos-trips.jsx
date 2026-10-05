// lifeos-trips.jsx — trips, split with friends (equal / items / custom), settle up
const TRIP_CUR = { THB: { s: '฿', r: 1, n: 'บาทไทย' }, JPY: { s: '¥', r: 0.23, n: 'เยนญี่ปุ่น' }, KRW: { s: '₩', r: 0.026, n: 'วอนเกาหลี' }, CNY: { s: 'CN¥', r: 4.7, n: 'หยวนจีน' }, TWD: { s: 'NT$', r: 1.05, n: 'ดอลลาร์ไต้หวัน' }, SGD: { s: 'S$', r: 26, n: 'ดอลลาร์สิงคโปร์' }, VND: { s: '₫', r: 0.0014, n: 'ดองเวียดนาม' }, USD: { s: '$', r: 34, n: 'ดอลลาร์สหรัฐ' }, EUR: { s: '€', r: 37, n: 'ยูโร' }, GBP: { s: '£', r: 44, n: 'ปอนด์' } };
const TRIP_NODEC = ['JPY', 'KRW', 'TWD', 'VND'];
const TRIP_CATS = [['อาหาร', 'food'], ['ที่พัก', 'house'], ['เดินทาง', 'car'], ['เที่ยว/ตั๋ว', 'star'], ['ช้อปปิ้ง', 'box'], ['ของฝาก', 'box'], ['อื่นๆ', 'more']];
const tripCatIcon = (c) => (TRIP_CATS.find(x => x[0] === c) || [0, 'more'])[1];
const AV_COLORS = ['#23A36A', '#3E82CF', '#8A5CC4', '#E09338', '#E0456F', '#0E8A4A', '#C8117A', '#4A5364'];
function tPerson(id) { if (id === 'me') return { id: 'me', name: 'ฉัน', color: 'var(--accent-deep)' }; return LOS_FRIENDS.find(f => f.id === id) || { id, name: '?', color: '#A4A8AD' }; }
const pName = (id) => tPerson(id).name;
const avText = (n) => /^[เแโใไ]/.test(n) ? n.slice(0, 2) : n.slice(0, 1);
function Av({ id, p, size = 28 }) { const x = p || tPerson(id); return <span className="av" style={{ width: size, height: size, background: x.color, fontSize: size * 0.42 }}>{avText(x.name)}</span>; }
function AvStack({ ids, size = 26 }) { return <span className="avs">{ids.slice(0, 5).map(i => <Av key={i} id={i} size={size} />)}{ids.length > 5 && <span className="av" style={{ width: size, height: size, background: 'var(--panel-2)', color: 'var(--ink-soft)', fontSize: size * 0.38 }}>+{ids.length - 5}</span>}</span>; }
const PChip = ({ id, p, on, onClick, disabled }) => { const x = p || tPerson(id); return <button type="button" className={'chip pchip' + (on ? ' on' : '')} onClick={onClick} disabled={disabled}><Av p={x} size={24} />{x.name}</button>; };
function fmtC(a, code) {
  const c = TRIP_CUR[code] || TRIP_CUR.THB; if (window.__losHide) return c.s + ' •••';
  const v = Math.abs(a || 0), nd = TRIP_NODEC.includes(code);
  return ((a || 0) < -0.004 ? '−' : '') + c.s + v.toLocaleString('en-US', nd ? { maximumFractionDigits: 0 } : { maximumFractionDigits: 2, minimumFractionDigits: Math.round(v * 100) % 100 ? 2 : 0 });
}
const r2 = (x) => Math.round(x * 100) / 100;
function tAmt(e) { return e.splitMode === 'items' ? (e.items || []).reduce((s, it) => s + (+it.price || 0), 0) : (+e.amount || 0); }
function tShares(e) {
  const o = {}, add = (id, v) => { o[id] = (o[id] || 0) + v; };
  if (e.splitMode === 'items') (e.items || []).forEach(it => { const p = it.people && it.people.length ? it.people : [e.paidBy]; p.forEach(id => add(id, (+it.price || 0) / p.length)); });
  else if (e.splitMode === 'custom') Object.entries(e.shares || {}).forEach(([id, v]) => add(id, +v || 0));
  else { const p = e.split || []; p.forEach(id => add(id, (+e.amount || 0) / p.length)); }
  return o;
}
function tBalances(t) {
  const b = {}; t.members.forEach(m => { b[m] = 0; });
  t.expenses.forEach(e => { b[e.paidBy] = (b[e.paidBy] || 0) + tAmt(e); Object.entries(tShares(e)).forEach(([id, v]) => { b[id] = (b[id] || 0) - v; }); });
  (t.settlements || []).forEach(s => { b[s.from] = (b[s.from] || 0) + s.amt; b[s.to] = (b[s.to] || 0) - s.amt; });
  return b;
}
function tSettle(t) {
  const b = tBalances(t), cr = [], db = [];
  Object.entries(b).forEach(([id, v]) => { v = r2(v); if (v > 0.01) cr.push({ id, a: v }); else if (v < -0.01) db.push({ id, a: -v }); });
  cr.sort((x, y) => y.a - x.a); db.sort((x, y) => y.a - x.a);
  const out = []; let i = 0, j = 0;
  while (i < db.length && j < cr.length) { const p = Math.min(db[i].a, cr[j].a); if (p > 0.01) out.push({ from: db[i].id, to: cr[j].id, amt: r2(p) }); db[i].a -= p; cr[j].a -= p; if (db[i].a < 0.01) i++; if (cr[j].a < 0.01) j++; }
  return out;
}
const tTotal = (t) => t.expenses.reduce((s, e) => s + tAmt(e), 0);
const tMine = (t) => t.expenses.reduce((s, e) => s + (tShares(e).me || 0), 0);
function tStatus(t) { const a = daysTo(t.start), b = daysTo(t.end || t.start); if (a > 0) return { text: `อีก ${a} วัน`, tone: 'accent' }; if (b >= 0) return { text: 'กำลังเที่ยว', tone: 'green' }; return { text: 'จบแล้ว', tone: '' }; }
const tDates = (t) => t.start ? dShort(t.start) + (t.end && t.end !== t.start ? ' – ' + dShort(t.end) : '') : 'ยังไม่ระบุวัน';
let TRIP_OPEN = sessionStorage.getItem('los:trip') || '';
function openTrip(id) { TRIP_OPEN = id || ''; sessionStorage.setItem('los:trip', TRIP_OPEN); window.scrollTo(0, 0); losEmit(); }

function TripsScreen() {
  const trip = LOS_TRIPS.find(t => t.id === TRIP_OPEN);
  if (trip) return <TripDetail trip={trip} />;
  let owed = 0, owe = 0;
  LOS_TRIPS.forEach(t => { const m = (tBalances(t).me || 0) * (t.rate || 1); if (m > 0.5) owed += m; else if (m < -0.5) owe -= m; });
  const list = [...LOS_TRIPS].sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  return <>
    <HeroStat label="ยอดค้างกับเพื่อนทุกทริป (สุทธิ)" value={money(owed - owe)} sub={owed - owe >= 0 ? 'เพื่อนติดเงินเรามากกว่า' : 'เราติดเงินเพื่อนมากกว่า'} cols={[['เพื่อนติดเรา', money(owed)], ['เราติดเพื่อน', money(owe)], ['ทริป', LOS_TRIPS.length + ' ทริป']]} />
    <Sec title="ทริปของฉัน" action="+ สร้างทริป" onAction={() => losOpen('trip')} />
    <div className="grid g2">
      {list.map(t => <TripCard key={t.id} t={t} />)}
      <button className="trip-add" onClick={() => losOpen('trip')}><span className="wcard-plus"><LIcon name="plus" size={20} /></span>สร้างทริปใหม่</button>
    </div>
  </>;
}
function TripCard({ t }) {
  const st = tStatus(t), tot = tTotal(t), me = tBalances(t).me || 0, f = t.currency !== 'THB';
  return <button className="card card-pad trip-card" onClick={() => openTrip(t.id)}>
    <span className="trip-card-top">
      <span className="ic" style={{ background: 'var(--accent-soft)' }}><LIcon name="trip" size={18} color="var(--accent-deep)" /></span>
      <span style={{ flex: 1, minWidth: 0 }}><span className="row-t" style={{ fontWeight: 600 }}>{t.name}</span><span className="row-s">{tDates(t)} · {t.members.length} คน{f ? ' · ' + t.currency : ''}</span></span>
      <Badge tone={st.tone}>{st.text}</Badge>
    </span>
    <span className="trip-card-mid">
      <span><span className="cap">ใช้ทั้งทริป</span><span className="num" style={{ display: 'block', fontSize: 22, fontWeight: 600 }}>{fmtC(tot, t.currency)}</span>{f && <span className="row-s num">≈ {money(tot * t.rate)}</span>}</span>
      {Math.abs(me) > 0.01 ? <span style={{ textAlign: 'right' }}><span className="cap">{me > 0 ? 'ฉันได้คืน' : 'ฉันต้องจ่าย'}</span><span className="num" style={{ display: 'block', fontSize: 16, fontWeight: 600, color: me > 0 ? 'var(--pos)' : 'var(--neg)' }}>{fmtC(Math.abs(me), t.currency)}</span></span> : t.expenses.length > 0 && <Badge tone="green">เคลียร์ครบ</Badge>}
    </span>
    <AvStack ids={t.members} />
  </button>;
}
function TripDetail({ trip: t }) {
  const [open, setOpen] = React.useState(null);
  const C = (a) => fmtC(a, t.currency), f = t.currency !== 'THB';
  const tot = tTotal(t), mine = tMine(t), bal = tBalances(t), me = bal.me || 0, txs = tSettle(t);
  const maxAbs = Math.max(1, ...t.members.map(m => Math.abs(bal[m] || 0)));
  const exps = [...t.expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const addExp = () => losOpen('tripExp', { tripId: t.id });
  const unsettle = (s) => { if (confirm(`ยกเลิกรายการเคลียร์ ${pName(s.from)} → ${pName(s.to)}?`)) losUpdate(() => { if (s.txn) removeTxn(s.txn); t.settlements = t.settlements.filter(x => x.id !== s.id); }, 'ยกเลิกการเคลียร์แล้ว'); };
  return <>
    <button className="btn btn-sm" onClick={() => openTrip('')} style={{ marginBottom: 14 }}><LIcon name="back" size={14} />ทริปทั้งหมด</button>
    <HeroHeader icon="trip" title={t.name} sub={`${tDates(t)} · ${t.members.length} คน` + (f ? ` · 1 ${t.currency} = ฿${t.rate}` : '')} statLabel="ใช้ทั้งทริป" statValue={C(tot)}
      chips={[f && ['≈ เงินไทย', money(tot * t.rate)], ['ส่วนของฉัน', C(mine)], [me >= 0 ? 'ฉันได้คืน' : 'ฉันต้องจ่าย', C(Math.abs(me))]].filter(Boolean)} />
    <div className="actbar">
      <button className="btn btn-primary" onClick={addExp}><LIcon name="plus" size={15} color="currentColor" />เพิ่มค่าใช้จ่าย</button>
      <button className="btn" onClick={() => losOpen('trip', { initial: t })}><LIcon name="edit" size={15} />แก้ไขทริป</button>
    </div>
    <div className="dash" style={{ marginTop: 4 }}>
      <div style={{ minWidth: 0 }}>
        <Sec title={`ค่าใช้จ่าย (${t.expenses.length})`} />
        <Card pad={false}>{exps.length ? exps.map(e => <TripExpRow key={e.id} t={t} e={e} open={open === e.id} onToggle={() => setOpen(open === e.id ? null : e.id)} />) : <Empty text="ยังไม่มีค่าใช้จ่ายในทริปนี้" action="เพิ่มค่าใช้จ่าย" onAction={addExp} />}</Card>
      </div>
      <div style={{ minWidth: 0 }}>
        <Sec title="ใครต้องโอนให้ใคร" />
        <Card pad={false}>{txs.length ? txs.map((x, i) => (
          <div key={i} className="row settle-row">
            <span className="avs"><Av id={x.from} size={30} /><Av id={x.to} size={30} /></span>
            <span style={{ minWidth: 0, flex: 1 }}><span className="row-t">{pName(x.from)} โอนให้ {pName(x.to)}</span><span className="row-s num">{C(x.amt)}{f ? ` · ≈ ${money(x.amt * t.rate)}` : ''}</span></span>
            <button className="btn btn-sm" onClick={() => losOpen('tripSettle', { tripId: t.id, ...x })}><LIcon name="check" size={14} />เคลียร์แล้ว</button>
          </div>)) : <Empty text={t.expenses.length ? 'เคลียร์ครบทุกคนแล้ว' : 'ยังไม่มียอดต้องโอน'} />}</Card>
        <Sec title="ยอดของแต่ละคน" />
        <Card>
          {t.members.map((m, i) => { const v = bal[m] || 0, z = Math.abs(v) < 0.01; return (
            <div key={m} style={{ display: 'flex', gap: 11, alignItems: 'center', marginTop: i ? 14 : 0 }}>
              <Av id={m} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14, marginBottom: 5 }}><span>{pName(m)}</span><span className="num" style={{ fontWeight: 600, color: z ? 'var(--ink-faint)' : v > 0 ? 'var(--pos)' : 'var(--neg)' }}>{z ? 'เคลียร์แล้ว' : (v > 0 ? '+' : '−') + C(Math.abs(v))}</span></div>
                <Bar ratio={z ? 0 : Math.abs(v) / maxAbs} color={v > 0 ? 'var(--pos)' : 'var(--neg)'} />
              </div>
            </div>); })}
          <div className="hint">บวก = ควรได้เงินคืน · ลบ = ต้องจ่ายเพิ่ม (รวมรายการที่เคลียร์แล้ว)</div>
        </Card>
        {(t.settlements || []).length > 0 && <>
          <Sec title={`เคลียร์แล้ว (${t.settlements.length})`} />
          <Card pad={false}>{[...t.settlements].reverse().map(s => <Row key={s.id} icon="check" tone="pos" title={`${pName(s.from)} → ${pName(s.to)}`} sub={dShort(s.date) + (s.txn ? ' · บันทึกลงบัญชีแล้ว' : '') + ' · แตะเพื่อยกเลิก'} right={C(s.amt)} onClick={() => unsettle(s)} />)}</Card>
        </>}
      </div>
    </div>
  </>;
}
function TripExpRow({ t, e, open, onToggle }) {
  const C = (a) => fmtC(a, t.currency), f = t.currency !== 'THB', amt = tAmt(e), sh = tShares(e), mode = e.splitMode || 'equal';
  const n = Object.keys(sh).filter(k => sh[k] > 0.001).length;
  const badge = mode === 'items' ? 'แยกรายการ' : mode === 'custom' ? 'กำหนดเอง' : null;
  return <div className="trip-exp">
    <Row icon={tripCatIcon(e.cat)} onClick={onToggle}
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>{badge && <Badge tone="accent">{badge}</Badge>}</span>}
      sub={`${pName(e.paidBy)} จ่าย · ${mode === 'items' ? (e.items || []).length + ' รายการ' : 'หาร ' + n + ' คน'} · ${dShort(e.date)}`}
      right={C(amt)} rightSub={f ? '≈ ' + money(amt * t.rate) : mode === 'equal' && n ? 'คนละ ' + C(amt / n) : null} />
    {open && <div className="trip-exp-body">
      {mode === 'items' && (e.items || []).map(it => (
        <div key={it.id} className="trip-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13.5 }}><span>{it.name}</span><span className="num" style={{ fontWeight: 600 }}>{C(it.price)}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AvStack ids={it.people} size={22} /><span className="row-s">{it.people.length > 1 ? `คนละ ${C(it.price / it.people.length)}` : pName(it.people[0]) + ' คนเดียว'}</span></div>
        </div>))}
      <Cap>ส่วนของแต่ละคน</Cap>
      {Object.entries(sh).filter(([, v]) => v > 0.001).sort((a, b) => b[1] - a[1]).map(([id, v]) => (
        <div key={id} className="share-row"><Av id={id} size={24} /><span style={{ flex: 1 }}>{pName(id)}</span><span className="num" style={{ fontWeight: 600 }}>{C(v)}</span></div>))}
      <div><button className="btn btn-sm" onClick={() => losOpen('tripExp', { tripId: t.id, initial: e })}><LIcon name="edit" size={14} />แก้ไข</button></div>
    </div>}
  </div>;
}

function TripForm({ initial, onClose }) {
  const [f, set, setF] = useF(initial ? { name: initial.name, start: initial.start, end: initial.end, currency: initial.currency, rate: initial.rate, members: [...initial.members] } : { name: '', start: relDay(14), end: relDay(17), currency: 'THB', rate: 1, members: ['me'] });
  const [added, setAdded] = React.useState([]);
  const [nf, setNf] = React.useState('');
  const friends = [...LOS_FRIENDS, ...added];
  const used = new Set(); if (initial) initial.expenses.forEach(e => { used.add(e.paidBy); Object.keys(tShares(e)).forEach(k => used.add(k)); });
  const toggle = (id) => { if (used.has(id) && f.members.includes(id)) return losToast('คนนี้มีค่าใช้จ่ายในทริปแล้ว เอาออกไม่ได้'); setF(p => ({ ...p, members: p.members.includes(id) ? p.members.filter(x => x !== id) : [...p.members, id] })); };
  const addFriend = () => { const n = nf.trim(); if (!n) return; const p = { id: lid(), name: n, color: AV_COLORS[(LOS_FRIENDS.length + added.length) % AV_COLORS.length] }; setAdded(a => [...a, p]); setF(x => ({ ...x, members: [...x.members, p.id] })); setNf(''); };
  const foreign = f.currency !== 'THB';
  const valid = f.name.trim() && f.members.length >= 2 && (!foreign || numv(f.rate) > 0);
  return <FormModal title={initial ? 'แก้ไขทริป' : 'สร้างทริปใหม่'} onClose={onClose} valid={valid} saveLabel={initial ? 'บันทึก' : 'สร้างทริป'}
    onSave={() => {
      const id = initial ? initial.id : lid();
      losUpdate(() => {
        added.forEach(p => { if (f.members.includes(p.id)) LOS_FRIENDS.push(p); });
        const item = { ...f, id, name: f.name.trim(), rate: foreign ? numv(f.rate) : 1 };
        const i = LOS_TRIPS.findIndex(x => x.id === id);
        if (i >= 0) Object.assign(LOS_TRIPS[i], item); else LOS_TRIPS.push({ ...item, expenses: [], settlements: [] });
      }, initial ? 'บันทึกทริปแล้ว' : 'สร้างทริปแล้ว');
      if (!initial) openTrip(id);
    }}
    onDelete={initial ? () => { losUpdate(() => { const i = LOS_TRIPS.findIndex(x => x.id === initial.id); if (i >= 0) LOS_TRIPS.splice(i, 1); }, 'ลบทริปแล้ว'); openTrip(''); } : null}>
    <Field label="ชื่อทริป"><input value={f.name} onChange={set('name')} placeholder="เช่น เที่ยวเชียงใหม่" autoFocus={!initial} /></Field>
    <G2><Field label="วันเริ่ม"><input type="date" value={f.start} onChange={set('start')} /></Field>
      <Field label="วันกลับ"><input type="date" value={f.end} onChange={set('end')} /></Field></G2>
    <G2><Field label="สกุลเงินของทริป"><select value={f.currency} onChange={e => { const c = e.target.value; setF(p => ({ ...p, currency: c, rate: TRIP_CUR[c].r })); }}>{Object.entries(TRIP_CUR).map(([k, v]) => <option key={k} value={k}>{k} · {v.n}</option>)}</select></Field>
      {foreign ? <Field label={`1 ${f.currency} = กี่บาท`}><input value={f.rate} onChange={set('rate')} inputMode="decimal" /></Field> : <div></div>}</G2>
    <Field label={`สมาชิก (${f.members.length} คน)`}>
      <div className="chips">
        <PChip id="me" on disabled />
        {friends.map(p => <PChip key={p.id} p={p} on={f.members.includes(p.id)} onClick={() => toggle(p.id)} />)}
      </div>
    </Field>
    <div style={{ display: 'flex', gap: 8, marginTop: -4 }}>
      <div className="field" style={{ flex: 1, marginBottom: 0 }}><input value={nf} onChange={e => setNf(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFriend(); } }} placeholder="เพิ่มชื่อเพื่อนใหม่" /></div>
      <button type="button" className="btn" onClick={addFriend} disabled={!nf.trim()}>เพิ่ม</button>
    </div>
    {f.members.length < 2 && <div className="hint">เลือกเพื่อนอย่างน้อย 1 คน</div>}
  </FormModal>;
}

function TripExpForm({ tripId, initial, onClose }) {
  const t = LOS_TRIPS.find(x => x.id === tripId);
  const M = t ? t.members : [], cur = t ? t.currency : 'THB', sym = (TRIP_CUR[cur] || TRIP_CUR.THB).s, init = initial || {};
  const [f, set, setF] = useF({
    title: init.title || '', cat: init.cat || 'อาหาร', paidBy: init.paidBy || 'me', date: init.date || TODAY_ISO, mode: init.splitMode || 'equal',
    amount: init.splitMode !== 'items' && init.amount != null ? String(init.amount) : '',
    split: init.split ? [...init.split] : [...M],
    items: init.items ? init.items.map(it => ({ ...it, price: String(it.price), people: [...it.people] })) : [{ id: lid(), name: '', price: '', people: [...M] }],
    shares: init.shares ? Object.fromEntries(Object.entries(init.shares).map(([k, v]) => [k, String(v)])) : {},
  });
  if (!t) return null;
  const amt = f.mode === 'items' ? f.items.reduce((s, it) => s + numv(it.price), 0) : numv(f.amount);
  const remain = r2(amt - M.reduce((s, id) => s + numv(f.shares[id]), 0)), okRemain = Math.abs(remain) <= 0.05;
  const valid = amt > 0 && (f.mode === 'equal' ? f.split.length > 0 : f.mode === 'items' ? f.items.every(it => !numv(it.price) || it.people.length) : okRemain);
  const tog = (arr, id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
  const setItem = (id, p) => setF(x => ({ ...x, items: x.items.map(it => it.id === id ? { ...it, ...p } : it) }));
  const evenShares = () => setF(x => ({ ...x, shares: Object.fromEntries(M.map(id => [id, String(r2(amt / M.length))])) }));
  const setMode = (m) => setF(x => ({ ...x, mode: m, shares: m === 'custom' && !Object.keys(x.shares).length && numv(x.amount) ? Object.fromEntries(M.map(id => [id, String(r2(numv(x.amount) / M.length))])) : x.shares }));
  const save = () => losUpdate(() => {
    const tt = LOS_TRIPS.find(x => x.id === tripId);
    const base = { id: init.id || lid(), title: f.title.trim() || f.cat, cat: f.cat, paidBy: f.paidBy, date: f.date, splitMode: f.mode };
    let e;
    if (f.mode === 'items') e = { ...base, items: f.items.filter(it => numv(it.price) > 0).map(it => ({ id: it.id, name: it.name.trim() || 'รายการ', price: numv(it.price), people: M.filter(id => it.people.includes(id)) })) };
    else if (f.mode === 'custom') e = { ...base, amount: amt, shares: Object.fromEntries(M.filter(id => numv(f.shares[id]) > 0).map(id => [id, numv(f.shares[id])])) };
    else e = { ...base, amount: amt, split: M.filter(id => f.split.includes(id)) };
    const i = tt.expenses.findIndex(x => x.id === e.id); if (i >= 0) tt.expenses[i] = e; else tt.expenses.push(e);
  }, initial ? 'บันทึกการแก้ไขแล้ว' : `เพิ่มค่าใช้จ่าย ${fmtC(amt, cur)} แล้ว`);
  return <FormModal title={initial ? 'แก้ไขค่าใช้จ่ายทริป' : 'เพิ่มค่าใช้จ่ายทริป'} onClose={onClose} valid={valid} onSave={save}
    onDelete={initial ? () => losUpdate(() => { const tt = LOS_TRIPS.find(x => x.id === tripId); tt.expenses = tt.expenses.filter(x => x.id !== init.id); }, 'ลบรายการแล้ว') : null}>
    <div className="seg" style={{ marginBottom: 14 }}>{[['equal', 'หารเท่ากัน'], ['items', 'แยกตามรายการ'], ['custom', 'กำหนดเอง']].map(([k, l]) => <button type="button" key={k} className={f.mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
    {f.mode !== 'items'
      ? <Field label={`จำนวนเงิน (${cur})`}><input className="big-num" value={f.amount} onChange={set('amount')} inputMode="decimal" placeholder={sym + '0'} autoFocus={!initial} /></Field>
      : <div style={{ marginBottom: 14 }}><Cap>ยอดรวมทุกรายการ</Cap><div className="num" style={{ fontSize: 26, fontWeight: 600 }}>{fmtC(amt, cur)}</div></div>}
    {cur !== 'THB' && amt > 0 && <div className="hint" style={{ margin: '-8px 2px 14px' }}>≈ {money(amt * t.rate)} (1 {cur} = ฿{t.rate})</div>}
    <Field label="รายละเอียด"><input value={f.title} onChange={set('title')} placeholder={f.cat} /></Field>
    <Field label="หมวด"><div className="chips">{TRIP_CATS.map(([c]) => <button type="button" key={c} className={'chip' + (f.cat === c ? ' on' : '')} onClick={() => set('cat')(c)}>{c}</button>)}</div></Field>
    <Field label="ใครจ่าย"><div className="chips">{M.map(id => <PChip key={id} id={id} on={f.paidBy === id} onClick={() => set('paidBy')(id)} />)}</div></Field>
    {f.mode === 'equal' && <Field label={`หารกับใคร · คนละ ${f.split.length && amt ? fmtC(amt / f.split.length, cur) : '—'}`}>
      <div className="chips">{M.map(id => <PChip key={id} id={id} on={f.split.includes(id)} onClick={() => setF(x => ({ ...x, split: tog(x.split, id) }))} />)}</div>
    </Field>}
    {f.mode === 'items' && <Field label="รายการ (เลือกคนที่กินหรือใช้รายการนั้น)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {f.items.map((it, k) => (
          <div key={it.id} className="card card-flat" style={{ padding: 12 }}>
            <div className="field" style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <input style={{ flex: 1, minWidth: 0 }} value={it.name} placeholder={`รายการที่ ${k + 1}`} onChange={e => setItem(it.id, { name: e.target.value })} />
              <input className="num" style={{ width: 110 }} inputMode="decimal" placeholder={sym + '0'} value={it.price} onChange={e => setItem(it.id, { price: e.target.value })} />
              {f.items.length > 1 && <button type="button" className="btn icon-btn" onClick={() => setF(x => ({ ...x, items: x.items.filter(y => y.id !== it.id) }))} aria-label="ลบรายการ"><LIcon name="x" size={14} /></button>}
            </div>
            <div className="chips">{M.map(id => <PChip key={id} id={id} on={it.people.includes(id)} onClick={() => setItem(it.id, { people: tog(it.people, id) })} />)}</div>
            {numv(it.price) > 0 && <div className="hint" style={{ marginTop: 8, color: it.people.length ? null : 'var(--neg)' }}>{it.people.length ? `คนละ ${fmtC(numv(it.price) / it.people.length, cur)}` : 'เลือกอย่างน้อย 1 คน'}</div>}
          </div>))}
        <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setF(x => ({ ...x, items: [...x.items, { id: lid(), name: '', price: '', people: [...M] }] }))}><LIcon name="plus" size={14} />เพิ่มรายการ</button>
      </div>
    </Field>}
    {f.mode === 'custom' && <Field label="แต่ละคนต้องจ่ายเท่าไร">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {M.map(id => <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Av id={id} size={30} /><span style={{ flex: 1 }}>{pName(id)}</span>
          <input className="num" style={{ width: 130 }} inputMode="decimal" placeholder="0" value={f.shares[id] || ''} onChange={e => { const v = e.target.value; setF(x => ({ ...x, shares: { ...x.shares, [id]: v } })); }} />
        </div>)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <span className="hint" style={{ margin: 0, flex: 1, color: okRemain && amt ? 'var(--pos)' : 'var(--neg)' }}>{!amt ? 'ใส่จำนวนเงินก่อน' : okRemain ? 'ยอดรวมตรงกันแล้ว' : remain > 0 ? `ยังขาดอีก ${fmtC(remain, cur)}` : `เกินมา ${fmtC(-remain, cur)}`}</span>
          <button type="button" className="btn btn-sm" onClick={evenShares} disabled={!amt}>แบ่งเท่ากัน</button>
        </div>
      </div>
    </Field>}
    <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field>
  </FormModal>;
}

const TRIP_TXN_CAT = ['ท่องเที่ยว', 'เที่ยว', 'อื่นๆ'].find(c => EXP_CATS.includes(c)) || EXP_CATS[EXP_CATS.length - 1];
function TripSettleForm({ tripId, from, to, amt, onClose }) {
  const t = LOS_TRIPS.find(x => x.id === tripId);
  const [f, set] = useF({ amt: String(amt), date: TODAY_ISO, src: '' });
  if (!t) return null;
  const mine = from === 'me' || to === 'me', a = numv(f.amt), thb = r2(a * (t.rate || 1));
  const P = ({ id }) => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 }}><Av id={id} size={48} /><span style={{ fontSize: 14 }}>{pName(id)}</span></div>;
  return <FormModal title="บันทึกว่าเคลียร์แล้ว" saveLabel="เคลียร์แล้ว" valid={a > 0} onClose={onClose}
    onSave={() => losUpdate(() => {
      const tt = LOS_TRIPS.find(x => x.id === tripId), s = { id: lid(), from, to, amt: a, date: f.date };
      if (mine && f.src) { const x = addTxn({ type: from === 'me' ? 'expense' : 'income', amount: thb, src: f.src, cat: from === 'me' ? TRIP_TXN_CAT : 'อื่นๆ', name: (from === 'me' ? `โอนคืน${pName(to)}` : `รับคืนจาก${pName(from)}`) + ' · ' + tt.name, date: f.date }); s.txn = x.id; }
      tt.settlements = [...(tt.settlements || []), s];
    }, `${pName(from)} → ${pName(to)} เคลียร์แล้ว`)}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, margin: '4px 0 18px' }}><P id={from} /><LIcon name="arrow" size={22} color="var(--ink-faint)" /><P id={to} /></div>
    <G2><Field label={`จำนวน (${t.currency})`}><input className="num" value={f.amt} onChange={set('amt')} inputMode="decimal" /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field></G2>
    {t.currency !== 'THB' && <div className="hint" style={{ margin: '-6px 2px 14px' }}>≈ {money(thb)}</div>}
    {mine && <Field label={from === 'me' ? 'บันทึกเป็นรายจ่ายจากบัญชี' : 'บันทึกเป็นรายรับเข้าบัญชี'}><SrcSelect value={f.src} onChange={set('src')} cards={false} none="ไม่บันทึกลงบัญชี" /></Field>}
    {a < amt - 0.01 && <div className="hint">จ่ายบางส่วน ยอดที่เหลือจะยังอยู่ในรายการต้องโอน</div>}
  </FormModal>;
}
Object.assign(LOS_FORMS, { trip: TripForm, tripExp: TripExpForm, tripSettle: TripSettleForm });
Object.assign(window, { TripsScreen, TripDetail, TripForm, TripExpForm, TripSettleForm, fmtC, tBalances, tSettle, openTrip });
