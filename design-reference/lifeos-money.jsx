// lifeos-money.jsx — Dashboard, Money, Bills & Cards, Forecast
const CAT_ICON = { 'อาหาร': 'food', 'เดินทาง': 'car', 'ช้อปปิ้ง': 'box', 'บ้าน': 'house', 'บิล/ค่าน้ำไฟ': 'clock', 'บันเทิง': 'star', 'สุขภาพ': 'shield', 'รถ': 'fuel', 'โอน': 'swap', 'ชำระบัตร': 'card' };
function ActRow({ logo, bank, icon, tone, title, sub, amount, due, btn, onBtn, onClick }) {
  const d = due ? dueLabel(due) : null;
  return (
    <div className={'row' + (onClick ? ' rowlink' : '')} onClick={onClick} role={onClick ? 'button' : undefined}>
      {logo !== undefined ? <BrandLogo domain={logo} fallback={<span className="ic"><LIcon name={icon || 'card'} size={17} color="var(--ink-soft)" /></span>} /> : bank ? <BankMark bank={bank} /> : <span className="ic" style={tone ? { background: `var(--${tone}-soft)`, borderColor: 'transparent' } : null}><LIcon name={icon || 'card'} size={17} color={tone ? `var(--${tone})` : 'var(--ink-soft)'} /></span>}
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{title}</span>
        {sub && <span className="row-s">{sub}</span>}
      </span>
      <span style={{ textAlign: 'right', flexShrink: 0 }}>
        {amount != null && <span className="num" style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{amount}</span>}
        {d && <Badge tone={d.tone}>{d.text}</Badge>}
      </span>
      {btn && <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onBtn(); }}>{btn}</button>}
    </div>
  );
}
function dayLabel(iso) { const n = daysTo(iso); return n === 0 ? 'วันนี้' : n === -1 ? 'เมื่อวาน' : dShort(iso); }
function groupDays(list) { const m = []; list.forEach(t => { let g = m[m.length - 1]; if (!g || g.date !== t.date) { g = { date: t.date, items: [], net: 0 }; m.push(g); } g.items.push(t); g.net += t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0; }); return m; }
function TxnRow({ t }) {
  const inc = t.type === 'income', tr = t.type === 'transfer';
  return <Row icon={CAT_ICON[t.cat] || (inc ? 'money' : 'card')} cat={!inc && !tr ? t.cat : null} tone={inc ? 'pos' : tr ? 'accent' : null} title={t.name}
    sub={`${dShort(t.date)} · ${tr ? srcName(t.src) + ' → ' + srcName(t.to) : (t.cat || '') + ' · ' + srcName(t.src)}`}
    right={<span style={{ color: inc ? 'var(--pos)' : tr ? 'var(--ink-soft)' : 'var(--ink)' }}>{inc ? '+' : tr ? '' : '−'}{money(t.amount)}</span>}
    onClick={() => losOpen(tr ? 'transfer' : 'txn', { initial: t })} />;
}
function DashboardScreen({ go }) {
  const f = forecast(10), pays = upcomingPayments(10);
  const tasks = LOS_TASKS.filter(t => !t.done && daysTo(t.due) <= 1).sort((a, b) => a.due < b.due ? -1 : 1);
  const notis = notifications().filter(n => !n.done && n.group !== 'ต้องจ่าย').slice(0, 4);
  const h = new Date().getHours();
  const hello = h < 11 ? 'สวัสดีตอนเช้า' : h < 16 ? 'สวัสดีตอนบ่าย' : h < 19 ? 'สวัสดีตอนเย็น' : 'สวัสดีตอนค่ำ';
  const payTotal = pays.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div className="cap">{D_TH[TODAY.getDay()]} {TODAY.getDate()} {MONTHS_TH[TODAY.getMonth()]} {TODAY.getFullYear()}</div>
        <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>{hello} · 10 วันนี้มี {pays.length} รายการต้องจ่าย ({money(payTotal)}) และ {tasks.length} งานถึงกำหนด</p>
      </div>
      <div className="dash">
        <div style={{ minWidth: 0 }}>
          <div className="grid g2">
            <HeroStat label="เงินคงเหลือรวม" value={money(totalBalance())} sub={`${LOS_ACCOUNTS.length} บัญชี · หนี้บัตร ${money(cardDebt())}`}
              cols={[['รับเดือนนี้', money(monthIncome())], ['ใช้เดือนนี้', money(monthSpend())], ['สุทธิ', money(monthIncome() - monthSpend())]]} />
            <Card>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ flex: 1, minWidth: 0 }}><Cap>คาดการณ์เงินสด 10 วัน</Cap></span><button className="link-btn" onClick={() => go('forecast')}>ดู</button></div>
              <div className="num" style={{ fontSize: 30, fontWeight: 600, margin: '6px 0 12px', color: f.end < 0 ? 'var(--neg)' : 'var(--ink)' }}>{money(f.end)}</div>
              <Bar ratio={f.start > 0 ? Math.max(0, f.end) / Math.max(f.start, f.end) : 0} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14 }}>
                <div><Cap>จ่ายออก</Cap><div className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--neg)' }}>−{money(f.out)}</div></div>
                <div><Cap>รับเข้า</Cap><div className="num" style={{ fontSize: 16, fontWeight: 600, color: 'var(--pos)' }}>+{money(f.inc)}</div></div>
              </div>
            </Card>
          </div>
          <Sec title={pays.length ? `ต้องจ่ายภายใน 10 วัน · ${money(pays.reduce((s, p) => s + p.amount, 0))} (${pays.length} รายการ)` : 'ต้องจ่ายภายใน 10 วัน'} action="ทั้งหมด" onAction={() => go('bills')} />
          <Card pad={false}>{pays.length ? pays.map(p => <ActRow key={p.key} logo={p.kind === 'card' ? undefined : p.domain} bank={p.bank} icon="card" title={p.name} sub={p.sub} amount={money(p.amount)} due={p.date}
            btn={p.kind === 'bill' ? 'จ่าย' : p.kind === 'card' ? 'ชำระ' : null} onBtn={() => p.kind === 'bill' ? losActions.payBill(p.ref.id) : losOpen('payCard', { card: p.ref })} />)
            : <Empty text="ไม่มีรายการต้องจ่ายภายใน 10 วันนี้" action="เพิ่มบิล" onAction={() => losOpen('bill')} />}</Card>
          <Sec title="งานวันนี้" action="+ เพิ่มงาน" onAction={() => losOpen('task')} />
          <Card pad={false}>{tasks.length ? tasks.map(t => <CheckRow key={t.id} t={t} />) : <Empty text="ไม่มีงานค้างวันนี้" />}</Card>
        </div>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card pad={false}>
            <div className="card-head"><span>รถของฉัน</span><button className="link-btn" onClick={() => go('vehicle')}>ดู</button></div>
            {LOS_VEHICLES.length ? LOS_VEHICLES.map(v => { const nx = nextServiceKm(v), left = nx - v.mileage; return (
              <div key={v.id} className="row rowlink" onClick={() => go('vehicle')} role="button" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}><span className="row-t" style={{ flex: 1, minWidth: 0 }}>{vehicleName(v)}</span><span className="num" style={{ fontSize: 12.5, color: left < 1000 ? 'var(--neg)' : 'var(--ink-soft)', whiteSpace: 'nowrap' }}>อีก {left.toLocaleString()} กม.</span></div>
                <Bar ratio={1 - left / (+v.serviceEvery || 5000)} />
                <span className="row-s">{v.plate} · เช็กระยะ {nx.toLocaleString()} กม.</span>
              </div>); }) : <Empty text="ยังไม่มีรถ" action="เพิ่มรถ" onAction={() => go('vehicle')} />}
          </Card>
          <Card pad={false}>
            <div className="card-head"><span>เตือนความจำ</span><button className="link-btn" onClick={() => go('notis')}>ทั้งหมด</button></div>
            {notis.length ? notis.map(n => <Row key={n.id} icon={n.group === 'ใกล้หมดอายุ' ? 'shield' : 'wrench'} tone={n.tone === 'amber' ? 'warn' : n.tone === 'green' ? 'pos' : 'accent'} title={n.title} sub={n.sub} />) : <Empty text="ไม่มีเรื่องต้องเตรียม" />}
          </Card>
        </div>
      </div>
    </>
  );
}
function CheckRow({ t }) {
  const d = dueLabel(t.due);
  return <div className="row">
    <button className={'checkbox' + (t.done ? ' on' : '')} onClick={() => losActions.taskDone(t.id)} aria-label="ทำเสร็จ">{t.done && <LIcon name="check" size={14} color="#fff" />}</button>
    <span style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => losOpen('task', { initial: t })}>
      <span className="row-t" style={t.done ? { textDecoration: 'line-through', color: 'var(--ink-faint)' } : null}>{t.name}</span>
      <span className="row-s">{t.rel || 'ทั่วไป'} · {d.text}</span>
    </span>
    <Badge tone={t.pri === 'สูง' ? 'red' : t.pri === 'กลาง' ? 'amber' : ''}>{t.pri}</Badge>
  </div>;
}


