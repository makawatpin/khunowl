// lifeos-things.jsx — Assets/Warranty, Documents, Home
const yrsBetween = (a, b) => Math.max(0, (toDate(b || TODAY_ISO) - toDate(a)) / (365.25 * 86400000));
const yrsLabel = (y) => y < 1 ? Math.max(1, Math.round(y * 12)) + ' เดือน' : (Math.round(y * 10) / 10) + ' ปี';
function AssetsScreen() {
  const [selId, setSelId] = React.useState(null);
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const sel = LOS_ASSETS.find(a => a.id === selId);
  const active = LOS_ASSETS.filter(a => !a.sold), sold = LOS_ASSETS.filter(a => a.sold);
  const base = tab === 'sold' ? sold : tab === 'warranty' ? active.filter(a => a.warranty && daysTo(a.warranty) >= 0) : tab === 'appliance' ? active.filter(a => a.kind === 'เครื่องใช้ไฟฟ้า') : active;
  const ql = q.trim().toLowerCase();
  const list = base.filter(a => !ql || [a.name, a.brand, a.model, a.serial, a.store, a.channel].some(x => x && String(x).toLowerCase().includes(ql))).slice().sort((a, b) => a.bought < b.bought ? 1 : -1);
  const expiring = active.filter(a => { const n = daysTo(a.warranty); return a.warranty && n >= 0 && n <= 45; });
  const saved = LOS_ASSETS.reduce((s, a) => s + Math.max(0, (+a.listPrice || 0) - (+a.price || 0)), 0);
  const recovered = sold.reduce((s, a) => s + (+a.soldPrice || 0), 0);
  return (
    <>
      <div className="grid g3">
        <Stat tint="hero" label="มูลค่าของที่ใช้อยู่ (ราคาซื้อ)" value={money(assetValue())} sub={`${active.length} ชิ้น${sold.length ? ` · ขายไปแล้ว ${sold.length} ชิ้น` : ''}`} />
        <Stat tint="pos" label="ประหยัดจากราคาป้าย" value={money(saved)} sub={recovered ? `ขายของเก่าได้คืน ${money(recovered)}` : 'ใส่ราคาป้ายเพื่อคำนวณ'} />
        <Stat tint="warn" label="ประกันใกล้หมด (45 วัน)" value={expiring.length + ' ชิ้น'} sub={expiring.map(a => a.name).join(', ') || `ยังมีประกัน ${active.filter(a => a.warranty && daysTo(a.warranty) >= 0).length} ชิ้น`} />
      </div>
      <Sec title="ทรัพย์สินทั้งหมด" action="+ เพิ่ม" onAction={() => losOpen('asset')} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'ใช้อยู่' }, { id: 'warranty', label: 'ยังมีประกัน' }, { id: 'appliance', label: 'เครื่องใช้ไฟฟ้า' }, { id: 'sold', label: `ขาย/ปลดระวางแล้ว (${sold.length})` }]} />
      <div className="pj-search"><LIcon name="search" size={15} color="var(--ink-faint)" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อ ยี่ห้อ รุ่น ซีเรียล ร้าน" />{q && <button className="link-btn" onClick={() => setQ('')}>ล้าง</button>}</div>
      <Card pad={false}>
        {list.length ? list.map(a => { const w = warrantyState(a.warranty); return <Row key={a.id} icon="box" title={a.name} sub={[[a.brand, a.model].filter(Boolean).join(' '), 'ซื้อ ' + dShort(a.bought), a.channel || a.store].filter(Boolean).join(' · ')} right={money(a.price)} rightSub={a.sold ? 'ขายได้ ' + money(a.soldPrice) : w.label} onClick={() => setSelId(a.id)} />; }) : <Empty text={q ? 'ไม่พบรายการ' : tab === 'sold' ? 'ยังไม่มีของที่ขายไป' : 'ยังไม่มีทรัพย์สิน'} action={q || tab === 'sold' ? null : 'เพิ่ม'} onAction={() => losOpen('asset')} />}
      </Card>
      {sel && (() => { const used = yrsBetween(sel.bought, sel.sold ? sel.soldDate : TODAY_ISO), off = (+sel.listPrice || 0) - (+sel.price || 0), wy = sel.warranty ? yrsBetween(sel.bought, sel.warranty) : 0, cost = (+sel.price || 0) - (sel.sold ? (+sel.soldPrice || 0) : 0);
        return <Modal title={sel.name} onClose={() => setSelId(null)} foot={[
          <button key="d" className="btn btn-danger" onClick={() => { setSelId(null); losRemove(LOS_ASSETS, sel.id, 'ลบทรัพย์สินแล้ว'); }} aria-label="ลบ"><LIcon name="trash" size={15} /></button>,
          <button key="e" className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setSelId(null); losOpen('asset', { initial: sel }); }}>{sel.sold ? 'แก้ไข' : 'แก้ไข / บันทึกขาย'}</button>]}>
          <Detail rows={[['ประเภท', sel.kind], ['แบรนด์', sel.brand || '—'], sel.model ? ['รุ่น', sel.model] : null, ['ซีเรียล', <span className="num">{sel.serial || '—'}</span>],
            ['ราคาที่จ่าย', money(sel.price)], off > 0 ? ['ราคาป้าย', <span>{money(sel.listPrice)} <Badge tone="green">ลด {Math.round(off / sel.listPrice * 100)}%</Badge></span>] : null,
            ['วันที่ซื้อ', dLong(sel.bought)], sel.channel ? ['ช่องทาง', sel.channel] : null, ['ร้าน', sel.store || '—'],
            ['ประกัน', sel.warranty ? <span>{wy >= 0.9 ? Math.round(wy) + ' ปี · ' : ''}ถึง {dLong(sel.warranty)} <Badge tone={warrantyState(sel.warranty).tone}>{warrantyState(sel.warranty).label}</Badge></span> : '—'],
            [sel.sold ? 'ใช้งานไป' : 'ใช้มาแล้ว', yrsLabel(used)],
            sel.sold ? ['ขายได้', <span>{money(sel.soldPrice)} · {dLong(sel.soldDate)}</span>] : null,
            used >= 0.5 ? ['ต้นทุนต่อปี', money(cost / Math.max(used, 1 / 12))] : null,
            sel.sold ? ['ต้นทุนจริงสุทธิ', <b className="num">{money(cost)}</b>] : null,
            sel.note ? ['หมายเหตุ', sel.note] : null]} />
          <Sec title="เอกสารที่ผูกไว้" />
          {(() => { const docs = LOS_DOCS.filter(d => d.rel && (sel.name.includes(d.rel) || d.rel.includes(sel.name) || sel.name.includes(d.rel.split(' ')[0] + ' ') )); return <Card pad={false}>{docs.length ? docs.map(d => <Row key={d.id} icon="doc" title={d.name} sub={d.type} right={d.expiry ? dShort(d.expiry) : '—'} />) : <Empty text="ยังไม่มีเอกสาร" />}</Card>; })()}
        </Modal>; })()}
    </>
  );
}

