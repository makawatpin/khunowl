// lifeos-life.jsx — Calendar, Notification Center, Global Search
const EV_ICON = { bill: 'clock', sub: 'clock', card: 'card', income: 'money', warranty: 'shield', home: 'wrench', vehicle: 'car', task: 'check', doc: 'doc' };
const EV_TONE = (t) => t === 'red' ? 'neg' : t === 'amber' ? 'warn' : t === 'green' ? 'pos' : t === 'accent' ? 'accent' : null;
function CalendarScreen() {
  const events = calendarEvents();
  const [ym, setYm] = React.useState({ y: TODAY.getFullYear(), m: TODAY.getMonth() });
  const { y: year, m: month } = ym;
  const shift = (d) => setYm(({ y, m }) => { const n = m + d; return { y: y + Math.floor(n / 12), m: ((n % 12) + 12) % 12 }; });
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const iso = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const [sel, setSel] = React.useState(TODAY_ISO);
  const byDay = (d) => events.filter(e => e.date === iso(d));
  const dayEvents = events.filter(e => e.date === sel);
  const upcoming = events.filter(e => e.date >= TODAY_ISO).slice(0, 5);
  const mk = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEv = events.filter(e => e.date.startsWith(mk));
  const monthOut = monthEv.filter(e => ['bill', 'sub', 'card'].includes(e.kind)).reduce((s, e) => s + (parseFloat(String(e.sub).replace(/[^\d.]/g, '')) || 0), 0);
  const isThisMonth = year === TODAY.getFullYear() && month === TODAY.getMonth();
  return (
    <div className="calwrap">
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="เดือนก่อน"><LIcon name="back" size={15} /></button>
          <div style={{ fontSize: 19, fontWeight: 600, minWidth: 150, textAlign: 'center' }}>{MONTHS_TH[month]} {year}</div>
          <button className="btn btn-sm" onClick={() => shift(1)} aria-label="เดือนถัดไป"><LIcon name="arrow" size={15} /></button>
          {!isThisMonth && <button className="btn btn-sm" onClick={() => { setYm({ y: TODAY.getFullYear(), m: TODAY.getMonth() }); setSel(TODAY_ISO); }}>วันนี้</button>}
        </div>
        <div className="calhead">{['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d, i) => <div key={i}>{d}</div>)}</div>
        <div className="calgrid">
          {cells.map((d, i) => {
            if (!d) return <div key={'p' + i} className="calday pad"></div>;
            const evs = byDay(d), isToday = iso(d) === TODAY_ISO, on = iso(d) === sel;
            return (
              <button key={d} className={'calday' + (isToday ? ' today' : '') + (on ? ' on' : '')} onClick={() => setSel(iso(d))}>
                <span className="dnum num">{d}</span>
                <span className="cal-dots">{evs.slice(0, 4).map((e, k) => <i key={k} className={'d-' + (e.tone || 'x')}></i>)}</span>
                {evs.slice(0, 2).map((e, k) => <span key={k} className={'ev' + (e.tone ? ' ' + e.tone : '')}>{e.title}</span>)}
                {evs.length > 2 && <span className="ev-more">+{evs.length - 2}</span>}
              </button>);
          })}
        </div>
        <Sec title={'วันที่ ' + dLong(sel)} action="+ เพิ่มงาน" onAction={() => losOpen('task', { initial: null })} />
        <Card pad={false}>{dayEvents.length ? dayEvents.map((e, i) => <Row key={i} logo={e.domain} icon={EV_ICON[e.kind]} tone={EV_TONE(e.tone)} title={e.title} sub={e.sub} />) : <Empty text="ไม่มีกำหนดการวันนี้" />}</Card>
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card>
          <Cap>สรุป{MONTHS_TH[month]}</Cap>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            <div><div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{monthEv.length}</div><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>กำหนดการ</div></div>
            <div><div className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--neg)' }}>{money(monthOut)}</div><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>ต้องจ่าย</div></div>
          </div>
        </Card>
        <Card pad={false}>
          <div className="card-head"><span>กำลังจะถึง</span></div>
          {upcoming.length ? upcoming.map((e, i) => <Row key={i} logo={e.domain} icon={EV_ICON[e.kind]} tone={EV_TONE(e.tone)} title={e.title} sub={e.sub} right={dShort(e.date)} rightSub={dueLabel(e.date).text} />) : <Empty text="ไม่มีรายการ" />}
        </Card>
      </div>
    </div>
  );
}

function NotisScreen() {
  const all = notifications();
  const [showDone, setShowDone] = React.useState(false);
  const open = all.filter(n => !n.done);
  const groups = ['ต้องจ่าย', 'ใกล้หมดอายุ', 'ต้องเตรียม'];
  const toneVar = (t) => t === 'red' ? 'neg' : t === 'amber' ? 'warn' : t === 'green' ? 'pos' : 'accent';
  const list = showDone ? all : open;
  return (
    <>
      <div className="grid g3">
        <Stat tint="hero" label="ต้องจัดการ" value={open.length + ' รายการ'} />
        <Stat tint="neg" label="ต้องจ่ายรวม (8 วัน)" value={money(open.filter(n => n.group === 'ต้องจ่าย').reduce((s, n) => { const b = n.action && n.action.kind === 'payBill' ? LOS_BILLS.find(x => x.id === n.action.id) : null; const c = n.action && n.action.kind === 'payCard' ? LOS_CARDS.find(x => x.id === n.action.id) : null; return s + (b ? b.amount : c ? c.used : 0); }, 0))} />
        <Stat tint="pos" label="จัดการแล้ว" value={(all.length - open.length) + ' รายการ'} />
      </div>
      <div className="chips" style={{ marginTop: 16 }}><button className={'chip' + (!showDone ? ' on' : '')} onClick={() => setShowDone(false)}>ยังไม่จัดการ</button><button className={'chip' + (showDone ? ' on' : '')} onClick={() => setShowDone(true)}>ทั้งหมด</button></div>
      {!list.length && <Card style={{ marginTop: 16 }}><Empty text="ไม่มีเรื่องต้องจัดการ" /></Card>}
      {groups.map(g => { const items = list.filter(n => n.group === g); if (!items.length) return null; return (
        <React.Fragment key={g}>
          <Sec title={g} />
          <Card pad={false}>{items.map(n => (
            <div key={n.id} className="row" style={n.done ? { opacity: .5 } : null}>
              {n.domain ? <BrandLogo domain={n.domain} /> : <span className="ic" style={{ background: `var(--${toneVar(n.tone)}-soft)` }}><LIcon name={n.group === 'ต้องจ่าย' ? 'card' : n.group === 'ใกล้หมดอายุ' ? 'shield' : 'wrench'} size={17} color={`var(--${toneVar(n.tone)})`} /></span>}
              <span style={{ flex: 1, minWidth: 0 }}><span className="row-t">{n.title}</span><span className="row-s">{n.sub}</span></span>
              {n.done ? <Badge tone="green">เรียบร้อย</Badge> : <div style={{ display: 'flex', gap: 6 }}>
                {n.action && <button className="btn btn-sm btn-primary" onClick={() => losActions[n.action.kind](n.action.id)}>{n.action.label}</button>}
                <button className="btn btn-sm" onClick={() => losActions.notiDone(n.id)}>{n.action ? 'ซ่อน' : 'รับทราบ'}</button>
              </div>}
            </div>))}
          </Card>
        </React.Fragment>); })}
      <p className="hint">เปิดการแจ้งเตือนบนเบราว์เซอร์ได้ในหน้าตั้งค่า</p>
    </>
  );
}

function SearchScreen({ q, setQ, go }) {
  const res = searchAll(q);
  const groups = [...new Set(res.map(r => r.kind))];
  const ic = { 'ทรัพย์สิน': 'box', 'บิล': 'clock', 'สมาชิกรายเดือน': 'clock', 'เอกสาร': 'doc', 'ประวัติรถ': 'wrench', 'รถ': 'car', 'ดูแลบ้าน': 'house', 'งาน': 'check', 'บัญชี': 'money', 'บัตรเครดิต': 'card', 'รายการเงิน': 'money' };
  return (
    <>
      <div className="searchbox" style={{ maxWidth: 520, marginBottom: 6 }}><LIcon name="search" size={16} color="var(--ink-faint)" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาทุกอย่าง — iPhone, ประกัน, Netflix, ยาง" /></div>
      {!q.trim() ? <Empty text="พิมพ์เพื่อค้นหาบัญชี รายการเงิน ทรัพย์สิน บิล เอกสาร ประวัติรถ และงาน" />
        : res.length === 0 ? <Empty text={`ไม่พบ “${q}”`} />
        : groups.map(g => (
          <React.Fragment key={g}>
            <Sec title={`${g} (${res.filter(r => r.kind === g).length})`} />
            <Card pad={false}>{res.filter(r => r.kind === g).slice(0, 20).map((r, i) => <Row key={i} icon={ic[r.kind]} title={r.title} sub={r.sub} onClick={() => go(r.nav)} right={<LIcon name="arrow" size={15} color="var(--ink-faint)" />} />)}</Card>
          </React.Fragment>))}
    </>
  );
}
Object.assign(window, { CalendarScreen, NotisScreen, SearchScreen });
