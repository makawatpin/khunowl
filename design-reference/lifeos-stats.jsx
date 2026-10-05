// lifeos-stats.jsx — summary & analytics: today tracker, calendar heatmap, categories, 6-month trend, top payees
const stMkAdd = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const stMkLabel = (mk) => { const [y, m] = mk.split('-').map(Number); return MONTHS_TH[m - 1] + ' ' + y; };
const stDaysIn = (mk) => { const [y, m] = mk.split('-').map(Number); return new Date(y, m, 0).getDate(); };
const stTx = (mk, type) => LOS_TXNS.filter(t => t.type === type && t.date.startsWith(mk));
const stSum = (xs) => xs.reduce((s, t) => s + (+t.amount || 0), 0);
const stGroup = (xs, key) => { const m = {}; xs.forEach(t => { const k = t[key] || 'อื่นๆ'; m[k] = (m[k] || 0) + (+t.amount || 0); }); return m; };

function StatsScreen() {
  const cur = TODAY_ISO.slice(0, 7);
  const [mk, setMk] = React.useState(cur);
  const [day, setDay] = React.useState(null);
  const [cat, setCat] = React.useState(null);
  const go = (n) => { setMk(stMkAdd(mk, n)); setDay(null); setCat(null); };
  const exp = stTx(mk, 'expense'), inc = stTx(mk, 'income'), pexp = stTx(stMkAdd(mk, -1), 'expense');
  const E = stSum(exp), I = stSum(inc), PE = stSum(pexp);
  const byDay = {}; exp.forEach(t => { const d = +t.date.slice(8, 10); byDay[d] = (byDay[d] || 0) + t.amount; });
  const maxDay = Math.max(1, ...Object.values(byDay));
  const isCur = mk === cur, dim = stDaysIn(mk), todayD = TODAY.getDate();
  const budget = Object.values(LOS_BUDGETS).reduce((s, v) => s + (+v || 0), 0);
  const todaySpend = isCur ? (byDay[todayD] || 0) : 0;
  const daysLeft = dim - todayD + 1;
  const perDay = isCur && budget ? Math.max(0, (budget - (E - todaySpend)) / daysLeft) : null;
  const avgDay = E / (isCur ? todayD : dim);
  const cats = Object.entries(stGroup(exp, 'cat')).sort((a, b) => b[1] - a[1]), pcats = stGroup(pexp, 'cat');
  const catMax = Math.max(1, ...cats.map(c => c[1]));
  const payees = Object.entries(exp.reduce((m, t) => { const k = t.name || '—'; m[k] = m[k] || { amt: 0, n: 0 }; m[k].amt += t.amount; m[k].n++; return m; }, {})).sort((a, b) => b[1].amt - a[1].amt).slice(0, 5);
  const trend = [-5, -4, -3, -2, -1, 0].map(n => { const k = stMkAdd(mk, n); return { k, e: stSum(stTx(k, 'expense')), i: stSum(stTx(k, 'income')) }; });
  const tMax = Math.max(1, ...trend.map(t => Math.max(t.e, t.i)));
  const [y, m] = mk.split('-').map(Number), offset = new Date(y, m - 1, 1).getDay();
  const delta = PE ? (E - PE) / PE : null;
  const list = [...LOS_TXNS].filter(t => t.date.startsWith(mk) && t.type !== 'transfer' && (!day || +t.date.slice(8, 10) === day) && (!cat || (t.type === 'expense' && t.cat === cat))).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const heat = (v) => { const r = v / maxDay; return { background: `rgba(242,101,138,${0.14 + 0.8 * r})`, color: r > 0.5 ? '#fff' : 'var(--ink)' }; };
  return <>
    <div className="st-month">
      <button className="btn icon-btn" onClick={() => go(-1)} aria-label="เดือนก่อน"><LIcon name="back" size={16} /></button>
      <b>{stMkLabel(mk)}</b>
      <button className="btn icon-btn" onClick={() => go(1)} disabled={mk >= cur} aria-label="เดือนถัดไป"><LIcon name="arrow" size={16} /></button>
      {!isCur && <button className="btn btn-sm" onClick={() => { setMk(cur); setDay(null); setCat(null); }}>เดือนนี้</button>}
    </div>
    {isCur
      ? <HeroStat label="วันนี้ใช้ไป" value={money(todaySpend)}
          sub={perDay == null ? 'ตั้งงบรายหมวดในหน้าตั้งค่าเพื่อดูงบที่ใช้ได้ต่อวัน' : todaySpend <= perDay ? `วันนี้ยังใช้ได้อีก ${money(perDay - todaySpend)}` : `วันนี้เกินงบรายวันไป ${money(todaySpend - perDay)}`}
          cols={[['ใช้ได้วันละ', perDay == null ? '—' : money(perDay)], ['งบเหลือเดือนนี้', budget ? money(budget - E) : '—'], ['เหลืออีก', daysLeft + ' วัน']]} />
      : <HeroStat label={'ใช้จ่ายทั้งเดือน ' + stMkLabel(mk)} value={money(E)} sub={`เฉลี่ยวันละ ${money(avgDay)}`} cols={[['รายรับ', money(I)], ['คงเหลือสุทธิ', money(I - E)], ['งบรวม', budget ? money(budget) : '—']]} />}
    <div className="grid g3" style={{ marginTop: 16 }}>
      <Stat tint="pos" label="รายรับ" value={money(I)} sub={inc.length + ' รายการ'} />
      <Stat tint="accent" label="รายจ่าย" value={money(E)} sub={delta == null ? exp.length + ' รายการ' : `${delta > 0 ? 'มากกว่า' : 'น้อยกว่า'}เดือนก่อน ${Math.abs(Math.round(delta * 100))}%`} />
      <Stat label="คงเหลือสุทธิ" value={money(I - E)} tone={I - E < 0 ? 'neg' : 'pos'} sub={`เฉลี่ยใช้วันละ ${money(avgDay)}`} />
    </div>
    <div className="dash" style={{ marginTop: 6 }}>
      <div style={{ minWidth: 0 }}>
        <Sec title="ปฏิทินการใช้จ่าย" action={day ? 'ดูทั้งเดือน' : null} onAction={() => setDay(null)} />
        <Card>
          <div className="heat">
            {D_TH.map(d => <div key={d} className="heat-h">{d}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={'p' + i}></div>)}
            {Array.from({ length: dim }).map((_, i) => { const d = i + 1, v = byDay[d] || 0, fut = isCur && d > todayD; return (
              <button key={d} className={'heat-d' + (day === d ? ' on' : '') + (isCur && d === todayD ? ' today' : '')} disabled={fut} style={{ '--i': i, ...(v ? heat(v) : fut ? { opacity: .35 } : {}) }} onClick={() => { setDay(day === d ? null : d); setCat(null); }}>
                <span>{d}</span>{v > 0 && <small className="num">{v >= 1000 ? (Math.round(v / 100) / 10) + 'k' : Math.round(v)}</small>}
              </button>); })}
          </div>
          <div className="hint">สียิ่งเข้มยิ่งใช้เยอะ · วันที่ใช้มากสุด {Object.keys(byDay).length ? `${Object.entries(byDay).sort((a, b) => b[1] - a[1])[0][0]} ${M_TH[m - 1]} (${money(maxDay)})` : '—'}</div>
        </Card>
        <Sec title={day ? `รายการวันที่ ${day} ${M_TH[m - 1]}` : cat ? `หมวด ${cat}` : 'รายการเดือนนี้'} action={day || cat ? 'ล้างตัวกรอง' : null} onAction={() => { setDay(null); setCat(null); }} />
        <Card pad={false}>{list.length ? list.slice(0, day || cat ? 200 : 30).map(t => <TxnRow key={t.id} t={t} />) : <Empty text="ไม่มีรายการ" />}</Card>
      </div>
      <div style={{ minWidth: 0 }}>
        <Sec title="ตามหมวด" />
        <Card>{cats.length ? cats.map(([c, v], i) => { const p = pcats[c] || 0, dd = p ? (v - p) / p : null; return (
          <button key={c} className="svc-cat" style={{ marginTop: i ? 14 : 0, opacity: cat && cat !== c ? .45 : 1 }} onClick={() => { setCat(cat === c ? null : c); setDay(null); }}>
            <span style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 6, alignItems: 'center' }}>
              <span style={{ flex: 1, fontWeight: cat === c ? 600 : 400 }}>{c}</span>
              <span className="row-s">{Math.round(v / E * 100)}%</span>
              {dd != null && Math.abs(dd) >= 0.05 && <Badge tone={dd > 0 ? 'red' : 'green'}>{dd > 0 ? '▲' : '▼'} {Math.abs(Math.round(dd * 100))}%</Badge>}
              <b className="num">{money(v)}</b>
            </span>
            <Bar ratio={v / catMax} color={LOS_BUDGETS[c] && v > LOS_BUDGETS[c] ? 'var(--neg)' : 'var(--accent)'} />
          </button>); }) : <Empty text="ยังไม่มีรายจ่ายเดือนนี้" />}
          {cats.length > 0 && <div className="hint">▲▼ เทียบกับเดือนก่อน · แตะหมวดเพื่อดูรายการ</div>}
        </Card>
        <Sec title="6 เดือนล่าสุด" />
        <Card>
          <div className="trend">{trend.map((t, ti) => <div key={t.k} style={{ '--i': ti }} className={'trend-col' + (t.k === mk ? ' on' : '')} onClick={() => { setMk(t.k); setDay(null); setCat(null); }}>
            <div className="trend-bars"><i style={{ height: (t.i / tMax * 100) + '%', background: 'var(--pos)' }} title={'รายรับ ' + money(t.i)}></i><i style={{ height: (t.e / tMax * 100) + '%', background: 'var(--accent)' }} title={'รายจ่าย ' + money(t.e)}></i></div>
            <span>{M_TH[+t.k.slice(5) - 1]}</span>
          </div>)}</div>
          <div className="trend-key"><span><i style={{ background: 'var(--pos)' }}></i>รายรับ</span><span><i style={{ background: 'var(--accent)' }}></i>รายจ่าย</span></div>
        </Card>
        <Sec title="จ่ายให้ใครมากที่สุด" />
        <Card pad={false}>{payees.length ? payees.map(([n, v]) => <Row key={n} icon="money" title={n} sub={v.n + ' ครั้ง'} right={money(v.amt)} />) : <Empty text="—" />}</Card>
      </div>
    </div>
  </>;
}
Object.assign(window, { StatsScreen });
