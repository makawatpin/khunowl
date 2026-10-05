// lifeos-settings.jsx — Settings (display, security, notifications, budgets, income, data) + PIN lock
function Toggle({ on, onChange, label, sub }) {
  return <div className="row" style={{ cursor: 'pointer' }} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
    <span style={{ flex: 1, minWidth: 0 }}><span className="row-t">{label}</span>{sub && <span className="row-s">{sub}</span>}</span>
    <span className={'switch' + (on ? ' on' : '')}><i></i></span>
  </div>;
}
function PinSetup({ onClose }) {
  const [a, setA] = React.useState(''), [b, setB] = React.useState('');
  const ok = /^\d{4}$/.test(a) && a === b;
  return <FormModal title="ตั้งรหัส PIN" onClose={onClose} valid={ok} onSave={() => { setPref('pin', pinHash(a)); sessionStorage.setItem('los:unlocked', '1'); losToast('ตั้ง PIN แล้ว'); }}>
    <Field label="PIN 4 หลัก"><input type="password" inputMode="numeric" maxLength={4} value={a} onChange={e => setA(e.target.value.replace(/\D/g, ''))} autoFocus /></Field>
    <Field label="ยืนยัน PIN"><input type="password" inputMode="numeric" maxLength={4} value={b} onChange={e => setB(e.target.value.replace(/\D/g, ''))} /></Field>
    {b.length === 4 && a !== b && <p className="hint" style={{ color: 'var(--neg)' }}>PIN ไม่ตรงกัน</p>}
    <p className="hint">ถ้าลืม PIN ต้องล้างข้อมูลแอปในเบราว์เซอร์ จึงควรสำรองข้อมูลไว้ก่อน</p>
  </FormModal>;
}
function BudgetForm({ onClose }) {
  const [f, setF] = React.useState(() => Object.fromEntries(EXP_CATS.map(c => [c, LOS_BUDGETS[c] || ''])));
  return <FormModal title="งบประมาณรายเดือน" onClose={onClose} onSave={() => losUpdate(() => { Object.keys(LOS_BUDGETS).forEach(k => delete LOS_BUDGETS[k]); EXP_CATS.forEach(c => { if (numv(f[c]) > 0) LOS_BUDGETS[c] = numv(f[c]); }); }, 'บันทึกงบแล้ว')}>
    <G2>{EXP_CATS.map(c => <Field key={c} label={c}><input value={f[c]} onChange={e => setF({ ...f, [c]: e.target.value })} inputMode="decimal" placeholder="ไม่ตั้งงบ" /></Field>)}</G2>
  </FormModal>;
}
function SettingsScreen() {
  const fileRef = React.useRef(null);
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const enableNotify = async (v) => {
    if (!v) return setPref('notify', false);
    if (perm === 'unsupported') return losToast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
    const p = perm === 'granted' ? 'granted' : await Notification.requestPermission();
    if (p === 'granted') { setPref('notify', true); setPref('lastNotify', ''); losDailyNotify(); losToast('เปิดแจ้งเตือนแล้ว'); } else losToast('ไม่ได้รับอนุญาตให้แจ้งเตือน');
  };
  const backupAge = LOS_PREFS.lastBackup ? -daysTo(LOS_PREFS.lastBackup) : null;
  return (
    <div className="settings">
      <Sec title="การแสดงผล" />
      <Card pad={false}>
        <Toggle on={LOS_PREFS.hide} onChange={(v) => setPref('hide', v)} label="ซ่อนยอดเงิน" sub="แสดงเป็น ฿ ••• ทั้งแอป (กดไอคอนรูปตาด้านบนได้เช่นกัน)" />
        <Toggle on={LOS_PREFS.theme === 'dark'} onChange={(v) => setPref('theme', v ? 'dark' : 'light')} label="โหมดมืด" />
        <Toggle on={LOS_PREFS.motion !== 'off'} onChange={(v) => setPref('motion', v ? 'on' : 'off')} label="แอนิเมชัน" sub="ตัวเลขนับขึ้น การ์ดลอย และการเปลี่ยนหน้าแบบลื่นไหล" />
      </Card>
      <Sec title="ความปลอดภัย" />
      <Card pad={false}>
        <Toggle on={!!LOS_PREFS.pin} onChange={(v) => v ? losOpen('PinSetup') : (setPref('pin', ''), losToast('ปิด PIN แล้ว'))} label="ล็อกด้วย PIN" sub={LOS_PREFS.pin ? 'ถามรหัสทุกครั้งที่เปิดแอป' : 'ปิดอยู่'} />
        {LOS_PREFS.pin && <Row icon="lock" title="เปลี่ยน PIN" onClick={() => losOpen('PinSetup')} right={<LIcon name="arrow" size={15} color="var(--ink-faint)" />} />}
      </Card>
      <Sec title="การแจ้งเตือน" />
      <Card pad={false}>
        <Toggle on={LOS_PREFS.notify && perm === 'granted'} onChange={enableNotify} label="แจ้งเตือนบนเบราว์เซอร์" sub={perm === 'denied' ? 'ถูกบล็อกไว้ — เปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์' : 'สรุปรายการที่ถึงกำหนดวันนี้/พรุ่งนี้ วันละครั้งเมื่อเปิดแอป'} />
      </Card>
      <Sec title="เงิน" />
      <Card pad={false}>
        <Row icon="chart" title="งบประมาณรายเดือน" sub={Object.keys(LOS_BUDGETS).length + ' หมวด · รวม ' + money(Object.values(LOS_BUDGETS).reduce((s, x) => s + x, 0))} onClick={() => losOpen('BudgetForm')} right={<LIcon name="arrow" size={15} color="var(--ink-faint)" />} />
        {LOS_INCOME.map(i => <Row key={i.id} icon="money" title={i.name} sub={`${money(i.amount)} · ทุกวันที่ ${i.day} · ${srcName(i.account)}`} onClick={() => losOpen('income', { initial: i })} right={<LIcon name="arrow" size={15} color="var(--ink-faint)" />} />)}
        <Row icon="plus" title="เพิ่มรายรับประจำ" onClick={() => losOpen('income')} />
      </Card>
      <Sec title="คลาวด์" />
      <Card pad={false}><SyncSettings /></Card>
      <Sec title="ข้อมูล" />
      <Card pad={false}>
        <div className="row"><span className="ic"><LIcon name="check" size={17} color="var(--pos)" /></span><span style={{ flex: 1 }}><span className="row-t">บันทึกอัตโนมัติในเครื่องนี้</span><span className="row-s">ข้อมูลอยู่ในเบราว์เซอร์นี้เท่านั้น{backupAge == null ? ' · ยังไม่เคยสำรอง' : ` · สำรองล่าสุด ${backupAge === 0 ? 'วันนี้' : backupAge + ' วันก่อน'}`}</span></span></div>
        <Row icon="download" title="สำรองข้อมูลเป็นไฟล์" sub="ดาวน์โหลดไฟล์ .json เก็บไว้ในเครื่องหรือคลาวด์" onClick={losExport} />
        <Row icon="upload" title="กู้คืนจากไฟล์สำรอง" sub="แทนที่ข้อมูลปัจจุบันทั้งหมด" onClick={() => fileRef.current && fileRef.current.click()} />
        <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f && confirm('กู้คืนจะแทนที่ข้อมูลปัจจุบันทั้งหมด ต่อไหม?')) losImport(f); e.target.value = ''; }} />
        <Row icon="clock" title="รีเซ็ตเป็นข้อมูลตัวอย่าง" onClick={() => confirm('แทนที่ข้อมูลทั้งหมดด้วยข้อมูลตัวอย่าง?') && losReset(false)} />
        <Row icon="trash" tone="neg" title="ล้างข้อมูลทั้งหมด" sub="เริ่มใช้งานจริงแบบว่างเปล่า" onClick={() => confirm('ล้างข้อมูลทั้งหมด? (กดเลิกทำได้ทันทีหลังล้าง)') && losReset(true)} />
      </Card>
      {backupAge == null || backupAge > 30 ? <p className="hint">แนะนำให้สำรองข้อมูลอย่างน้อยเดือนละครั้ง ถ้าล้างเบราว์เซอร์ ข้อมูลจะหายทั้งหมด</p> : null}
    </div>
  );
}
function LockScreen({ onUnlock }) {
  const [pin, setPin] = React.useState(''), [err, setErr] = React.useState(false);
  const press = (d) => { if (pin.length >= 4) return; const p = pin + d; setPin(p); setErr(false);
    if (p.length === 4) setTimeout(() => { if (pinHash(p) === LOS_PREFS.pin) { sessionStorage.setItem('los:unlocked', '1'); onUnlock(); } else { setErr(true); setPin(''); } }, 120); };
  React.useEffect(() => { const h = (e) => { if (/^\d$/.test(e.key)) press(e.key); if (e.key === 'Backspace') setPin(p => p.slice(0, -1)); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); });
  return <div className="lock">
    <div className="side-brand" style={{ color: 'var(--ink)', justifyContent: 'center', flexDirection: 'column', gap: 12, fontSize: 22 }}><img className="brand-icon" src="assets/khunowl-icon.png" alt="" style={{ width: 72, height: 72, borderRadius: 18 }} />KhunOwl</div>
    <div style={{ color: err ? 'var(--neg)' : 'var(--ink-soft)', fontSize: 14 }}>{err ? 'PIN ไม่ถูกต้อง ลองใหม่' : 'ใส่ PIN เพื่อเข้าใช้งาน'}</div>
    <div className={'pin-dots' + (err ? ' shake' : '')}>{[0, 1, 2, 3].map(i => <i key={i} className={i < pin.length ? 'on' : ''}></i>)}</div>
    <div className="pin-pad">{['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => k ? <button key={i} onClick={() => k === '⌫' ? setPin(p => p.slice(0, -1)) : press(k)}>{k}</button> : <span key={i}></span>)}</div>
  </div>;
}
Object.assign(window, { SettingsScreen, LockScreen, PinSetup, BudgetForm, Toggle });
