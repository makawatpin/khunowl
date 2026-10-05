// lifeos-ui.jsx — shared primitives for Life OS
const LIcon = ({ name, size = 18, color = 'currentColor' }) => {
  const p = {
    home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
    money: 'M3 6h18v12H3zM3 10h18M7 14h4',
    card: 'M2 6h20v12H2zM2 10h20M6 15h5',
    calendar: 'M4 5h16v16H4zM4 9h16M9 3v4M15 3v4',
    bell: 'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0',
    box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v9',
    car: 'M3 15h18M5 15l2-6h10l2 6v4H5zM7 19v2M17 19v2',
    house: 'M4 11 12 4l8 7v10H4zM10 21v-6h4v6',
    doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14M16.5 16.5 21 21',
    plus: 'M12 5v14M5 12h14',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    chevup: 'M6 15l6-6 6 6',
    chevdown: 'M6 9l6 6 6-6',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    check: 'M4 12.5 9 18 20 6',
    x: 'M6 6l12 12M18 6 6 18',
    arrow: 'M9 5l7 7-7 7',
    back: 'M15 19l-7-7 7-7',
    fuel: 'M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M4 11h9M16 8l3 2v9a2 2 0 0 1-4 0v-6h4',
    wrench: 'M15 3a5 5 0 0 0-4 8L4 18l2 2 7-7a5 5 0 0 0 6-6l-3 3-3-3z',
    shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 2',
    minus: 'M5 12h14',
    swap: 'M4 8h15l-4-4M20 16H5l4 4',
    food: 'M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 21V3c-2 1-3 4-3 7h3',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    eyeoff: 'M3 3l18 18M10.6 5.1C11 5 11.5 5 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7c2 0 3.8-.6 5.4-1.6',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1',
    download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
    upload: 'M12 16V5M7 10l5-5 5 5M4 20h16',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    trip: 'M4 8h16v12H4zM9 8V5h6v3M4 13h16',
    users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .5 3 2.5 3 5',
    hammer: 'M13 4l7 7-3 3-7-7zM10 7l-7 7 3 3 7-7',
    phone: 'M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2',
    pie: 'M12 3v9h9M12 3a9 9 0 1 0 9 9',
    slip: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  }[name] || '';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{p.split('M').filter(Boolean).map((d, i) => <path key={i} d={'M' + d} />)}</svg>;
};
function CountUp({ value }) {
  const ok = typeof value === 'string' || typeof value === 'number';
  const str = ok ? String(value) : '';
  const m = ok && !window.__losHide ? str.match(/-?\d[\d,]*(\.\d+)?/) : null;
  const target = m ? parseFloat(m[0].replace(/,/g, '')) : null;
  const [v, setV] = React.useState(target);
  const prev = React.useRef(0);
  React.useEffect(() => {
    if (target == null || LOS_PREFS.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); prev.current = target || 0; return; }
    const from = prev.current, t0 = performance.now(), dur = 950; let raf;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4); setV(from + (target - from) * e); if (k < 1) raf = requestAnimationFrame(step); else prev.current = target; };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); prev.current = target; };
  }, [target]);
  if (!m || v == null) return value;
  const dec = m[1] ? m[1].length - 1 : 0;
  const txt = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return str.slice(0, m.index) + (m[0][0] === '-' ? '-' : '') + txt + str.slice(m.index + m[0].length);
}
const Card = ({ children, pad = true, flat, style }) => <div className={'card' + (pad ? ' card-pad' : ' list') + (flat ? ' card-flat' : '')} style={style}>{children}</div>;
function HeroStat({ label, value, sub, cols }) {
  return (<div className="hero">
    <div className="cap">{label}</div>
    <div className="num" style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.1, margin: '6px 0 2px' }}><CountUp value={value} /></div>
    {sub && <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.85)' }}>{sub}</div>}
    {cols && <div style={{ display: 'flex', gap: 18, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.28)' }}>
      {cols.map(([k, v], i) => <div key={k} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{k}</div>
        <div className="num" style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>{v}</div>
      </div>)}
    </div>}
  </div>);
}
function ChipStat({ value, label, sub, ratio, tint = 'accent' }) {
  const bg = { accent: 'var(--accent-soft)', pos: 'var(--pos-soft)', warn: 'var(--warn-soft)', neg: 'var(--neg-soft)' }[tint];
  const fg = { accent: 'var(--accent-deep)', pos: 'var(--pos)', warn: '#B8762A', neg: 'var(--neg)' }[tint];
  return (<div className="chipstat">
    <div className="pill" style={{ background: bg, color: fg }}><b className="num">{value}</b></div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginBottom: 6 }}>{sub}</div>}
      {ratio != null && <Bar ratio={ratio} />}
    </div>
  </div>);
}
const Sec = ({ title, action, onAction }) => <div className="sec"><h2>{title}</h2>{action && <button className="more" onClick={onAction}>{action}</button>}</div>;
const Cap = ({ children }) => <div className="cap">{children}</div>;
const Badge = ({ tone = '', children }) => <span className={'badge ' + tone}>{children}</span>;
function Stat({ label, value, sub, tone, tint }) {
  if (tint === 'hero') return <HeroStat label={label} value={value} sub={sub} />;
  const bg = { accent: 'var(--accent-soft)', pos: 'var(--pos-soft)', warn: 'var(--warn-soft)', neg: 'var(--neg-soft)' }[tint];
  const fg = { accent: 'var(--accent-deep)', pos: 'var(--pos)', warn: '#B8762A', neg: 'var(--neg)' }[tint];
  return (<Card style={bg ? { background: bg, boxShadow: 'none' } : null}><Cap>{label}</Cap><div className="num" style={{ fontSize: 26, fontWeight: 600, marginTop: 6, color: fg || (tone === 'neg' ? 'var(--neg)' : tone === 'pos' ? 'var(--pos)' : 'var(--ink)') }}><CountUp value={value} /></div>{sub && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{sub}</div>}</Card>);
}
function HeroHeader({ icon, title, sub, statLabel, statValue, chips }) {
  return (<div className="hero">
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <span style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><LIcon name={icon} size={20} color="#fff" /></span>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>{sub}</div>
      </div>
      {statValue && <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}><div className="cap">{statLabel}</div><div className="num" style={{ fontSize: 22, fontWeight: 600 }}><CountUp value={statValue} /></div></div>}
    </div>
    {chips && <div style={{ display: 'flex', gap: 18, marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.28)', flexWrap: 'wrap' }}>
      {chips.map(([k, v]) => <div key={k} style={{ whiteSpace: 'nowrap' }}><div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{k}</div><div className="num" style={{ fontSize: 17, fontWeight: 600 }}>{v}</div></div>)}
    </div>}
  </div>);
}
const CAT_HUE = { 'อาหาร': 55, 'เดินทาง': 235, 'ช้อปปิ้ง': 340, 'บ้าน': 150, 'บิล/ค่าน้ำไฟ': 90, 'บันเทิง': 295, 'สุขภาพ': 185, 'รถ': 262 };
const catColor = (cat) => { const h = CAT_HUE[cat]; return h == null ? null : { bg: `oklch(0.95 0.035 ${h})`, fg: `oklch(0.5 0.13 ${h})`, bar: `oklch(0.7 0.13 ${h})` }; };
function Bar({ ratio, color }) {
  return <div className="bar"><i style={{ width: Math.min(100, ratio * 100) + '%', background: color || (ratio > 1 ? 'var(--neg)' : ratio > 0.85 ? 'var(--warn)' : 'var(--accent)') }} /></div>;
}
const BANK_MARKS = {
  kbank: { domain: 'kasikornbank.com', short: 'K', bg: '#00A94F', fg: '#fff', grad: ['#0E8A4A', '#3FBF7F'] },
  scb: { domain: 'scb.co.th', short: 'SCB', bg: '#4E2A84', fg: '#fff', grad: ['#4A2780', '#8A5CC4'] },
  ktb: { domain: 'krungthai.com', short: 'KTB', bg: '#00A0E9', fg: '#fff', grad: ['#0080C0', '#43B8EE'] },
  bbl: { domain: 'bangkokbank.com', short: 'BBL', bg: '#1E4598', fg: '#fff', grad: ['#1B3A86', '#5173C4'] },
  ttb: { domain: 'ttbbank.com', short: 'ttb', bg: '#0B54A4', fg: '#fff', grad: ['#0A4A92', '#3E82CF'] },
  bay: { domain: 'krungsri.com', short: 'BAY', bg: '#FFD400', fg: '#4B3B00', grad: ['#E0A800', '#FFD84D'], dark: true },
  gsb: { domain: 'gsb.or.th', short: 'GSB', bg: '#EB198D', fg: '#fff', grad: ['#C8117A', '#F25CAE'] },
  ktc: { domain: 'ktc.co.th', short: 'KTC', bg: '#0B3D91', fg: '#fff', grad: ['#1E3A8A', '#5B7CC9'] },
  truemoney: { domain: 'truemoney.com', short: 'TMN', bg: '#F04B24', fg: '#fff', grad: ['#EF5A1F', '#F9A25A'] },
  uob: { domain: 'uob.co.th', short: 'UOB', bg: '#0B3B8C', fg: '#fff', grad: ['#0A2F72', '#2F62B8'] },
  cimb: { domain: 'cimbthai.com', short: 'CIMB', bg: '#D7182A', fg: '#fff', grad: ['#B0121F', '#E8505C'] },
  lhb: { domain: 'lhbank.co.th', short: 'LHB', bg: '#5C6F7E', fg: '#fff', grad: ['#4A5B68', '#8597A5'] },
  kkp: { domain: 'kkpfg.com', short: 'KKP', bg: '#4F3F94', fg: '#fff', grad: ['#3F3279', '#7A68C2'] },
  tisco: { domain: 'tisco.co.th', short: 'TISCO', bg: '#1C4C9C', fg: '#fff', grad: ['#163E80', '#4A78C4'] },
  baac: { domain: 'baac.or.th', short: 'ธกส', bg: '#00843D', fg: '#fff', grad: ['#006B31', '#2FAF68'] },
  ghb: { domain: 'ghbank.co.th', short: 'ธอส', bg: '#F37021', fg: '#fff', grad: ['#D85A10', '#F7974F'] },
  ibank: { domain: 'ibank.co.th', short: 'iBank', bg: '#0A6E3A', fg: '#fff', grad: ['#085A2F', '#2E9A60'] },
  icbc: { domain: 'icbcthai.com', short: 'ICBC', bg: '#C8102E', fg: '#fff', grad: ['#A50D25', '#E2475E'] },
  linebk: { domain: 'linebk.com', short: 'BK', bg: '#06C755', fg: '#fff', grad: ['#05A647', '#3ADB7E'] },
  dime: { domain: 'dime.co.th', short: 'Dime', bg: '#1E1E24', fg: '#fff', grad: ['#15151A', '#45454F'] },
  shopeepay: { domain: 'shopee.co.th', short: 'SPay', bg: '#EE4D2D', fg: '#fff', grad: ['#D63B1C', '#F57A5E'] },
  make: { short: 'MAKE', bg: '#1FA6D9', fg: '#fff', grad: ['#1584B0', '#4CC4EC'] },
  kept: { short: 'Kept', bg: '#E8202A', fg: '#fff', grad: ['#C8141D', '#F0565D'] },
  paotang: { short: 'เป๋า', bg: '#1E9BE8', fg: '#fff', grad: ['#127EC4', '#4DB6F2'] },
  clicx: { short: 'CX', bg: '#1A6FE0', fg: '#fff', grad: ['#1558B5', '#2FC6C9'] },
  cardx: { domain: 'cardx.co.th', short: 'CardX', bg: '#4E2A84', fg: '#fff', grad: ['#3B1F66', '#7B4FC0'] },
  krungsricard: { domain: 'krungsricard.com', short: 'KCC', bg: '#6B5B4B', fg: '#fff', grad: ['#4F4236', '#C9A227'] },
  firstchoice: { domain: 'krungsrifirstchoice.com', short: '1st', bg: '#E30613', fg: '#fff', grad: ['#B8050F', '#F2525B'] },
  aeon: { domain: 'aeon.co.th', short: 'AEON', bg: '#B5197F', fg: '#fff', grad: ['#921465', '#D9529F'] },
  amex: { domain: 'americanexpress.com', short: 'AMEX', bg: '#016FD0', fg: '#fff', grad: ['#0158A6', '#3C97E6'] },
  umay: { domain: 'umay.co.th', short: 'UMAY', bg: '#F28C00', fg: '#fff', grad: ['#D07500', '#F7B04A'] },
  citi: { domain: 'citibank.co.th', short: 'citi', bg: '#056DAE', fg: '#fff', grad: ['#04568A', '#3A95D0'] },
  cash: { short: '฿', bg: '#2F3542', fg: '#fff', grad: ['#1F2530', '#4A5364'] },
};
const BANK_IMG = ['kbank', 'scb', 'bbl', 'ttb', 'bay', 'gsb', 'truemoney', 'uob', 'cimb', 'lhb', 'kkp', 'tisco', 'baac', 'ghb', 'dime', 'make', 'kept', 'paotang', 'clicx'];
BANK_IMG.forEach(k => { if (BANK_MARKS[k]) BANK_MARKS[k].img = 'assets/banks/' + k + '.png'; });
const logoUrl = (domain, sz = 128) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${sz}`;
function BrandLogo({ domain, size = 38, fallback }) {
  const [bad, setBad] = React.useState(false);
  React.useEffect(() => setBad(false), [domain]);
  if (!domain || bad) return fallback || <span className="ic" style={{ width: size, height: size }}><LIcon name="card" size={size * 0.45} color="var(--ink-soft)" /></span>;
  return <span className="brand-logo" style={{ width: size, height: size }}><img src={logoUrl(domain)} alt="" onError={() => setBad(true)} onLoad={(e) => { if (e.currentTarget.naturalWidth <= 16) setBad(true); }} /></span>;
}
function BankMark({ bank, size = 38, plain }) {
  const m = BANK_MARKS[bank] || { short: (bank || '?').slice(0, 2).toUpperCase(), bg: 'var(--panel-2)', fg: 'var(--ink-soft)' };
  const len = m.short.length;
  const mono = <span className="ic" style={{ width: size, height: size, background: m.bg, color: m.fg, fontWeight: 700, fontSize: len > 2 ? size * 0.3 : len > 1 ? size * 0.36 : size * 0.46, lineHeight: 1, letterSpacing: len > 2 ? '-.02em' : 0, textAlign: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>{m.short}</span>;
  if (m.img) return <span className="bank-icon" style={{ width: size, height: size }}><img src={m.img} alt="" /></span>;
  return m.domain && !plain ? <BrandLogo domain={m.domain} size={size} fallback={mono} /> : mono;
}
function WalletCard({ bank, title, sub, network, last4, label, amount, meta, foot, onClick }) {
  const m = BANK_MARKS[bank] || BANK_MARKS.cash;
  const g = m.grad || [m.bg, m.bg];
  const ink = m.dark ? '#2A2100' : '#fff';
  return (
    <button className="wcard" onClick={onClick} style={{ background: `linear-gradient(135deg, ${g[0]} 0%, ${g[1]} 100%)`, color: ink }}>
      <span className="wcard-o1"></span><span className="wcard-o2"></span>
      <span className="wcard-top">
        <span style={{ minWidth: 0 }}><span className="wcard-t">{title}</span><span className="wcard-s">{sub}</span></span>
        {network ? <span className="wcard-net">{network}</span> : (m.img || m.domain) ? <BankMark bank={bank} size={30} /> : <span className="wcard-mark" style={{ color: ink }}>{m.short}</span>}
      </span>
      <span className="wcard-no num">{last4 ? <>•••• •••• •••• <b>{last4}</b></> : ' '}</span>
      <span className="wcard-bot">
        <span><span className="wcard-l">{label}</span><span className="wcard-a num"><CountUp value={amount} /></span></span>
        {meta && <span className="wcard-m">{meta}</span>}
      </span>
      {foot && <span className="wcard-foot">{foot}</span>}
    </button>
  );
}
function AddCardTile({ label = 'เพิ่มบัตร', onClick }) {
  return <button className="wcard-add" onClick={onClick}><span className="wcard-plus"><LIcon name="plus" size={20} /></span>{label}</button>;
}
function Row({ icon, bank, logo, title, sub, right, rightSub, onClick, tone, cat }) {
  const cc = cat && catColor(cat);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={'row' + (onClick ? ' rowlink' : '')} onClick={onClick}>
      {logo ? <BrandLogo domain={logo} fallback={icon ? <span className="ic"><LIcon name={icon} size={17} /></span> : null} /> : bank ? <BankMark bank={bank} /> : icon && <span className="ic" style={cc ? { background: cc.bg } : tone ? { background: `var(--${tone}-soft)`, borderColor: 'transparent' } : null}><LIcon name={icon} size={17} color={cc ? cc.fg : tone ? `var(--${tone})` : 'var(--ink-soft)'} /></span>}
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{title}</span>
        {sub && <span className="row-s">{sub}</span>}
      </span>
      {(right || rightSub) && <span style={{ textAlign: 'right', flexShrink: 0 }}>
        <span className="num" style={{ display: 'block', fontSize: 14.5, fontWeight: 500 }}>{right}</span>
        {rightSub && <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-soft)' }}>{rightSub}</span>}
      </span>}
    </Tag>
  );
}
function Modal({ title, onClose, children, foot }) {
  React.useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  const [dy, setDy] = React.useState(0);
  const start = React.useRef(null);
  const onStart = (e) => { if (e.currentTarget.scrollTop <= 0) start.current = e.touches[0].clientY; };
  const onMove = (e) => { if (start.current == null) return; const d = e.touches[0].clientY - start.current; if (d > 0) setDy(d); };
  const onEnd = () => { if (dy > 90) onClose(); else setDy(0); start.current = null; };
  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}>
        <div className="modal-head"><h3 style={{ flex: 1 }}>{title}</h3><button className="btn" onClick={onClose} style={{ padding: '6px 9px' }}><LIcon name="x" size={16} /></button></div>
        <div className="modal-body">{children}</div>
        {foot && <div style={{ padding: '0 18px 18px', display: 'flex', gap: 8 }}>{foot}</div>}
      </div>
    </div>
  );
}
const Field = ({ label, children }) => <div className="field"><label>{label}</label>{children}</div>;
function Tabs({ tabs, value, onChange }) {
  return <div className="tabs">{tabs.map(t => <button key={t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>;
}
function Detail({ rows }) {
  return <dl className="dl">{rows.filter(Boolean).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>;
}
function Empty({ text, action, onAction }) { return <div style={{ padding: '26px 16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}><span>{text}</span>{action && <button className="btn btn-sm" onClick={onAction}>+ {action}</button>}</div>; }
function CardRail({ children }) {
  const ref = React.useRef(null);
  const [i, setI] = React.useState(0);
  const n = React.Children.toArray(children).filter(Boolean).length;
  const onScroll = () => { const el = ref.current; if (!el || !el.firstChild) return; const w = el.firstChild.getBoundingClientRect().width + 10; setI(Math.min(n - 1, Math.round(el.scrollLeft / w))); };
  return <div><div className="wcards" ref={ref} onScroll={onScroll}>{children}</div>{n > 1 && <div className="rail-dots">{Array.from({ length: n }).map((_, k) => <i key={k} className={k === i ? 'on' : ''}></i>)}</div>}</div>;
}
Object.assign(window, { CAT_HUE, catColor, CountUp, LIcon, Card, HeroStat, ChipStat, HeroHeader, Sec, Cap, Badge, Stat, Bar, Row, BankMark, BrandLogo, logoUrl, BANK_MARKS, WalletCard, AddCardTile, Modal, Field, Tabs, Detail, Empty, CardRail });