const ACCT_LIMIT = 4;
function AcctList({ kind, go }) {
  useLOS();
  const isAcc = kind === 'acc', arr = isAcc ? LOS_ACCOUNTS : LOS_CARDS;
  const [all, setAll] = React.useState(false), [edit, setEdit] = React.useState(false);
  const sorted = [...arr].sort((x, y) => (y.pin ? 1 : 0) - (x.pin ? 1 : 0));
  const shown = all || edit || sorted.length <= ACCT_LIMIT + 1 ? sorted : sorted.slice(0, ACCT_LIMIT);
  const total = isAcc ? totalBalance() : cardDebt();
  const pin = (id) => losUpdate(() => { const x = arr.find(o => o.id === id); x.pin = !x.pin; }, null, false);
  const move = (id, d) => losUpdate(() => { const i = sorted.findIndex(o => o.id === id), j = i + d; if (j < 0 || j >= sorted.length) return; const ai = arr.indexOf(sorted[i]), aj = arr.indexOf(sorted[j]); if (!!sorted[i].pin !== !!sorted[j].pin) return; [arr[ai], arr[aj]] = [arr[aj], arr[ai]]; }, null, false);
  return <>
    <div className="sec"><h2>{isAcc ? 'บัญชี' : 'บัตรเครดิต'}</h2><span className="num acct-total">{isAcc ? '' : 'ค้าง '}{money(total)}</span>
      <span className="acct-acts">
        {arr.length > 1 && <button className="more" onClick={() => setEdit(!edit)}>{edit ? 'เสร็จ' : 'จัดเรียง'}</button>}
        <button className="more" onClick={() => isAcc ? losOpen('account') : losOpen('card')}>+ เพิ่ม</button>
      </span></div>
    <div className="card list acct-list">
      {shown.map((o, i) => {
        const open = () => !edit && (isAcc ? losOpen('account', { initial: o }) : losOpen('card', { initial: o }));
        const pct = !isAcc ? Math.min(100, (o.used || 0) / (o.limit || 1) * 100) : 0;
        return <div className="acct-row" key={o.id}>
          <button className="acct-main" onClick={open}>
            <BankMark bank={o.bank} size={38} />
            <span className="acct-name"><span className="row-t">{o.name}</span>
              <span className="row-s">{isAcc ? o.type : o.network}{o.last4 ? ' · •••• ' + o.last4 : ''}{!isAcc && <> · ชำระ {dShort(o.due)}</>}</span></span>
            <span className="acct-amt"><span className="num">{money(isAcc ? o.bal : o.used)}</span>
              {!isAcc && <span className="acct-lim">{Math.round(pct)}% ของวงเงิน</span>}</span>
          </button>
          {!isAcc && <div className="bar acct-bar"><i style={{ width: pct + '%', background: pct > 80 ? 'var(--neg)' : undefined }}></i></div>}
          {edit && <span className="acct-edit">
            <button className={'pin' + (o.pin ? ' on' : '')} onClick={() => pin(o.id)} aria-label="ปักหมุด"><LIcon name="star" size={16} /></button>
            <button onClick={() => move(o.id, -1)} disabled={i === 0} aria-label="ขึ้น"><LIcon name="chevup" size={16} /></button>
            <button onClick={() => move(o.id, 1)} disabled={i === shown.length - 1} aria-label="ลง"><LIcon name="chevdown" size={16} /></button>
          </span>}
        </div>;
      })}
      {!edit && sorted.length > ACCT_LIMIT + 1 && <button className="acct-more" onClick={() => setAll(!all)}>{all ? 'ย่อรายการ' : 'ดูทั้งหมด (' + sorted.length + ')'}</button>}
      {!arr.length && <Empty text={isAcc ? 'ยังไม่มีบัญชี' : 'ยังไม่มีบัตรเครดิต'} />}
    </div>
  </>;
}

