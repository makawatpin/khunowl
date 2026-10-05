// lifeos-vehicle.jsx — Vehicle profiles (multi-vehicle), fuel, maintenance, insurance
function VehicleForm({ initial, onClose }) {
  const i = initial || {};
  const [f, set] = useF({ kind: i.kind || 'รถยนต์', brand: i.brand || '', model: i.model || '', year: i.year || '', plate: i.plate || '', color: i.color || '', mileage: i.mileage ?? '', serviceEvery: i.serviceEvery || 5000, vin: i.vin || '',
    insCompany: (i.insurance || {}).company || '', insPolicy: (i.insurance || {}).policy || '', insExpiry: (i.insurance || {}).expiry || '', insPremium: (i.insurance || {}).premium || '',
    prbExpiry: (i.prb || {}).expiry || '', prbPremium: (i.prb || {}).premium || '', taxExpiry: (i.tax || {}).expiry || '', taxPremium: (i.tax || {}).premium || '' });
  const valid = f.brand.trim() && f.model.trim() && f.plate.trim();
  const save = () => {
    const v = { ...i, id: i.id || 'v_' + lid(), kind: f.kind, brand: f.brand.trim(), model: f.model.trim(), year: numv(f.year) || TODAY.getFullYear(), plate: f.plate.trim(), vin: f.vin, color: f.color.trim() || '—',
      mileage: numv(f.mileage), serviceEvery: numv(f.serviceEvery) || 5000,
      insurance: { company: f.insCompany.trim() || '—', policy: f.insPolicy || '—', premium: numv(f.insPremium), expiry: f.insExpiry },
      prb: { expiry: f.prbExpiry || f.insExpiry, premium: numv(f.prbPremium) }, tax: { expiry: f.taxExpiry, premium: numv(f.taxPremium) } };
    losUpsert(LOS_VEHICLES, v, initial ? 'บันทึกข้อมูลรถแล้ว' : 'เพิ่มรถแล้ว');
    window.__losVid = v.id;
  };
  return (
    <FormModal title={initial ? 'แก้ไขข้อมูลรถ' : 'เพิ่มรถ'} onClose={onClose} valid={valid} onSave={save}
      onDelete={initial ? () => losUpdate(() => { const k = LOS_VEHICLES.findIndex(x => x.id === i.id); if (k >= 0) LOS_VEHICLES.splice(k, 1); }, 'ลบรถแล้ว') : null}>
      <Field label="ประเภท"><div className="seg">{['รถยนต์', 'มอเตอร์ไซค์', 'กระบะ', 'อื่นๆ'].map(k => <button key={k} className={f.kind === k ? 'on' : ''} onClick={() => set('kind')(k)}>{k}</button>)}</div></Field>
      <G2>
        <Field label="ยี่ห้อ"><input value={f.brand} onChange={set('brand')} placeholder="Toyota" autoFocus /></Field>
        <Field label="รุ่น"><input value={f.model} onChange={set('model')} placeholder="Yaris Ativ" /></Field>
        <Field label="ปี"><input value={f.year} onChange={set('year')} inputMode="numeric" placeholder="2022" /></Field>
        <Field label="สี"><input value={f.color} onChange={set('color')} placeholder="เทา" /></Field>
      </G2>
      <Field label="ทะเบียน"><input value={f.plate} onChange={set('plate')} placeholder="2กก 1234 กรุงเทพฯ" /></Field>
      <G2>
        <Field label="เลขไมล์ปัจจุบัน (กม.)"><input value={f.mileage} onChange={set('mileage')} inputMode="numeric" /></Field>
        <Field label="เช็กระยะทุก (กม.)"><input value={f.serviceEvery} onChange={set('serviceEvery')} inputMode="numeric" /></Field>
      </G2>
      <div className="form-sec">ประกัน · พ.ร.บ. · ภาษี (ใส่ทีหลังได้)</div>
      <G2>
        <Field label="บริษัทประกัน"><input value={f.insCompany} onChange={set('insCompany')} /></Field>
        <Field label="เลขกรมธรรม์"><input value={f.insPolicy} onChange={set('insPolicy')} /></Field>
        <Field label="ประกันหมดอายุ"><input type="date" value={f.insExpiry} onChange={set('insExpiry')} /></Field>
        <Field label="เบี้ยประกัน"><input value={f.insPremium} onChange={set('insPremium')} inputMode="numeric" /></Field>
        <Field label="พ.ร.บ. หมดอายุ"><input type="date" value={f.prbExpiry} onChange={set('prbExpiry')} /></Field>
        <Field label="เบี้ย พ.ร.บ."><input value={f.prbPremium} onChange={set('prbPremium')} inputMode="numeric" /></Field>
        <Field label="ภาษีหมดอายุ"><input type="date" value={f.taxExpiry} onChange={set('taxExpiry')} /></Field>
        <Field label="ค่าภาษี"><input value={f.taxPremium} onChange={set('taxPremium')} inputMode="numeric" /></Field>
      </G2>
    </FormModal>
  );
}

