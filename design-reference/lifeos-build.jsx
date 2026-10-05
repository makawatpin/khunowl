// lifeos-build.jsx — home construction / renovation projects: material bills, contractors & labor draws, summary
const PJ_KINDS = ['ต่อเติม', 'รีโนเวท', 'ซ่อมใหญ่', 'สร้างใหม่', 'ตกแต่ง'];
const PJ_STATUS = ['วางแผน', 'กำลังทำ', 'เสร็จแล้ว'];
const PJ_PHASES = ['รื้อถอน', 'งานดิน', 'โครงสร้าง', 'พื้น', 'ผนัง', 'หลังคา', 'ประปา', 'ไฟฟ้า', 'ห้องน้ำ', 'สี/ตกแต่ง'];
const PJ_ROLES = ['ผู้รับเหมา (ค่าแรง)', 'ผู้รับเหมา (เหมารวม)', 'ช่างไฟ', 'ช่างประปา', 'ช่างเหล็ก', 'ช่างปูน', 'ช่างรายวัน', 'อื่นๆ'];
const pjr2 = (x) => Math.round(x * 100) / 100;
const billTotal = (b) => pjr2((b.items || []).reduce((s, it) => s + (+it.qty || 0) * (+it.price || 0), 0));
const crewPaid = (c) => (c.draws || []).reduce((s, d) => s + (+d.amt || 0), 0);
function pjStats(p) {
  const mat = (p.bills || []).reduce((s, b) => s + billTotal(b), 0);
  const paid = (p.crews || []).reduce((s, c) => s + crewPaid(c), 0);
  const owe = (p.crews || []).reduce((s, c) => s + Math.max(0, (+c.contract || 0) - crewPaid(c)), 0);
  return { mat, paid, owe, spent: mat + paid, forecast: mat + paid + owe };
}
const pjTone = (st) => st === 'เสร็จแล้ว' ? 'green' : st === 'กำลังทำ' ? 'accent' : 'amber';
let PROJ_OPEN = sessionStorage.getItem('los:proj') || '';
function openProj(id) { PROJ_OPEN = id || ''; sessionStorage.setItem('los:proj', PROJ_OPEN); window.scrollTo(0, 0); losEmit(); }
const pjFind = (id) => LOS_PROJECTS.find(x => x.id === id);

function ProjectsSection() {
  return <>
    <Sec title="งานต่อเติม / ก่อสร้าง" action="+ เริ่มโครงการ" onAction={() => losOpen('project')} />
    {LOS_PROJECTS.length ? <div className="grid g2">{[...LOS_PROJECTS].sort((a, b) => (b.start || '').localeCompare(a.start || '')).map(p => { const s = pjStats(p); return (
      <button key={p.id} className="card card-pad trip-card" onClick={() => openProj(p.id)}>
        <span className="trip-card-top">
          <span className="ic" style={{ background: 'var(--warn-soft)' }}><LIcon name="hammer" size={18} color="#B8762A" /></span>
          <span style={{ flex: 1, minWidth: 0 }}><span className="row-t" style={{ fontWeight: 600 }}>{p.name}</span><span className="row-s">{p.kind} · เริ่ม {dLong(p.start)}</span></span>
          <Badge tone={pjTone(p.status)}>{p.status}</Badge>
        </span>
        <span className="trip-card-mid">
          <span><span className="cap">จ่ายไปแล้ว</span><span className="num" style={{ display: 'block', fontSize: 22, fontWeight: 600 }}>{baht2(s.spent)}</span></span>
          {s.owe > 0 && <span style={{ textAlign: 'right' }}><span className="cap">ค่าแรงค้างจ่าย</span><span className="num" style={{ display: 'block', fontSize: 16, fontWeight: 600, color: 'var(--neg)' }}>{baht2(s.owe)}</span></span>}
        </span>
        {+p.budget > 0 && <span style={{ display: 'block' }}><Bar ratio={s.forecast / p.budget} /><span className="row-s" style={{ marginTop: 6 }}>คาดว่ารวม {baht2(s.forecast)} จากงบ {baht2(p.budget)}</span></span>}
      </button>); })}</div>
      : <Card pad={false}><Empty text="บันทึกค่าวัสดุ ค่าแรงช่าง และบิลทุกใบของงานต่อเติมไว้ดูย้อนหลัง" action="เริ่มโครงการ" onAction={() => losOpen('project')} /></Card>}
  </>;
}