function MoneyScreen({ go }) {
  const [flt, setFlt] = React.useState('all');
  const [more, setMore] = React.useState(false), [q, setQ] = React.useState(''), [acct, setAcct] = React.useState('');
  const ql = q.trim().toLowerCase();
  const tx = [...LOS_TXNS].filter(t => (flt === 'all' || t.type === flt) && (!acct || t.src === acct || t.to === acct) && (!ql || [t.name, t.cat, t.note].some(x => String(x || '').toLowerCase().includes(ql)))).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const cs = catSpend();
  const cats = [...new Set([...Object.keys(LOS_BUDGETS), ...Object.keys(cs)])].sort((a, b) => { const r = (n) => LOS_BUDGETS[n] ? (cs[n] || 0) / LOS_BUDGETS[n] : -1; return r(b) - r(a); });
  return (
    <>
      <div className="grid g3 money-stats">
        <Stat tint="hero" label="เงินคงเหลือรวม" value={money(totalBalance())} sub={LOS_ACCOUNTS.length + ' บัญชี'} />
        <Stat tint="warn" label="ยอดค้างบัตรเครดิต" value={money(cardDebt())} sub={`${LOS_CARDS.length} ใบ`} />
        <Stat tint="accent" label={'ใช้ไปเดือน' + MONTHS_TH[TODAY.getMonth()]} value={money(monthSpend())} sub={'รับเข้า ' + money(monthIncome())} />
      </div>
      <div className="actbar">
        <button className="btn" onClick={() => losOpen('txn', { type: 'expense' })}><LIcon name="minus" size={15} />รายจ่าย</button>
        <button className="btn" onClick={() => losOpen('txn', { type: 'income' })}><LIcon name="plus" size={15} />รายรับ</button>
        <button className="btn" onClick={() => losOpen('transfer')}><LIcon name="swap" size={15} />โอนเงิน</button>
        <button className="btn slip-btn" onClick={() => losOpen('slips')}><LIcon name="slip" size={15} />อ่านสลิป</button>
      </div>
      <AcctList kind="acc" go={go} />
      <AcctList kind="card" go={go} />
      <Sec title="รายการล่าสุด" />
      <div className="tx-filter"><div className="searchbox"><LIcon name="search" size={15} color="var(--ink-faint)" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหารายการ" />{q && <button className="tx-clear" onClick={() => setQ('')} aria-label="ล้าง"><LIcon name="x" size={14} /></button>}</div>
        <select value={acct} onChange={e => setAcct(e.target.value)} aria-label="กรองตามบัญชี"><option value="">ทุกบัญชี/บัตร</option>{allSources().map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="chips" style={{ marginBottom: 10 }}>{[['all', 'ทั้งหมด'], ['expense', 'รายจ่าย'], ['income', 'รายรับ'], ['transfer', 'โอน']].map(([k, l]) => <button key={k} className={'chip' + (flt === k ? ' on' : '')} onClick={() => setFlt(k)}>{l}</button>)}</div>
      <Card pad={false}>
        {tx.length ? groupDays(tx.slice(0, more ? 200 : 8)).map(g => <div key={g.date} className="day-grp"><div className="day-head"><span>{dayLabel(g.date)}</span>{g.net !== 0 && <span className="num" style={{ color: g.net > 0 ? 'var(--pos)' : 'var(--ink-soft)' }}>{g.net > 0 ? '+' : '−'}{money(Math.abs(g.net))}</span>}</div>{g.items.map(t => <TxnRow key={t.id} t={t} />)}</div>) : (q || acct) ? <Empty text="ไม่พบรายการที่ตรงกับตัวกรอง" action="ล้างตัวกรอง" onAction={() => { setQ(''); setAcct(''); setFlt('all'); }} /> : <Empty text="ยังไม่มีรายการ" action="บันทึกรายจ่าย" onAction={() => losOpen('txn')} />}
        {tx.length > 8 && <button className="row rowlink" style={{ justifyContent: 'center', color: 'var(--accent-deep)', fontSize: 13.5 }} onClick={() => setMore(m => !m)}>{more ? 'ย่อ' : `ดูทั้งหมด ${tx.length} รายการ`}</button>}
      </Card>
      <Sec title="งบประมาณเดือนนี้" action="แก้ไขงบ" onAction={() => go('settings')} />
      <Card>
        {cats.length ? cats.map((n, i) => { const used = cs[n] || 0, budget = LOS_BUDGETS[n]; return (
          <div key={n} style={{ marginTop: i ? 16 : 0 }}>
            <div style={{ display: 'flex', fontSize: 14, marginBottom: 6, gap: 8 }}><span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>{catColor(n) && <i className="cat-dot" style={{ background: catColor(n).bar }}></i>}{n}</span><span className="num" style={{ color: budget && used > budget ? 'var(--neg)' : budget && used > budget * .85 ? '#B8762A' : 'var(--ink-soft)' }}>{money(used)}{budget ? ' / ' + money(budget) : ''}</span>{budget > 0 && <span className={'badge ' + (used > budget ? 'red' : used > budget * .85 ? 'amber' : '')} style={{ minWidth: 52, textAlign: 'center' }}>{used > budget ? 'เกิน ' + money(used - budget) : Math.round(used / budget * 100) + '%'}</span>}</div>
            <Bar ratio={budget ? used / budget : 0.02} color={catColor(n) && (!budget || used / budget <= 0.85) ? catColor(n).bar : undefined} />
          </div>); }) : <Empty text="ยังไม่ได้ตั้งงบ" />}
      </Card>
    </>
  );
}

function BillsScreen() {
  const [tab, setTab] = React.useState('bills');
  const bills = [...LOS_BILLS].sort((a, b) => a.due < b.due ? -1 : 1);
  return (
    <>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'bills', label: 'บิล' }, { id: 'subs', label: 'สมาชิก' }, { id: 'cards', label: 'บัตรเครดิต' }, { id: 'plans', label: 'ผ่อน 0%' }]} />
      {tab === 'bills' && <>
        <div className="grid g3" style={{ marginBottom: 6 }}>
          <Stat tint="hero" label="ค่าใช้จ่ายประจำ/เดือน" value={money(LOS_BILLS.reduce((s, b) => s + b.amount / (CYCLE_MONTHS[b.cycle] || 1), 0))} />
          <Stat tint="neg" label="ครบกำหนดใน 7 วัน" value={money(LOS_BILLS.filter(b => daysTo(b.due) <= 7).reduce((s, b) => s + b.amount, 0))} />
          <Stat tint="pos" label="ตัดอัตโนมัติ" value={LOS_BILLS.filter(b => b.auto).length + ' / ' + LOS_BILLS.length} />
        </div>
        <Sec title="เรียงตามวันครบกำหนด" action="+ เพิ่มบิล" onAction={() => losOpen('bill')} />
        <Card pad={false}>{bills.length ? bills.map(b => <ActRow key={b.id} logo={b.domain} icon="clock" title={b.name}
          sub={`${b.cycle} · ${b.auto ? 'ตัดอัตโนมัติ' : 'จ่ายเอง'} · ${srcName(b.account)}${b.lastPaid ? ' · จ่ายล่าสุด ' + dShort(b.lastPaid) : ''}`}
          amount={money(b.amount)} due={b.due} btn="จ่าย" onBtn={() => losActions.payBill(b.id)} onClick={() => losOpen('bill', { initial: b })} />) : <Empty text="ยังไม่มีบิล" action="เพิ่มบิล" onAction={() => losOpen('bill')} />}</Card>
        <p className="hint">กด “จ่าย” ระบบจะหักเงินจากบัญชีที่ผูกไว้ บันทึกรายจ่าย และเลื่อนไปงวดถัดไปให้ (กดเลิกทำได้)</p>
      </>}
      {tab === 'subs' && <>
        <div className="grid g2" style={{ marginBottom: 6 }}>
          <Stat tint="hero" label="รวมต่อเดือน" value={money(subsMonthly())} sub={LOS_SUBS.length + ' บริการ'} />
          <Stat tint="accent" label="รวมต่อปี" value={money(subsMonthly() * 12)} />
        </div>
        <Sec title="บริการที่สมัคร" action="+ เพิ่ม" onAction={() => losOpen('sub')} />
        <Card pad={false}>{LOS_SUBS.length ? [...LOS_SUBS].sort((a, b) => a.next < b.next ? -1 : 1).map(s => <ActRow key={s.id} logo={s.domain} icon="clock" title={s.name} sub={`ราย${s.cycle} · ${srcName(s.src)}`} amount={money(s.price)} due={s.next} onClick={() => losOpen('sub', { initial: s })} />) : <Empty text="ยังไม่มีสมาชิกรายเดือน" action="เพิ่ม" onAction={() => losOpen('sub')} />}</Card>
        <p className="hint">ระบบตัดเงินและบันทึกรายจ่ายให้อัตโนมัติเมื่อถึงวัน</p>
      </>}
      {tab === 'cards' && <>
        <AcctList kind="card" go={() => {}} />
        <div className="grid g2" style={{ marginTop: 16 }}>{LOS_CARDS.map(c => (
          <Card key={c.id}>
            <div className="card-head" style={{ padding: '0 0 10px' }}><BankMark bank={c.bank} size={30} />{c.name}<span style={{ marginLeft: 'auto' }} className="num">{money(c.used)}</span></div>
            <Detail rows={[['วงเงิน', money(c.limit)], ['คงเหลือ', money(c.limit - c.used)], ['วันสรุปยอด', dShort(c.statement)], ['กำหนดชำระ', <span>{dShort(c.due)} <Badge tone={dueLabel(c.due).tone}>{dueLabel(c.due).text}</Badge></span>], ['ขั้นต่ำ', money(c.min)], LOS_PLANS.some(p => p.card === c.id && p.paid < p.months) ? ['ผ่อนอยู่', LOS_PLANS.filter(p => p.card === c.id && p.paid < p.months).length + ' รายการ'] : null]} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!c.used} onClick={() => losOpen('payCard', { card: c })}>ชำระบัตร</button>
              <button className="btn" onClick={() => losOpen('card', { initial: c })}>แก้ไข</button>
            </div>
          </Card>))}
        </div>
      </>}
      {tab === 'plans' && <>
        <Sec title="รายการผ่อน" action="+ เพิ่ม" onAction={() => losOpen('plan')} />
        <Card pad={false}>{LOS_PLANS.length ? LOS_PLANS.map(p => { const m = p.total / p.months, done = p.paid >= p.months; return (
          <div key={p.id} className="row rowlink" role="button" onClick={() => losOpen('plan', { initial: p })} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ flex: 1, minWidth: 0 }}><span className="row-t">{p.name}</span><span className="row-s">{srcName(p.card)} · งวดละ {money(m)} · เหลือ {money(m * (p.months - p.paid))}</span></span>
              {done ? <Badge tone="green">ผ่อนครบ</Badge> : <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); losUpdate(() => { const x = LOS_PLANS.find(q => q.id === p.id); x.paid++; const c = LOS_CARDS.find(q => q.id === p.card); if (c) c.used += m; }, `ลงงวดที่ ${p.paid + 1} เข้าบัตรแล้ว`); }}>ลงงวดนี้</button>}
            </div>
            <Bar ratio={p.paid / p.months} />
            <span className="row-s num">{p.paid} / {p.months} งวด</span>
          </div>); }) : <Empty text="ยังไม่มีรายการผ่อน" action="เพิ่ม" onAction={() => losOpen('plan')} />}</Card>
        <p className="hint">“ลงงวดนี้” จะเพิ่มยอดงวดเข้าไปในยอดใช้ของบัตรที่ผ่อน</p>
      </>}
    </>
  );
}

