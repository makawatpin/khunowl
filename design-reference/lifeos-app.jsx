// lifeos-app.jsx — shell: sidebar (desktop) + bottom nav (mobile), routing, toast, lock
const NAV = [
  { group: '', items: [{ id: 'dash', label: 'ภาพรวม', icon: 'home' }] },
  { group: 'การเงิน', items: [{ id: 'money', label: 'เงินและบัญชี', icon: 'money' }, { id: 'stats', label: 'สรุป & สถิติ', icon: 'pie' }, { id: 'bills', label: 'บิล & บัตรเครดิต', icon: 'card' }, { id: 'trips', label: 'ทริป & หารเงิน', icon: 'trip' }, { id: 'forecast', label: 'คาดการณ์เงินสด', icon: 'chart' }] },
  { group: 'ของและที่อยู่', items: [{ id: 'assets', label: 'ทรัพย์สิน & ประกัน', icon: 'box' }, { id: 'vehicle', label: 'รถยนต์', icon: 'car' }, { id: 'home', label: 'บ้าน', icon: 'house' }, { id: 'docs', label: 'คลังเอกสาร', icon: 'doc' }] },
  { group: 'วางแผน', items: [{ id: 'calendar', label: 'ปฏิทิน', icon: 'calendar' }, { id: 'notis', label: 'แจ้งเตือน', icon: 'bell' }] },
];
const TITLES = { dash: 'ภาพรวมวันนี้', money: 'เงินและบัญชี', stats: 'สรุป & สถิติ', bills: 'บิล & บัตรเครดิต', trips: 'ทริป & หารเงินกับเพื่อน', forecast: 'คาดการณ์กระแสเงินสด', assets: 'ทรัพย์สิน & ประกัน', vehicle: 'รถยนต์', home: 'บ้าน', docs: 'คลังเอกสาร', calendar: 'ปฏิทิน', notis: 'ศูนย์แจ้งเตือน', search: 'ค้นหา', settings: 'ตั้งค่า' };

function Toast() {
  const [t, setT] = React.useState(null);
  React.useEffect(() => { let tm; const f = (x) => { setT(x); clearTimeout(tm); tm = setTimeout(() => setT(null), x.undo ? 5000 : 2600); }; toastSubs.add(f); return () => { toastSubs.delete(f); clearTimeout(tm); }; }, []);
  if (!t) return null;
  return <div className="toast" key={t.t}><span>{t.msg}</span>{t.undo && <button onClick={() => { losUndo(); setT(null); }}>เลิกทำ</button>}</div>;
}