function ProjectDetail({ p }) {
  const [tab, setTab] = React.useState('bills');
  const [phase, setPhase] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(null);
  const s = pjStats(p), bills = [...(p.bills || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const usedPhases = [...new Set(bills.map(b => b.phase).filter(Boolean))];
  const shown = phase === 'all' ? bills : bills.filter(b => b.phase === phase);
  const hits = q.trim() ? bills.flatMap(b => (b.items || []).filter(it => it.name.toLowerCase().includes(q.trim().toLowerCase())).map((it, k) => ({ ...it, key: b.id + k, b }))) : null;
  const group = (key) => { const m = {}; bills.forEach(b => { const k = b[key] || 'ไม่ระบุ'; m[k] = (m[k] || 0) + billTotal(b); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const byPhase = group('phase'), byShop = group('shop');
  const addBill = () => losOpen('pjBill', { projId: p.id });
  return <>
    <button className="btn btn-sm" onClick={() => openProj('')} style={{ marginBottom: 14 }}><LIcon name="back" size={14} />บ้าน</button>
    <HeroHeader icon="hammer" title={p.name} sub={`${p.kind} · ${p.status} · เริ่ม ${dLong(p.start)}${p.end ? ' · เสร็จ ' + dLong(p.end) : ''}`} statLabel="จ่ายไปแล้ว" statValue={baht2(s.spent)}
      chips={[['ค่าวัสดุ', baht2(s.mat)], ['ค่าแรงจ่ายแล้ว', baht2(s.paid)], ['ค่าแรงค้างจ่าย', baht2(s.owe)], ['คาดว่ารวมทั้งหมด', baht2(s.forecast)], +p.budget > 0 && ['งบที่ตั้งไว้', baht2(p.budget)]].filter(Boolean)} />
    {+p.budget > 0 && <Card style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', fontSize: 14, marginBottom: 8, gap: 8 }}><span style={{ flex: 1 }}>ใช้งบไป {Math.round(s.spent / p.budget * 100)}% · รวมค่าแรงค้างแล้ว {Math.round(s.forecast / p.budget * 100)}%</span><span className="num" style={{ color: s.forecast > p.budget ? 'var(--neg)' : 'var(--pos)', fontWeight: 600 }}>{s.forecast > p.budget ? 'เกินงบ ' + baht2(s.forecast - p.budget) : 'เหลือ ' + baht2(p.budget - s.forecast)}</span></div>
      <Bar ratio={s.forecast / p.budget} />
    </Card>}
    <div className="actbar">
      <button className="btn btn-primary" onClick={addBill}><LIcon name="plus" size={15} color="currentColor" />บิลวัสดุ / ค่าใช้จ่าย</button>
      <button className="btn" onClick={() => losOpen('pjCrew', { projId: p.id })}><LIcon name="plus" size={15} />ช่าง / ผู้รับเหมา</button>
      <button className="btn" onClick={() => losOpen('project', { initial: p })}><LIcon name="edit" size={15} />แก้ไขโครงการ</button>
    </div>
    {p.note && <div className="hint">{p.note}</div>}
    <div style={{ height: 16 }}></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ id: 'bills', label: `บิล & วัสดุ (${bills.length})` }, { id: 'crew', label: `ช่าง & ค่าแรง (${(p.crews || []).length})` }, { id: 'sum', label: 'สรุปค่าใช้จ่าย' }]} />
    {tab === 'bills' && <>
      <div className="pj-search"><LIcon name="search" size={15} color="var(--ink-faint)" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหารายการ เช่น ท่อ PVC, เหล็กกล่อง" />{q && <button className="link-btn" onClick={() => setQ('')}>ล้าง</button>}</div>
      {hits ? <Card pad={false}>{hits.length ? hits.map(h => <Row key={h.key} icon="search" title={h.name} sub={`${dLong(h.b.date)} · ${h.b.shop || '—'} · ${h.qty} × ${baht2(h.price)}`} right={baht2(h.qty * h.price)} onClick={() => { setQ(''); setPhase('all'); setOpen(h.b.id); }} />) : <Empty text="ไม่พบรายการ" />}</Card> : <>
        <div className="chips" style={{ marginBottom: 10 }}>{[['all', 'ทั้งหมด'], ...usedPhases.map(x => [x, x])].map(([k, l]) => <button key={k} className={'chip' + (phase === k ? ' on' : '')} onClick={() => setPhase(k)}>{l}</button>)}</div>
        <Card pad={false}>{shown.length ? shown.map(b => { const on = open === b.id, tot = billTotal(b); return (
          <div key={b.id} className="trip-exp">
            <Row icon="doc" onClick={() => setOpen(on ? null : b.id)} title={b.shop || 'ไม่ระบุร้าน'} sub={[dLong(b.date), b.phase, (b.items || []).length + ' รายการ', b.txn ? 'ลงบัญชีแล้ว' : null].filter(Boolean).join(' · ')} right={baht2(tot)} />
            {on && <div className="trip-exp-body">
              <table className="pj-items"><tbody>
                {(b.items || []).map((it, k) => <tr key={k}><td>{it.name}</td><td className="r" style={{ color: 'var(--ink-soft)' }}>{it.qty} × {baht2(it.price)}</td><td className="r num">{baht2(it.qty * it.price)}</td></tr>)}
                <tr><td style={{ fontWeight: 600 }}>รวมบิล</td><td></td><td className="r num" style={{ fontWeight: 600 }}>{baht2(tot)}</td></tr>
              </tbody></table>
              {b.note && <div className="hint" style={{ margin: 0 }}>หมายเหตุ: {b.note}</div>}
              <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm" onClick={() => losOpen('pjBill', { projId: p.id, initial: b })}><LIcon name="edit" size={14} />แก้ไข</button><button className="btn btn-sm" onClick={() => losOpen('pjBill', { projId: p.id, copy: b })}><LIcon name="plus" size={14} />ซื้อซ้ำ</button></div>
            </div>}
          </div>); }) : <Empty text="ยังไม่มีบิล" action="เพิ่มบิล" onAction={addBill} />}</Card>
      </>}
    </>}
    {tab === 'crew' && <>
      {(p.crews || []).length ? <div className="grid g2">{p.crews.map(c => { const paid = crewPaid(c), left = (+c.contract || 0) - paid; return (
        <Card key={c.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="ic"><LIcon name="hammer" size={17} color="var(--ink-soft)" /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{c.name}</div><div className="row-s">{c.role}{c.phone ? ' · ' : ''}{c.phone && <a href={'tel:' + c.phone}>{c.phone}</a>}</div></div>
            <button className="btn btn-sm" onClick={() => losOpen('pjCrew', { projId: p.id, initial: c })} aria-label="แก้ไข"><LIcon name="edit" size={14} /></button>
          </div>
          {c.scope && <div className="hint">{c.scope}</div>}
          {+c.contract > 0 && <div style={{ margin: '14px 0 4px' }}><Bar ratio={paid / c.contract} color="var(--pos)" /></div>}
          <Detail rows={[+c.contract > 0 && ['ตกลงค่าแรง', baht2(c.contract)], ['เบิกไปแล้ว', baht2(paid) + ` (${(c.draws || []).length} ครั้ง)`], +c.contract > 0 && ['คงเหลือต้องจ่าย', <b className="num" style={{ color: left > 0 ? 'var(--neg)' : 'var(--pos)' }}>{left > 0 ? baht2(left) : left < 0 ? 'จ่ายเกิน ' + baht2(-left) : 'จ่ายครบแล้ว'}</b>]]} />
          <div className="form-sec" style={{ marginTop: 14 }}>ประวัติเบิกเงิน</div>
          {(c.draws || []).length ? [...c.draws].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(d => <Row key={d.id} icon="money" title={baht2(d.amt)} sub={dLong(d.date) + (d.note ? ' · ' + d.note : '') + (d.txn ? ' · ลงบัญชีแล้ว' : '')} onClick={() => losOpen('pjDraw', { projId: p.id, crewId: c.id, initial: d })} />) : <div className="row-s">ยังไม่มีการเบิก</div>}
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => losOpen('pjDraw', { projId: p.id, crewId: c.id })}><LIcon name="plus" size={14} />บันทึกเบิกค่าแรง</button>
        </Card>); })}</div> : <Card pad={false}><Empty text="ยังไม่มีช่างหรือผู้รับเหมา" action="เพิ่มช่าง" onAction={() => losOpen('pjCrew', { projId: p.id })} /></Card>}
    </>}
    {tab === 'sum' && <div className="grid g2">
      <Card><Cap>แยกตามงาน</Cap><div style={{ marginTop: 12 }}>{byPhase.length ? byPhase.map(([k, v], i) => <div key={k} style={{ marginTop: i ? 12 : 0 }}><div style={{ display: 'flex', fontSize: 14, marginBottom: 5, gap: 8 }}><span style={{ flex: 1 }}>{k}</span><b className="num">{baht2(v)}</b></div><Bar ratio={v / byPhase[0][1]} /></div>) : <Empty text="ยังไม่มีบิล" />}</div></Card>
      <Card><Cap>แยกตามร้าน</Cap><div style={{ marginTop: 12 }}>{byShop.length ? byShop.map(([k, v], i) => <div key={k} style={{ marginTop: i ? 12 : 0 }}><div style={{ display: 'flex', fontSize: 14, marginBottom: 5, gap: 8 }}><span style={{ flex: 1 }}>{k}</span><span className="row-s">{bills.filter(b => (b.shop || 'ไม่ระบุ') === k).length} บิล</span><b className="num">{baht2(v)}</b></div><Bar ratio={v / byShop[0][1]} color="var(--accent-2)" /></div>) : <Empty text="ยังไม่มีบิล" />}</div></Card>
      <Card><Cap>วัสดุ vs ค่าแรง</Cap><div style={{ marginTop: 10 }}><Detail rows={[['ค่าวัสดุ / บิล', baht2(s.mat)], ['ค่าแรงจ่ายแล้ว', baht2(s.paid)], ['รวมจ่ายแล้ว', <b className="num">{baht2(s.spent)}</b>], ['ค่าแรงค้างจ่าย', baht2(s.owe)], ['คาดว่ารวมทั้งโครงการ', <b className="num">{baht2(s.forecast)}</b>]]} /></div></Card>
    </div>}
  </>;
}

function ProjectForm({ initial, onClose }) {
  const i = initial || {};
  const [f, set, setF] = useF({ name: i.name || '', kind: i.kind || 'ต่อเติม', status: i.status || 'กำลังทำ', start: i.start || TODAY_ISO, end: i.end || '', budget: i.budget || '', note: i.note || '', phases: i.phases ? [...i.phases] : [...PJ_PHASES] });
  const [np, setNp] = React.useState('');
  const addPhase = () => { const v = np.trim(); if (v && !f.phases.includes(v)) setF(x => ({ ...x, phases: [...x.phases, v] })); setNp(''); };
  return <FormModal title={initial ? 'แก้ไขโครงการ' : 'เริ่มโครงการต่อเติม / ก่อสร้าง'} onClose={onClose} valid={f.name.trim()} saveLabel={initial ? 'บันทึก' : 'สร้างโครงการ'}
    onSave={() => { const id = i.id || lid(); losUpdate(() => { const item = { ...f, id, name: f.name.trim(), budget: numv(f.budget) }; const p = pjFind(id); if (p) Object.assign(p, item); else LOS_PROJECTS.push({ ...item, bills: [], crews: [] }); }, initial ? 'บันทึกแล้ว' : 'สร้างโครงการแล้ว'); if (!initial) openProj(id); }}
    onDelete={initial ? () => { losUpdate(() => { const k = LOS_PROJECTS.findIndex(x => x.id === i.id); if (k >= 0) LOS_PROJECTS.splice(k, 1); }, 'ลบโครงการแล้ว'); openProj(''); } : null}>
    <Field label="ชื่อโครงการ"><input value={f.name} onChange={set('name')} placeholder="เช่น ต่อเติมครัวหลังบ้าน" autoFocus={!initial} /></Field>
    <G2><Field label="ประเภท"><select value={f.kind} onChange={set('kind')}>{PJ_KINDS.map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="งบประมาณ (บาท)"><input value={f.budget} onChange={set('budget')} inputMode="decimal" placeholder="ไม่บังคับ" /></Field>
      <Field label="วันเริ่ม"><input type="date" value={f.start} onChange={set('start')} /></Field>
      <Field label="วันเสร็จ"><input type="date" value={f.end} onChange={set('end')} /></Field></G2>
    <Field label="สถานะ"><div className="seg">{PJ_STATUS.map(x => <button type="button" key={x} className={f.status === x ? 'on' : ''} onClick={() => set('status')(x)}>{x}</button>)}</div></Field>
    <Field label="หมวดงาน (ใช้แยกบิล)"><div className="chips">{f.phases.map(x => <button type="button" key={x} className="chip on" onClick={() => setF(y => ({ ...y, phases: y.phases.filter(z => z !== x) }))}>{x} ×</button>)}</div></Field>
    <div style={{ display: 'flex', gap: 8, marginTop: -4, marginBottom: 14 }}>
      <div className="field" style={{ flex: 1, marginBottom: 0 }}><input value={np} onChange={e => setNp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhase(); } }} placeholder="เพิ่มหมวดงาน" /></div>
      <button type="button" className="btn" onClick={addPhase} disabled={!np.trim()}>เพิ่ม</button>
    </div>
    <Field label="รายละเอียด"><textarea rows={2} value={f.note} onChange={set('note')} placeholder="ขอบเขตงาน, แบบ, ข้อตกลง" style={{ resize: 'vertical' }} /></Field>
  </FormModal>;
}

function PjBillForm({ projId, initial, copy, onClose }) {
  const p = pjFind(projId), i = initial || copy || {};
  const line = (it) => ({ k: lid(), name: it ? it.name : '', qty: it ? String(it.qty) : '1', price: it ? String(it.price) : '' });
  const [f, set, setF] = useF({ date: initial ? i.date : TODAY_ISO, shop: i.shop || '', phase: i.phase || '', note: initial ? (i.note || '') : '', src: '', items: i.items && i.items.length ? i.items.map(line) : [line()] });
  if (!p) return null;
  const shops = [...new Set(LOS_PROJECTS.flatMap(x => (x.bills || []).map(b => b.shop)).filter(Boolean))];
  const setLine = (k, patch) => setF(x => ({ ...x, items: x.items.map(it => it.k === k ? { ...it, ...patch } : it) }));
  const total = pjr2(f.items.reduce((s, it) => s + numv(it.qty) * numv(it.price), 0));
  const valid = f.items.some(it => it.name.trim() && numv(it.qty) > 0);
  return <FormModal title={initial ? 'แก้ไขบิล' : 'บันทึกบิลวัสดุ / ค่าใช้จ่าย'} onClose={onClose} valid={valid} saveLabel={'บันทึก ' + baht2(total)}
    onSave={() => losUpdate(() => {
      const pp = pjFind(projId);
      const b = { id: initial ? i.id : lid(), date: f.date, shop: f.shop.trim(), phase: f.phase, note: f.note.trim(), txn: initial ? i.txn : undefined, items: f.items.filter(it => it.name.trim()).map(it => ({ name: it.name.trim(), qty: numv(it.qty) || 1, price: numv(it.price) })) };
      if (!initial && f.src && total > 0) b.txn = addTxn({ type: 'expense', amount: total, src: f.src, cat: 'บ้าน', name: `${pp.name} · ${b.shop || 'วัสดุ'}`, date: f.date }).id;
      const k = pp.bills.findIndex(x => x.id === b.id); if (k >= 0) pp.bills[k] = b; else pp.bills.push(b);
    }, initial ? 'บันทึกบิลแล้ว' : `บันทึกบิล ${baht2(total)} แล้ว`)}
    onDelete={initial ? () => losUpdate(() => { const pp = pjFind(projId); if (i.txn) removeTxn(i.txn); pp.bills = pp.bills.filter(x => x.id !== i.id); }, 'ลบบิลแล้ว') : null}>
    <G2><Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field>
      <Field label="ร้าน / ผู้ขาย"><input value={f.shop} onChange={set('shop')} list="pj-shops" placeholder="เช่น Homepro" /><datalist id="pj-shops">{shops.map(x => <option key={x} value={x} />)}</datalist></Field></G2>
    <Field label="หมวดงาน"><div className="chips">{(p.phases || PJ_PHASES).map(x => <button type="button" key={x} className={'chip' + (f.phase === x ? ' on' : '')} onClick={() => set('phase')(f.phase === x ? '' : x)}>{x}</button>)}</div></Field>
    <Field label="รายการ">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="pj-head"><span>รายการ</span><span>จำนวน</span><span>ราคา/หน่วย</span><span></span></div>
        {f.items.map((it, k) => <div key={it.k} className="field pj-line">
          <input value={it.name} onChange={e => setLine(it.k, { name: e.target.value })} placeholder={k ? '' : 'เช่น ท่อ PVC 4 นิ้ว'} autoFocus={!initial && k === 0} />
          <input className="num" value={it.qty} onChange={e => setLine(it.k, { qty: e.target.value })} inputMode="decimal" />
          <input className="num" value={it.price} onChange={e => setLine(it.k, { price: e.target.value })} inputMode="decimal" placeholder="0" />
          {f.items.length > 1 ? <button type="button" className="x" aria-label="ลบรายการ" onClick={() => setF(x => ({ ...x, items: x.items.filter(y => y.k !== it.k) }))}><LIcon name="x" size={15} /></button> : <span></span>}
        </div>)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-sm" onClick={() => setF(x => ({ ...x, items: [...x.items, line()] }))}><LIcon name="plus" size={14} />เพิ่มรายการ</button>
          <span style={{ marginLeft: 'auto', fontSize: 14 }}>รวมบิล <b className="num" style={{ fontSize: 18 }}>{baht2(total)}</b></span>
        </div>
      </div>
    </Field>
    <Field label="หมายเหตุ"><input value={f.note} onChange={set('note')} placeholder="เช่น สั่งผ่าน Shopee, มีใบกำกับภาษี" /></Field>
    {!initial && <Field label="จ่ายจาก"><SrcSelect value={f.src} onChange={set('src')} none="ไม่บันทึกลงบัญชี" /></Field>}
  </FormModal>;
}

function PjCrewForm({ projId, initial, onClose }) {
  const i = initial || {};
  const [f, set] = useF({ name: i.name || '', role: i.role || PJ_ROLES[0], phone: i.phone || '', contract: i.contract || '', scope: i.scope || '' });
  return <FormModal title={initial ? 'แก้ไขข้อมูลช่าง' : 'เพิ่มช่าง / ผู้รับเหมา'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpdate(() => { const p = pjFind(projId); const c = { ...i, ...f, id: i.id || lid(), name: f.name.trim(), contract: numv(f.contract), draws: i.draws || [] }; const k = p.crews.findIndex(x => x.id === c.id); if (k >= 0) p.crews[k] = c; else p.crews.push(c); }, 'บันทึกข้อมูลช่างแล้ว')}
    onDelete={initial ? () => losUpdate(() => { const p = pjFind(projId); p.crews = p.crews.filter(x => x.id !== i.id); }, 'ลบแล้ว') : null}>
    <G2><Field label="ชื่อ"><input value={f.name} onChange={set('name')} placeholder="เช่น พี่แมน" autoFocus={!initial} /></Field>
      <Field label="เบอร์โทร"><input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="ไม่บังคับ" /></Field></G2>
    <G2><Field label="บทบาท"><select value={f.role} onChange={set('role')}>{PJ_ROLES.map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="ตกลงค่าแรงทั้งหมด (บาท)"><input value={f.contract} onChange={set('contract')} inputMode="decimal" placeholder="ไม่บังคับ" /></Field></G2>
    <Field label="ขอบเขตงาน / ข้อตกลง"><textarea rows={2} value={f.scope} onChange={set('scope')} placeholder="เช่น ค่าแรงทั้งหมด ไม่รวมวัสดุ, รับประกันงาน 1 ปี" style={{ resize: 'vertical' }} /></Field>
  </FormModal>;
}

function PjDrawForm({ projId, crewId, initial, onClose }) {
  const i = initial || {};
  const p = pjFind(projId), c = p && p.crews.find(x => x.id === crewId);
  const [f, set] = useF({ date: i.date || TODAY_ISO, amt: i.amt ? String(i.amt) : '', note: i.note || '', src: '' });
  if (!c) return null;
  const left = (+c.contract || 0) - crewPaid(c) + (+i.amt || 0);
  return <FormModal title={(initial ? 'แก้ไขการเบิก · ' : 'เบิกค่าแรง · ') + c.name} onClose={onClose} valid={numv(f.amt) > 0}
    onSave={() => losUpdate(() => {
      const cc = pjFind(projId).crews.find(x => x.id === crewId);
      const d = { id: i.id || lid(), date: f.date, amt: numv(f.amt), note: f.note.trim(), txn: i.txn };
      if (!initial && f.src) d.txn = addTxn({ type: 'expense', amount: d.amt, src: f.src, cat: 'บ้าน', name: `ค่าแรง ${cc.name} · ${pjFind(projId).name}`, date: f.date }).id;
      const k = cc.draws.findIndex(x => x.id === d.id); if (k >= 0) cc.draws[k] = d; else cc.draws.push(d);
    }, `บันทึกเบิก ${baht2(numv(f.amt))} แล้ว`)}
    onDelete={initial ? () => losUpdate(() => { const cc = pjFind(projId).crews.find(x => x.id === crewId); if (i.txn) removeTxn(i.txn); cc.draws = cc.draws.filter(x => x.id !== i.id); }, 'ลบการเบิกแล้ว') : null}>
    <G2><Field label="จำนวนเงิน"><input className="big-num" value={f.amt} onChange={set('amt')} inputMode="decimal" placeholder="0" autoFocus /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field></G2>
    {+c.contract > 0 && <div className="hint" style={{ margin: '-6px 2px 14px' }}>ค่าแรงคงเหลือก่อนเบิกครั้งนี้ {baht2(left)}{numv(f.amt) > 0 ? ` · หลังเบิก ${baht2(left - numv(f.amt))}` : ''}</div>}
    <Field label="หมายเหตุ"><input value={f.note} onChange={set('note')} placeholder="เช่น งวดที่ 2 หลังเทพื้นเสร็จ" /></Field>
    {!initial && <Field label="จ่ายจาก"><SrcSelect value={f.src} onChange={set('src')} none="ไม่บันทึกลงบัญชี" /></Field>}
  </FormModal>;
}
Object.assign(LOS_FORMS, { project: ProjectForm, pjBill: PjBillForm, pjCrew: PjCrewForm, pjDraw: PjDrawForm });
Object.assign(window, { ProjectsSection, ProjectDetail, ProjectForm, PjBillForm, PjCrewForm, PjDrawForm, pjStats, openProj });
