// supabase-sync.jsx — cloud sync (one JSON row per user, last-write-wins) + SyncForm
const SYNC = { sb: null, user: null, status: 'off', at: null, err: '' };
const SYNC_MOD = 'los:modAt';
const syncSet = (p) => { Object.assign(SYNC, p); losEmit(); };
const syncConfigured = () => !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase);
let syncTimer = null;
async function syncPush() {
  if (!SYNC.user) return;
  syncSet({ status: 'busy' });
  const ts = new Date().toISOString();
  const { error } = await SYNC.sb.from('life_data').upsert({ user_id: SYNC.user.id, data: losSnapshot(), updated_at: ts });
  if (error) return syncSet({ status: 'error', err: error.message });
  localStorage.setItem(SYNC_MOD, ts); syncSet({ status: 'ok', at: new Date(), err: '' });
}
async function syncPull(force) {
  if (!SYNC.user) return;
  syncSet({ status: 'busy' });
  const { data, error } = await SYNC.sb.from('life_data').select('data,updated_at').eq('user_id', SYNC.user.id).maybeSingle();
  if (error) return syncSet({ status: 'error', err: error.message });
  const local = localStorage.getItem(SYNC_MOD) || '';
  if (data && (force || data.updated_at > local)) {
    losApply(data.data); window.__origPersist(); localStorage.setItem(SYNC_MOD, data.updated_at);
    losEmit(); syncSet({ status: 'ok', at: new Date(), err: '' }); losToast('โหลดข้อมูลจากคลาวด์แล้ว');
  } else await syncPush();
}
window.__origPersist = window.losPersist;
window.losPersist = function () {
  window.__origPersist();
  if (!SYNC.user) return;
  localStorage.setItem(SYNC_MOD, new Date().toISOString());
  clearTimeout(syncTimer); syncTimer = setTimeout(syncPush, 1500);
};
async function syncInit() {
  if (!syncConfigured()) return;
  SYNC.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data } = await SYNC.sb.auth.getSession();
  SYNC.user = data.session ? data.session.user : null;
  SYNC.sb.auth.onAuthStateChange((_e, s) => { SYNC.user = s ? s.user : null; if (!s) syncSet({ status: 'off' }); });
  if (SYNC.user) await syncPull(false); else losEmit();
}
async function syncAuth(mode, email, pw) {
  const r = mode === 'up' ? await SYNC.sb.auth.signUp({ email, password: pw }) : await SYNC.sb.auth.signInWithPassword({ email, password: pw });
  if (r.error) return r.error.message;
  if (!r.data.session) return 'สมัครแล้ว กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
  SYNC.user = r.data.session.user; await syncPull(false); return '';
}
async function syncSignOut() { await SYNC.sb.auth.signOut(); SYNC.user = null; syncSet({ status: 'off' }); losToast('ออกจากระบบคลาวด์แล้ว'); }
function SyncForm({ onClose }) {
  const [mode, setMode] = React.useState('in'), [email, setEmail] = React.useState(''), [pw, setPw] = React.useState(''), [msg, setMsg] = React.useState(''), [busy, setBusy] = React.useState(false);
  const ok = /\S+@\S+/.test(email) && pw.length >= 6 && !busy;
  return <FormModal title="ซิงก์ข้อมูลกับคลาวด์" onClose={onClose} valid={ok} saveLabel={mode === 'up' ? 'สมัครและซิงก์' : 'เข้าสู่ระบบ'}
    onSave={async () => { setBusy(true); const m = await syncAuth(mode, email.trim(), pw); setBusy(false); if (m) { setMsg(m); return false; } losToast('เชื่อมต่อคลาวด์แล้ว'); }}>
    <Field label="อีเมล"><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus /></Field>
    <Field label="รหัสผ่าน (อย่างน้อย 6 ตัว)"><input type="password" value={pw} onChange={e => setPw(e.target.value)} /></Field>
    {msg && <p className="hint" style={{ color: 'var(--neg)' }}>{msg}</p>}
    <p className="hint" style={{ cursor: 'pointer' }} onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'ยังไม่มีบัญชี? สมัครใหม่' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}</p>
  </FormModal>;
}
function SyncSettings() {
  useLOS();
  if (!syncConfigured()) return <div className="row"><span style={{ flex: 1 }}><span className="row-t">ซิงก์คลาวด์ (Supabase)</span><span className="row-s">ยังไม่ได้ตั้งค่า — ใส่ URL และ anon key ใน supabase-config.js</span></span></div>;
  if (!SYNC.user) return <Row icon="upload" title="เข้าสู่ระบบเพื่อซิงก์คลาวด์" sub="ใช้ข้อมูลชุดเดียวกันได้ทุกเครื่อง" onClick={() => losOpen('SyncForm')} />;
  const st = { busy: 'กำลังซิงก์...', ok: 'ซิงก์แล้ว ' + (SYNC.at ? SYNC.at.toLocaleTimeString('th-TH') : ''), error: 'ผิดพลาด: ' + SYNC.err, off: '' }[SYNC.status];
  return <>
    <div className="row"><span style={{ flex: 1 }}><span className="row-t">ซิงก์คลาวด์เปิดอยู่</span><span className="row-s">{SYNC.user.email} · {st}</span></span></div>
    <Row icon="clock" title="ซิงก์ตอนนี้" onClick={() => syncPush()} />
    <Row icon="download" title="ดึงข้อมูลจากคลาวด์ทับเครื่องนี้" onClick={() => confirm('แทนที่ข้อมูลในเครื่องด้วยข้อมูลจากคลาวด์?') && syncPull(true)} />
    <Row icon="lock" title="ออกจากระบบคลาวด์" onClick={syncSignOut} />
  </>;
}
syncInit();
Object.assign(window, { SyncForm, SyncSettings, syncPush, syncPull });