function LifeOS() {
  useLOS();
  const [unlocked, setUnlocked] = React.useState(() => !LOS_PREFS.pin || sessionStorage.getItem('los:unlocked') === '1');
  const [screen, setScreen] = React.useState(() => { const s = sessionStorage.getItem('los:screen'); return TITLES[s] ? s : 'dash'; });
  const [q, setQ] = React.useState('');
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [mSearch, setMSearch] = React.useState(false);
  const go = (id) => { if (id !== 'search') { const n = { ...(LOS_PREFS.navCount || {}) }; n[id] = (n[id] || 0) + 1; setPref('navCount', n); } setScreen(id); sessionStorage.setItem('los:screen', id); window.scrollTo(0, 0); };
  React.useEffect(() => {
    if (window.__losAutoCount) { losToast(`ตัดบิล/สมาชิกอัตโนมัติ ${window.__losAutoCount} รายการ`); window.__losAutoCount = 0; }
    losDailyNotify();
  }, []);
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  const notiCount = openNotiCount();
  const onSearch = (v) => { setQ(v); if (v.trim() && screen !== 'search') go('search'); };
  const body = {
    dash: <DashboardScreen go={go} />, money: <MoneyScreen go={go} />, stats: <StatsScreen />, bills: <BillsScreen />, trips: <TripsScreen />, forecast: <ForecastScreen />,
    assets: <AssetsScreen />, vehicle: <VehicleScreen />, home: <HomeScreen />, docs: <DocsScreen />,
    calendar: <CalendarScreen />, notis: <NotisScreen />, search: <SearchScreen q={q} setQ={setQ} go={go} />, settings: <SettingsScreen />,
  }[screen];
  const mobileTabs = [{ id: 'dash', label: 'ภาพรวม', icon: 'home' }, { id: 'money', label: 'เงิน', icon: 'money' }, { id: '+', label: '', icon: 'plus' }, { id: 'calendar', label: 'ปฏิทิน', icon: 'calendar' }, { id: 'more', label: 'อื่น ๆ', icon: 'more' }];
  const MAIN = ['dash', 'money', 'calendar'];
  const moreActive = !MAIN.includes(screen);
  const quick = () => losOpen('quick');
  return (
    <div className="los">
      <nav className="side">
        <div className="side-brand"><img className="brand-icon" src="assets/khunowl-icon.png" alt="" /><span className="side-label">KhunOwl</span></div>
        {NAV.map((g, i) => (
          <div className="side-group" key={i}>
            {g.group && <div className="side-cap">{g.group}</div>}
            {g.items.map(it => (
              <button key={it.id} className={'side-item' + (screen === it.id ? ' on' : '')} onClick={() => go(it.id)} title={it.label}>
                <LIcon name={it.icon} size={18} /><span className="side-label">{it.label}</span>
                {it.id === 'notis' && notiCount > 0 && <span className="badge red">{notiCount}</span>}
              </button>))}
          </div>))}
        <div className="side-foot">
          <button className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={quick} title="เพิ่มรายการ"><LIcon name="plus" size={16} color="#fff" /><span className="side-label">เพิ่มรายการ</span></button>
          <button className={'side-item' + (screen === 'settings' ? ' on' : '')} onClick={() => go('settings')} title="ตั้งค่า"><LIcon name="gear" size={18} /><span className="side-label">ตั้งค่า</span>{LOS_PREFS.pin && <LIcon name="lock" size={13} />}</button>
        </div>
      </nav>
      <div className="main">
        <header className="topbar">
          <h1>{TITLES[screen]}</h1>
          <div className={'topbar-actions' + (mSearch ? ' searching' : '')}>
            <button className="btn only-mobile icon-btn" onClick={() => setMSearch(v => !v)} aria-label="ค้นหา"><LIcon name={mSearch ? 'x' : 'search'} size={16} /></button>
            <div className="searchbox"><LIcon name="search" size={15} color="var(--ink-faint)" /><input value={q} onChange={e => onSearch(e.target.value)} placeholder="ค้นหาทุกอย่าง" /></div>
            <button className="btn icon-btn" onClick={() => setPref('hide', !LOS_PREFS.hide)} aria-label={LOS_PREFS.hide ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'} title={LOS_PREFS.hide ? 'แสดงยอดเงิน' : 'ซ่อนยอดเงิน'}><LIcon name={LOS_PREFS.hide ? 'eyeoff' : 'eye'} size={16} /></button>
            <button className="btn btn-primary desk-only" onClick={quick} style={{ display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}><LIcon name="plus" size={16} color="#fff" />เพิ่มรายการ</button>
            <button className="btn icon-btn" onClick={() => go('notis')} aria-label="แจ้งเตือน" style={{ gap: 6 }}><LIcon name="bell" size={16} />{notiCount > 0 && <span className="badge red">{notiCount}</span>}</button>
          </div>
        </header>
        <main className="content" key={screen}>{body}</main>
      </div>
      <nav className="botnav">
        {mobileTabs.map(t => t.id === '+'
          ? <button key="+" onClick={quick} aria-label="เพิ่มรายการ"><span className="plus"><LIcon name="plus" size={22} color="#fff" /></span></button>
          : <button key={t.id} className={(t.id === 'more' ? moreActive : screen === t.id) ? 'on' : ''} onClick={() => t.id === 'more' ? setMoreOpen(true) : go(t.id)}><LIcon name={t.icon} size={20} />{t.label}{t.id === 'more' && notiCount > 0 && <span className="nav-dot"></span>}</button>)}
      </nav>
      {moreOpen && <Modal title="เมนูทั้งหมด" onClose={() => setMoreOpen(false)}>
        {(() => { const all = [...NAV.slice(1), { group: 'อื่น ๆ', items: [{ id: 'settings', label: 'ตั้งค่า', icon: 'gear' }] }], cnt = LOS_PREFS.navCount || {}; const flat = all.flatMap(g => g.items).filter(it => !MAIN.includes(it.id) && it.id !== 'settings' && cnt[it.id] >= 2).sort((x, y) => cnt[y.id] - cnt[x.id]).slice(0, 3); const fav = new Set(flat.map(i => i.id)); return [...(flat.length ? [{ group: 'ใช้บ่อย', items: flat }] : []), ...all.map(g => ({ ...g, items: g.items.filter(it => !fav.has(it.id)) }))]; })().map(g => { const items = g.group === 'ใช้บ่อย' ? g.items : g.items.filter(it => !MAIN.includes(it.id)); if (!items.length) return null; return (
          <div key={g.group} style={{ marginBottom: 14 }}>
            <div className="cap" style={{ margin: '0 4px 8px' }}>{g.group}</div>
            <div className="more-grid">{items.map(it => (
              <button key={it.id} className={'more-item' + (screen === it.id ? ' on' : '')} onClick={() => { go(it.id); setMoreOpen(false); }}>
                <LIcon name={it.icon} size={20} /><span>{it.label}</span>{it.id === 'notis' && notiCount > 0 && <span className="badge red">{notiCount}</span>}
              </button>))}</div>
          </div>); })}
      </Modal>}
      <FormHost />
      <Toast />
    </div>
  );
}
Object.assign(window, { LifeOS });