function VehicleScreen() {
  const [tab, setTab] = React.useState('overview');
  const [vid, setVid] = React.useState(window.__losVid || (LOS_VEHICLES[0] || {}).id);
  const [svcCatF, setSvcCatF] = React.useState('all');
  const [svcOpen, setSvcOpen] = React.useState(null);
  const v = LOS_VEHICLES.find(x => x.id === (window.__losVid || vid)) || LOS_VEHICLES[0];
  React.useEffect(() => { if (window.__losVid) { setVid(window.__losVid); window.__losVid = null; } });
  if (!v) return <Card pad={false}><Empty text="ยังไม่มีรถในระบบ" action="เพิ่มรถ" onAction={() => losOpen('VehicleForm')} /></Card>;
  const fs = fuelStats(v.id), svc = serviceOf(v.id), fuel = fuelOf(v.id);
  const target = nextServiceKm(v), kmLeft = target - v.mileage;
  const due = (d) => d ? <span>{dShort(d)} <Badge tone={dueLabel(d).tone}>{dueLabel(d).text}</Badge></span> : '—';
  const ins = v.insurance || {}, prb = v.prb || {}, tax = v.tax || {};
  const svcSum = svc.reduce((s, x) => s + (+x.cost || 0), 0), fuelSum = fuel.reduce((s, x) => s + (+x.total || 0), 0), lifeCost = svcSum + fuelSum;
  const catTot = SVC_CATS.map(([c, ic]) => [c, ic, svc.filter(s => svcCat(s) === c).reduce((a, x) => a + (+x.cost || 0), 0)]).filter(x => x[2] > 0);
  const catMax = Math.max(1, ...catTot.map(x => x[2]));
  const svcList = svcCatF === 'all' ? svc : svc.filter(s => svcCat(s) === svcCatF);
  const firstDate = [...svc, ...fuel].reduce((m, x) => !m || x.date < m ? x.date : m, '');
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        {LOS_VEHICLES.map(x => <button key={x.id} className={'chip' + (x.id === v.id ? ' on' : '')} onClick={() => setVid(x.id)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{x.brand} {String(x.model).split(' ')[0]}</button>)}
        <button className="chip" onClick={() => losOpen('VehicleForm')} style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}><LIcon name="plus" size={14} /> เพิ่มรถ</button>
      </div>
      <HeroHeader icon="car" title={vehicleName(v)} sub={`${v.kind || 'รถยนต์'} · ปี ${v.year} · ${v.plate}`}
        statLabel="เลขไมล์" statValue={(+v.mileage).toLocaleString() + ' กม.'}
        chips={[['เช็กระยะถัดไป', kmLeft.toLocaleString() + ' กม.'], ['กม./ลิตร', fs.legs ? fs.kmPerL.toFixed(1) : '—'], ['ประกันหมด', ins.expiry ? dShort(ins.expiry) : '—'], ['ใช้จ่ายตลอดการใช้งาน', baht2(lifeCost)]]} />
      <div className="actbar">
        <button className="btn" onClick={() => losOpen('fuel', { vid: v.id })}><LIcon name="fuel" size={15} />เติมน้ำมัน</button>
        <button className="btn" onClick={() => losOpen('service', { vid: v.id })}><LIcon name="wrench" size={15} />ซ่อม / ค่าใช้จ่ายรถ</button>
        <button className="btn" onClick={() => losOpen('VehicleForm', { initial: v })}><LIcon name="edit" size={15} />แก้ไขข้อมูลรถ</button>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'ภาพรวม' }, { id: 'service', label: 'ซ่อมบำรุง' }, { id: 'fuel', label: 'น้ำมัน' }, { id: 'papers', label: 'ประกัน & ภาษี' }]} />
      {tab === 'overview' && <>
        <div className="grid g3">
          <Stat tint="warn" label="เช็กระยะถัดไป" value={target.toLocaleString() + ' กม.'} sub={`เหลืออีก ${kmLeft.toLocaleString()} กม.`} />
          <Stat tint="pos" label="อัตราสิ้นเปลือง" value={fs.legs ? fs.kmPerL.toFixed(1) + ' กม./ลิตร' : 'ยังไม่มีข้อมูล'} sub={fs.legs ? `${fs.costPerKm.toFixed(2)} บาท/กม.` : 'เติมน้ำมัน 2 ครั้งเพื่อคำนวณ'} />
          <Stat tint="hero" label={'ค่าใช้จ่ายรถปี ' + TODAY.getFullYear()} value={money(vehicleYearCost(v))} sub="น้ำมัน + ซ่อม + ประกัน + ภาษี" />
        </div>
        <Sec title="สถานะที่ต้องดูแล" />
        <Card pad={false}>
          <Row icon="wrench" tone={kmLeft < 1000 ? 'warn' : null} title={`เช็กระยะ ${target.toLocaleString()} กม.`} sub={`ปัจจุบัน ${(+v.mileage).toLocaleString()} กม.`} right={kmLeft.toLocaleString() + ' กม.'} rightSub="เหลืออีก" />
          <Row icon="shield" tone={ins.expiry && daysTo(ins.expiry) <= 45 ? 'warn' : null} title="ประกันภัย" sub={ins.company} right={ins.expiry ? dShort(ins.expiry) : '—'} rightSub={ins.expiry ? dueLabel(ins.expiry).text : 'ยังไม่ได้กรอก'} />
          <Row icon="doc" title="พ.ร.บ." sub={prb.premium ? money(prb.premium) : '—'} right={prb.expiry ? dShort(prb.expiry) : '—'} rightSub={prb.expiry ? dueLabel(prb.expiry).text : 'ยังไม่ได้กรอก'} />
          <Row icon="doc" title="ภาษีรถ" sub={tax.premium ? money(tax.premium) : '—'} right={tax.expiry ? dShort(tax.expiry) : '—'} rightSub={tax.expiry ? dueLabel(tax.expiry).text : 'ยังไม่ได้กรอก'} />
        </Card>
        <Sec title="ข้อมูลรถ" />
        <Card><Detail rows={[['ยี่ห้อ/รุ่น', vehicleName(v)], ['ประเภท', v.kind || 'รถยนต์'], ['ปี', v.year], ['ทะเบียน', v.plate], v.vin ? ['เลขตัวถัง', <span className="num">{v.vin}</span>] : null, ['สี', v.color], v.bought ? ['วันที่ซื้อ', dLong(v.bought)] : null, v.price ? ['ราคาซื้อ', money(v.price)] : null]} /></Card>
      </>}
      {tab === 'service' && (svc.length ? <>
        <div className="grid g3">
          <Stat tint="hero" label="ค่าใช้จ่ายตลอดการใช้งาน" value={baht2(lifeCost)} sub={`ซ่อม/ดูแล ${baht2(svcSum)} · น้ำมัน ${baht2(fuelSum)}` + (firstDate ? ` · ตั้งแต่ ${dLong(firstDate)}` : '')} />
          <Stat tint="accent" label={'ค่าซ่อม/ดูแลปี ' + TODAY.getFullYear()} value={baht2(svc.filter(s => s.date.startsWith(String(TODAY.getFullYear()))).reduce((s, x) => s + (+x.cost || 0), 0))} />
          <Stat label="ครั้งล่าสุด" value={dShort(svc[0].date)} sub={(svc[0].mileage ? `${(+svc[0].mileage).toLocaleString()} กม. · ` : '') + (svc[0].provider || svc[0].name)} />
        </div>
        <Sec title="แยกตามหมวด" />
        <Card>{catTot.map(([c, ic, a], k) => (
          <button key={c} className="svc-cat" style={{ marginTop: k ? 12 : 0 }} onClick={() => setSvcCatF(svcCatF === c ? 'all' : c)}>
            <span style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 6, alignItems: 'center' }}><LIcon name={ic} size={15} color="var(--ink-soft)" /><span style={{ flex: 1, fontWeight: svcCatF === c ? 600 : 400 }}>{c}</span><span className="row-s">{svc.filter(s => svcCat(s) === c).length} ครั้ง</span><b className="num">{baht2(a)}</b></span>
            <Bar ratio={a / catMax} color={svcCatF === 'all' || svcCatF === c ? 'var(--accent)' : 'var(--line)'} />
          </button>))}</Card>
        <Sec title="ประวัติซ่อมบำรุง & ค่าใช้จ่ายรถ" action="+ บันทึก" onAction={() => losOpen('service', { vid: v.id })} />
        <div className="chips" style={{ marginBottom: 10 }}>{[['all', 'ทั้งหมด'], ...SVC_CATS.filter(([c]) => catTot.some(x => x[0] === c)).map(([c]) => [c, c])].map(([k, l]) => <button key={k} className={'chip' + (svcCatF === k ? ' on' : '')} onClick={() => setSvcCatF(k)}>{l}</button>)}</div>
        <Card pad={false}>{svcList.map(s => { const on = svcOpen === s.id, its = s.items || []; return (
          <div key={s.id} className="trip-exp">
            <Row icon={svcIcon(s)} onClick={() => setSvcOpen(on ? null : s.id)} title={s.name}
              sub={[svcCat(s), dLong(s.date), s.mileage ? (+s.mileage).toLocaleString() + ' กม.' : null, s.provider, its.length ? its.length + ' รายการ' : null].filter(Boolean).join(' · ')}
              right={baht2(s.cost)} />
            {on && <div className="trip-exp-body">
              {its.length > 0 && <div className="svc-lines">{its.map((it, k) => <div key={k} className="svc-line"><span>{it.name}</span><span className="num">{it.price ? baht2(it.price) : <Badge tone="green">ฟรี</Badge>}</span></div>)}
                <div className="svc-line" style={{ fontWeight: 600, borderBottom: 'none' }}><span>รวม</span><span className="num">{baht2(s.cost)}</span></div></div>}
              {s.note && <div className="hint" style={{ margin: 0 }}>หมายเหตุ: {s.note}</div>}
              <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-sm" onClick={() => losOpen('service', { initial: s })}><LIcon name="edit" size={14} />แก้ไข</button></div>
            </div>}
          </div>); })}</Card>
      </> : <Card pad={false}><Empty text="ยังไม่มีประวัติซ่อมบำรุงของรถคันนี้" action="บันทึกซ่อมบำรุง" onAction={() => losOpen('service', { vid: v.id })} /></Card>)}
      {tab === 'fuel' && (fuel.length ? <>
        <div className="grid g3">
          <Stat tint="pos" label="เฉลี่ย" value={fs.legs ? fs.kmPerL.toFixed(1) + ' กม./ล.' : '—'} />
          <Stat tint="accent" label="ต้นทุนต่อ กม." value={fs.legs ? fs.costPerKm.toFixed(2) + ' บาท' : '—'} />
          <Stat tint="hero" label="ค่าน้ำมันเดือนนี้" value={money(fs.monthly)} />
        </div>
        <Sec title="ประวัติเติมน้ำมัน" action="+ บันทึก" onAction={() => losOpen('fuel', { vid: v.id })} />
        <Card pad={false}>{fuel.map(f => <ActRow key={f.id} icon="fuel" title={`${(+f.liters).toFixed(1)} ลิตร · ฿${f.perL}/ล.`} sub={`${dShort(f.date)} · ${(+f.mileage).toLocaleString()} กม.`} amount={money(f.total)} btn="ลบ" onBtn={() => losRemove(LOS_FUEL, f.id, 'ลบรายการแล้ว')} />)}</Card>
      </> : <Card pad={false}><Empty text="ยังไม่มีประวัติเติมน้ำมันของรถคันนี้" action="บันทึกเติมน้ำมัน" onAction={() => losOpen('fuel', { vid: v.id })} /></Card>)}
      {tab === 'papers' && <>
        <div className="grid g2">
          <Card>
            <Cap>ประกันภัย</Cap>
            <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 10px' }}>{ins.company || '—'}</div>
            <Detail rows={[['เลขกรมธรรม์', <span className="num">{ins.policy || '—'}</span>], ['เบี้ยประกัน', ins.premium ? money(ins.premium) : '—'], ['หมดอายุ', due(ins.expiry)]]} />
          </Card>
          <Card>
            <Cap>พ.ร.บ. & ภาษี</Cap>
            <div style={{ fontSize: 15, fontWeight: 600, margin: '6px 0 10px' }}>ทะเบียน {v.plate}</div>
            <Detail rows={[['พ.ร.บ. หมดอายุ', due(prb.expiry)], ['เบี้ย พ.ร.บ.', prb.premium ? money(prb.premium) : '—'], ['ภาษีหมดอายุ', due(tax.expiry)], ['ค่าภาษี', tax.premium ? money(tax.premium) : '—'], ['รวมต้องเตรียม', <b className="num">{money((+ins.premium || 0) + (+prb.premium || 0) + (+tax.premium || 0))}</b>]]} />
          </Card>
        </div>
        <Sec title="เอกสารรถ" action="+ เพิ่ม" onAction={() => losOpen('doc', { initial: null })} />
        {(() => { const key = String(v.model).split(' ')[0]; const docs = LOS_DOCS.filter(d => d.rel && (d.rel.includes(key) || d.rel.includes(v.plate))); return <Card pad={false}>{docs.length ? docs.map(d => <Row key={d.id} icon="doc" title={d.name} sub={d.type} right={d.expiry ? dShort(d.expiry) : '—'} rightSub={d.expiry ? dueLabel(d.expiry).text : ''} onClick={() => losOpen('doc', { initial: d })} />) : <Empty text="ยังไม่มีเอกสารผูกกับรถคันนี้" />}</Card>; })()}
      </>}
    </>
  );
}
Object.assign(window, { VehicleScreen, VehicleForm });