function DocsScreen() {
  const [q, setQ] = React.useState('');
  const types = [...new Set(LOS_DOCS.map(d => d.type))];
  const [type, setType] = React.useState('');
  const list = LOS_DOCS.filter(d => (!type || d.type === type) && (!q || (d.name + d.rel).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (a.expiry || '9999') < (b.expiry || '9999') ? -1 : 1);
  const expiring = LOS_DOCS.filter(d => d.expiry && daysTo(d.expiry) >= 0 && daysTo(d.expiry) <= 60);
  return (
    <>
      <div className="grid g2">
        <Stat tint="hero" label="เอกสารทั้งหมด" value={LOS_DOCS.length + ' ฉบับ'} />
        <Stat tint="warn" label="ใกล้หมดอายุ (60 วัน)" value={expiring.length + ' ฉบับ'} sub={expiring.map(d => d.name).join(', ')} />
      </div>
      <Sec title="คลังเอกสาร" action="+ เพิ่มเอกสาร" onAction={() => losOpen('doc')} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <div className="searchbox" style={{ maxWidth: 260 }}><LIcon name="search" size={15} color="var(--ink-faint)" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเอกสาร" /></div>
        <div className="chips"><button className={'chip' + (type === '' ? ' on' : '')} onClick={() => setType('')}>ทั้งหมด</button>{types.map(t => <button key={t} className={'chip' + (type === t ? ' on' : '')} onClick={() => setType(t)}>{t}</button>)}</div>
      </div>
      <Card pad={false}>
        {list.length ? list.map(d => { const dd = d.expiry ? dueLabel(d.expiry) : null; return <Row key={d.id} icon="doc" tone={dd && (dd.tone === 'amber' || dd.tone === 'red') ? 'warn' : null} title={d.name} sub={d.type + (d.rel ? ' · ' + d.rel : '')} right={d.expiry ? dShort(d.expiry) : 'ไม่หมดอายุ'} rightSub={dd ? dd.text : ''} onClick={() => losOpen('doc', { initial: d })} />; }) : <Empty text="ไม่พบเอกสาร" action="เพิ่มเอกสาร" onAction={() => losOpen('doc')} />}
      </Card>
    </>
  );
}

function HomeInfoForm({ onClose }) {
  const [f, set] = useF({ ...LOS_HOME });
  return <FormModal title="ข้อมูลบ้าน" onClose={onClose} valid={String(f.name).trim()} onSave={() => losUpdate(() => Object.assign(LOS_HOME, { ...f, rent: numv(f.rent) }), 'บันทึกข้อมูลบ้านแล้ว')}>
    <Field label="ชื่อ"><input value={f.name} onChange={set('name')} /></Field>
    <G2><Field label="สถานะ"><select value={f.kind} onChange={set('kind')}>{['เช่า', 'เป็นเจ้าของ', 'ผ่อน', 'อยู่กับครอบครัว'].map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="ขนาด"><input value={f.size} onChange={set('size')} /></Field>
      <Field label={f.kind === 'ผ่อน' ? 'ค่างวด/เดือน' : 'ค่าเช่า/เดือน'}><input value={f.rent} onChange={set('rent')} inputMode="decimal" /></Field>
      <Field label="อยู่ตั้งแต่"><input type="date" value={f.since} onChange={set('since')} /></Field></G2>
  </FormModal>;
}
function HomeScreen() {
  const openProj = LOS_PROJECTS.find(p => p.id === PROJ_OPEN);
  if (openProj) return <ProjectDetail p={openProj} />;
  const appliances = LOS_ASSETS.filter(a => a.kind === 'เครื่องใช้ไฟฟ้า');
  const homeBills = LOS_BILLS.filter(b => /ไฟ|น้ำ|เน็ต|Fibre|ส่วนกลาง/i.test(b.name));
  const upkeep = LOS_HOME_TASKS.reduce((s, h) => s + (+h.cost || 0) / (CYCLE_MONTHS[h.every] || 12), 0);
  const tasks = [...LOS_HOME_TASKS].sort((a, b) => a.next < b.next ? -1 : 1);
  return (
    <>
      <HeroHeader icon="house" title={LOS_HOME.name} sub={`${LOS_HOME.kind}${LOS_HOME.size ? ' · ' + LOS_HOME.size : ''} · อยู่มาตั้งแต่ ${dLong(LOS_HOME.since)}`}
        statLabel="ต่อเดือน" statValue={money(LOS_HOME.rent)}
        chips={[['เครื่องใช้ไฟฟ้า', appliances.length + ' ชิ้น'], ['งานดูแล', LOS_HOME_TASKS.length + ' รายการ'], ['ถึงกำหนด 30 วัน', LOS_HOME_TASKS.filter(h => daysTo(h.next) <= 30).length + ' รายการ']]} />
      <div className="actbar"><button className="btn" onClick={() => losOpen('HomeInfoForm')}><LIcon name="edit" size={15} />แก้ไขข้อมูลบ้าน</button></div>
      <ProjectsSection />
      <Sec title="ตารางดูแลบ้าน" action="+ เพิ่มงาน" onAction={() => losOpen('homeTask')} />
      <Card pad={false}>
        {tasks.length ? tasks.map(h => <ActRow key={h.id} icon="wrench" tone={daysTo(h.next) < 0 ? 'neg' : daysTo(h.next) <= 14 ? 'warn' : null} title={h.name} sub={`${h.every}${h.last ? ' · ทำล่าสุด ' + dShort(h.last) : ''}${h.cost ? ' · ~' + money(h.cost) : ''}`} due={h.next} btn="ทำแล้ว" onBtn={() => losActions.homeDone(h.id)} onClick={() => losOpen('homeTask', { initial: h })} />) : <Empty text="ยังไม่มีงานดูแลบ้าน" action="เพิ่มงาน" onAction={() => losOpen('homeTask')} />}
      </Card>
      <Sec title="เครื่องใช้ไฟฟ้า" />
      <Card pad={false}>
        {appliances.length ? appliances.map(a => <Row key={a.id} icon="box" title={a.name} sub={`${a.brand} · ซื้อ ${dLong(a.bought)}`} right={money(a.price)} rightSub={warrantyState(a.warranty).label} onClick={() => losOpen('asset', { initial: a })} />) : <Empty text="ยังไม่มีเครื่องใช้ไฟฟ้า" />}
      </Card>
      <Sec title="ค่าใช้จ่ายบ้านต่อเดือน" />
      <Card>
        <Detail rows={[[LOS_HOME.kind === 'ผ่อน' ? 'ค่างวด' : 'ค่าเช่า', money(LOS_HOME.rent)], ...homeBills.map(b => [b.name, money(b.amount / (CYCLE_MONTHS[b.cycle] || 1))]), ['ดูแลบ้านเฉลี่ย', money(upkeep)], ['รวม', <b className="num">{money(+LOS_HOME.rent + homeBills.reduce((s, b) => s + b.amount / (CYCLE_MONTHS[b.cycle] || 1), 0) + upkeep)}</b>]]} />
      </Card>
    </>
  );
}
Object.assign(window, { AssetsScreen, DocsScreen, HomeScreen, HomeInfoForm });