function ForecastScreen() {
  const [days, setDays] = React.useState(30);
  const f = forecast(days);
  let run = f.start, low = f.start;
  const rows = f.items.map(it => { run += it.amount; low = Math.min(low, run); return { ...it, run }; });
  return (
    <>
      <div className="chips" style={{ marginBottom: 16 }}>{[7, 10, 30, 60, 90].map(d => <button key={d} className={'chip' + (days === d ? ' on' : '')} onClick={() => setDays(d)}>{d} วัน</button>)}</div>
      <div className="grid g3">
        <Stat tint="accent" label="เงินคงเหลือตอนนี้" value={money(f.start)} />
        <Stat tint="hero" label={`คาดว่าเหลือใน ${days} วัน`} value={money(f.end)} sub={`ออก ${money(f.out)} · เข้า ${money(f.inc)}`} />
        <Stat tint={low < 0 ? 'neg' : 'pos'} label="จุดต่ำสุดระหว่างทาง" value={money(low)} sub={low < 0 ? 'เงินไม่พอ ควรเตรียมเพิ่ม' : 'เงินพอตลอดช่วง'} />
      </div>
      <Sec title="ไทม์ไลน์กระแสเงินสด" />
      <Card pad={false}>
        {rows.length ? rows.map((it, i) => <Row key={i} icon={it.amount > 0 ? 'money' : 'card'} tone={it.amount > 0 ? 'pos' : null} title={it.name} sub={dShort(it.date)}
          right={<span style={{ color: it.amount > 0 ? 'var(--pos)' : 'var(--neg)' }}>{it.amount > 0 ? '+' : '−'}{money(Math.abs(it.amount))}</span>} rightSub={<span style={{ color: it.run < 0 ? 'var(--neg)' : undefined }}>คงเหลือ {money(it.run)}</span>} />) : <Empty text="ไม่มีรายการในช่วงนี้" />}
      </Card>
      <p className="hint">คำนวณจากบิล ยอดบัตรเครดิต สมาชิกที่ตัดจากบัญชี และรายรับประจำ (ตั้งค่าได้ในหน้าตั้งค่า)</p>
    </>
  );
}
Object.assign(window, { DashboardScreen, MoneyScreen, BillsScreen, ForecastScreen, ActRow, TxnRow, CheckRow });
