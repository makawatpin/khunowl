// lifeos-forms.jsx — all add/edit forms + FormHost (opened via losOpen(kind, props))
const numv = (v) => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isNaN(n) ? 0 : n; };
function useF(init) {
  const [f, setF] = React.useState(init);
  const set = (k) => (e) => { const v = e && e.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e; setF(p => ({ ...p, [k]: v })); };
  return [f, set, setF];
}
function FormModal({ title, onClose, onSave, onDelete, valid = true, saveLabel = 'บันทึก', children }) {
  return (
    <Modal title={title} onClose={onClose} foot={[
      onDelete && <button key="d" className="btn btn-danger" onClick={() => { onDelete(); onClose(); }} aria-label="ลบ" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LIcon name="trash" size={15} />ลบ</button>,
      <button key="c" className="btn" onClick={onClose}>ยกเลิก</button>,
      <button key="s" className="btn btn-primary" disabled={!valid} style={{ flex: 1, opacity: valid ? 1 : .4 }} onClick={() => { if (!valid) return; onSave(); onClose(); }}>{saveLabel}</button>,
    ].filter(Boolean)}>{children}</Modal>
  );
}
const G2 = ({ children }) => <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0 12px' }}>{children}</div>;
function SrcSelect({ value, onChange, cards = true, none }) {
  return <select value={value} onChange={onChange}>
    {none && <option value="">{none}</option>}
    <optgroup label="บัญชี / กระเป๋าเงิน">{LOS_ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</optgroup>
    {cards && LOS_CARDS.length > 0 && <optgroup label="บัตรเครดิต">{LOS_CARDS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
  </select>;
}
const BANK_OPTS = [['kbank', 'กสิกรไทย'], ['scb', 'ไทยพาณิชย์'], ['ktb', 'กรุงไทย'], ['bbl', 'กรุงเทพ'], ['ttb', 'ทีทีบี'], ['bay', 'กรุงศรี'], ['gsb', 'ออมสิน'], ['ktc', 'KTC'], ['cardx', 'CardX (SCB)'], ['krungsricard', 'กรุงศรี คาร์ด / The 1'], ['firstchoice', 'กรุงศรี เฟิร์สช้อยส์'], ['aeon', 'อิออน (AEON)'], ['amex', 'American Express'], ['umay', 'UMAY+'], ['citi', 'Citi (UOB)'], ['uob', 'ยูโอบี'], ['cimb', 'ซีไอเอ็มบี'], ['lhb', 'แลนด์ แอนด์ เฮ้าส์'], ['kkp', 'เกียรตินาคินภัทร'], ['tisco', 'ทิสโก้'], ['baac', 'ธ.ก.ส.'], ['ghb', 'อาคารสงเคราะห์'], ['ibank', 'อิสลาม'], ['icbc', 'ไอซีบีซี'], ['linebk', 'LINE BK'], ['dime', 'Dime!'], ['make', 'MAKE by KBank'], ['kept', 'Kept by Krungsri'], ['paotang', 'เป๋าตัง'], ['clicx', 'ClicX'], ['truemoney', 'TrueMoney'], ['shopeepay', 'ShopeePay'], ['cash', 'เงินสด / อื่นๆ']];
const BankSelect = ({ value, onChange }) => <select value={value} onChange={onChange}>{BANK_OPTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
const firstAcc = () => (LOS_ACCOUNTS[0] || {}).id || '';

function AccountForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', bank: 'kbank', type: 'ออมทรัพย์', bal: '', last4: '' });
  return <FormModal title={initial ? 'แก้ไขบัญชี' : 'เพิ่มบัญชี'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpsert(LOS_ACCOUNTS, { ...f, name: f.name.trim(), bal: numv(f.bal), last4: String(f.last4 || '').slice(-4) }, initial ? 'บันทึกบัญชีแล้ว' : 'เพิ่มบัญชีแล้ว')}
    onDelete={initial && LOS_ACCOUNTS.length > 1 ? () => losRemove(LOS_ACCOUNTS, initial.id, 'ลบบัญชีแล้ว') : null}>
    <Field label="ชื่อบัญชี"><input value={f.name} onChange={set('name')} placeholder="กสิกร เงินเดือน" autoFocus /></Field>
    <G2><Field label="ธนาคาร"><BankSelect value={f.bank} onChange={set('bank')} /></Field>
      <Field label="ประเภท"><select value={f.type} onChange={set('type')}>{['ออมทรัพย์', 'ฝากประจำ', 'กระแสรายวัน', 'e-Wallet', 'เงินสด', 'ลงทุน'].map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="ยอดคงเหลือ (บาท)"><input value={f.bal} onChange={set('bal')} inputMode="decimal" placeholder="0" /></Field>
      <Field label="เลขท้าย 4 หลัก"><input value={f.last4 || ''} onChange={set('last4')} inputMode="numeric" maxLength={4} placeholder="ไม่บังคับ" /></Field></G2>
  </FormModal>;
}
function CardForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', bank: 'ktc', network: 'VISA', last4: '', limit: '', used: '', statement: relDay(10), due: relDay(25), min: '' });
  return <FormModal title={initial ? 'แก้ไขบัตรเครดิต' : 'เพิ่มบัตรเครดิต'} onClose={onClose} valid={f.name.trim() && numv(f.limit) > 0}
    onSave={() => losUpsert(LOS_CARDS, { ...f, name: f.name.trim(), limit: numv(f.limit), used: numv(f.used), min: numv(f.min) || Math.round(numv(f.used) * 0.08), last4: String(f.last4 || '').slice(-4) }, initial ? 'บันทึกบัตรแล้ว' : 'เพิ่มบัตรแล้ว')}
    onDelete={initial ? () => losRemove(LOS_CARDS, initial.id, 'ลบบัตรแล้ว') : null}>
    <Field label="ชื่อบัตร"><input value={f.name} onChange={set('name')} placeholder="KTC Visa Platinum" autoFocus /></Field>
    <G2><Field label="ผู้ออกบัตร"><BankSelect value={f.bank} onChange={set('bank')} /></Field>
      <Field label="เครือข่าย"><select value={f.network} onChange={set('network')}>{['VISA', 'Mastercard', 'JCB', 'UnionPay', 'AMEX'].map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="วงเงิน (บาท)"><input value={f.limit} onChange={set('limit')} inputMode="decimal" /></Field>
      <Field label="ยอดใช้ปัจจุบัน"><input value={f.used} onChange={set('used')} inputMode="decimal" placeholder="0" /></Field>
      <Field label="วันสรุปยอด"><input type="date" value={f.statement} onChange={set('statement')} /></Field>
      <Field label="กำหนดชำระ"><input type="date" value={f.due} onChange={set('due')} /></Field>
      <Field label="ขั้นต่ำ (บาท)"><input value={f.min} onChange={set('min')} inputMode="decimal" placeholder="8% อัตโนมัติ" /></Field>
      <Field label="เลขท้าย 4 หลัก"><input value={f.last4 || ''} onChange={set('last4')} inputMode="numeric" maxLength={4} /></Field></G2>
  </FormModal>;
}
function PayCardModal({ card, onClose }) {
  const [mode, setMode] = React.useState('full');
  const [f, set] = useF({ custom: '', from: firstAcc() });
  const amt = mode === 'full' ? card.used : mode === 'min' ? Math.min(card.min, card.used) : numv(f.custom);
  const acc = LOS_ACCOUNTS.find(a => a.id === f.from);
  return <FormModal title={'ชำระ ' + card.name} onClose={onClose} saveLabel={'ชำระ ' + money(amt)} valid={amt > 0 && acc}
    onSave={() => losUpdate(() => payCardNow(LOS_CARDS.find(c => c.id === card.id), amt, f.from), `ชำระ ${card.name} ${money(amt)} แล้ว`)}>
    <div className="seg" style={{ marginBottom: 14 }}>{[['full', 'เต็มจำนวน'], ['min', 'ขั้นต่ำ'], ['custom', 'ระบุเอง']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} onClick={() => setMode(k)}>{l}</button>)}</div>
    {mode === 'custom' ? <Field label="จำนวนเงิน"><input value={f.custom} onChange={set('custom')} inputMode="decimal" autoFocus /></Field>
      : <div className="num" style={{ fontSize: 30, fontWeight: 600, margin: '0 0 14px' }}>{money(amt)}</div>}
    <Field label="จ่ายจากบัญชี"><SrcSelect value={f.from} onChange={set('from')} cards={false} /></Field>
    <Detail rows={[['ยอดค้าง', money(card.used)], ['ขั้นต่ำ', money(card.min)], ['กำหนดชำระ', dShort(card.due)], acc ? ['คงเหลือหลังจ่าย', money(acc.bal - amt)] : null]} />
  </FormModal>;
}
function TransferForm({ initial, onClose }) {
  const [f, set] = useF(initial ? { ...initial } : { src: firstAcc(), to: (LOS_ACCOUNTS[1] || {}).id || '', amount: '', date: TODAY_ISO, note: '' });
  const ok = numv(f.amount) > 0 && f.src && f.to && f.src !== f.to;
  return <FormModal title={initial ? 'รายการโอน' : 'โอนเงินระหว่างบัญชี'} onClose={onClose} valid={ok}
    onSave={() => losUpdate(() => { if (initial) removeTxn(initial.id); addTxn({ ...f, id: initial ? initial.id : lid(), type: 'transfer', amount: numv(f.amount), name: initial ? initial.name : `โอน ${srcName(f.src)} → ${srcName(f.to)}`, cat: initial ? initial.cat : 'โอน' }); }, 'บันทึกการโอนแล้ว')}
    onDelete={initial ? () => losUpdate(() => removeTxn(initial.id), 'ลบรายการแล้ว') : null}>
    <G2><Field label="จาก"><SrcSelect value={f.src} onChange={set('src')} cards={false} /></Field>
      <Field label="ไปยัง"><SrcSelect value={f.to} onChange={set('to')} /></Field></G2>
    <G2><Field label="จำนวนเงิน"><input value={f.amount} onChange={set('amount')} inputMode="decimal" autoFocus /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field></G2>
    <Field label="โน้ต"><input value={f.note || ''} onChange={set('note')} placeholder="ไม่บังคับ" /></Field>
  </FormModal>;
}
function TxnForm({ type = 'expense', initial, onClose }) {
  const [f, set, setF] = useF(initial ? { ...initial } : { type, name: '', amount: '', cat: type === 'income' ? INC_CATS[0] : EXP_CATS[0], src: firstAcc(), date: TODAY_ISO, note: '' });
  const cats = f.type === 'income' ? INC_CATS : EXP_CATS;
  const ok = numv(f.amount) > 0 && f.src;
  return <FormModal title={(initial ? 'แก้ไข' : 'บันทึก') + (f.type === 'income' ? 'รายรับ' : 'รายจ่าย')} onClose={onClose} valid={ok}
    onSave={() => losUpdate(() => { if (initial) removeTxn(initial.id); addTxn({ ...f, id: initial ? initial.id : lid(), amount: numv(f.amount), name: f.name.trim() || f.cat }); }, initial ? 'บันทึกการแก้ไขแล้ว' : `บันทึก${f.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ${money(numv(f.amount))} แล้ว`)}
    onDelete={initial ? () => losUpdate(() => removeTxn(initial.id), 'ลบรายการแล้ว') : null}>
    <div className="seg" style={{ marginBottom: 14 }}>{[['expense', 'รายจ่าย'], ['income', 'รายรับ']].map(([k, l]) => <button key={k} className={f.type === k ? 'on' : ''} onClick={() => setF(p => ({ ...p, type: k, cat: (k === 'income' ? INC_CATS : EXP_CATS)[0] }))}>{l}</button>)}</div>
    <Field label="จำนวนเงิน (บาท)"><input className="big-num" value={f.amount} onChange={set('amount')} inputMode="decimal" placeholder="0" autoFocus /></Field>
    <Field label="หมวด"><div className="chips">{cats.map(c => <button key={c} type="button" className={'chip' + (f.cat === c ? ' on' : '')} onClick={() => set('cat')(c)}>{c}</button>)}</div></Field>
    <Field label="รายละเอียด"><input value={f.name} onChange={set('name')} placeholder={f.cat} /></Field>
    <G2><Field label={f.type === 'income' ? 'เข้าบัญชี' : 'จ่ายจาก'}><SrcSelect value={f.src} onChange={set('src')} cards={f.type === 'expense'} /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field></G2>
    <Field label="โน้ต"><input value={f.note || ''} onChange={set('note')} placeholder="ไม่บังคับ" /></Field>
  </FormModal>;
}
function BillForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', domain: '', amount: '', cycle: 'รายเดือน', due: relDay(7), account: firstAcc(), auto: false });
  return <FormModal title={initial ? 'แก้ไขบิล' : 'เพิ่มบิล / ค่าใช้จ่ายประจำ'} onClose={onClose} valid={f.name.trim() && numv(f.amount) > 0}
    onSave={() => losUpsert(LOS_BILLS, { ...f, name: f.name.trim(), amount: numv(f.amount), domain: (f.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') }, 'บันทึกบิลแล้ว')}
    onDelete={initial ? () => losRemove(LOS_BILLS, initial.id, 'ลบบิลแล้ว') : null}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}><BrandLogo domain={f.domain} size={46} /><div style={{ flex: 1 }}><Field label="ชื่อบิล"><input value={f.name} onChange={set('name')} placeholder="ค่าไฟ MEA" autoFocus /></Field></div></div>
    <Field label="เว็บไซต์ (ใช้ดึงโลโก้)"><input value={f.domain || ''} onChange={set('domain')} placeholder="mea.or.th" autoCapitalize="none" /></Field>
    <G2><Field label="จำนวนเงิน"><input value={f.amount} onChange={set('amount')} inputMode="decimal" /></Field>
      <Field label="รอบ"><select value={f.cycle} onChange={set('cycle')}>{['รายเดือน', 'ทุก 3 เดือน', 'ทุก 6 เดือน', 'รายปี'].map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="ครบกำหนดครั้งถัดไป"><input type="date" value={f.due} onChange={set('due')} /></Field>
      <Field label="จ่ายจาก"><SrcSelect value={f.account} onChange={set('account')} /></Field></G2>
    <label className="check"><input type="checkbox" checked={!!f.auto} onChange={set('auto')} />ตัดบัญชีอัตโนมัติ (ระบบบันทึกให้เมื่อถึงวัน)</label>
  </FormModal>;
}
function SubForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', domain: '', price: '', cycle: 'เดือน', next: relDay(14), src: (LOS_CARDS[0] || LOS_ACCOUNTS[0] || {}).id });
  return <FormModal title={initial ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกรายเดือน'} onClose={onClose} valid={f.name.trim() && numv(f.price) > 0}
    onSave={() => losUpsert(LOS_SUBS, { ...f, name: f.name.trim(), price: numv(f.price), domain: (f.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') }, 'บันทึกสมาชิกแล้ว')}
    onDelete={initial ? () => losRemove(LOS_SUBS, initial.id, 'ยกเลิกสมาชิกแล้ว') : null}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}><BrandLogo domain={f.domain} size={46} /><div style={{ flex: 1 }}><Field label="ชื่อบริการ"><input value={f.name} onChange={set('name')} placeholder="Netflix" autoFocus /></Field></div></div>
    <Field label="เว็บไซต์ (ใช้ดึงโลโก้)"><input value={f.domain || ''} onChange={set('domain')} placeholder="netflix.com" autoCapitalize="none" /></Field>
    <G2><Field label="ราคา"><input value={f.price} onChange={set('price')} inputMode="decimal" /></Field>
      <Field label="รอบ"><select value={f.cycle} onChange={set('cycle')}>{['เดือน', 'ปี'].map(x => <option key={x} value={x}>ราย{x}</option>)}</select></Field>
      <Field label="ตัดเงินครั้งถัดไป"><input type="date" value={f.next} onChange={set('next')} /></Field>
      <Field label="ตัดผ่าน"><SrcSelect value={f.src} onChange={set('src')} /></Field></G2>
  </FormModal>;
}
function PlanForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', card: (LOS_CARDS[0] || {}).id, total: '', months: 10, paid: 0 });
  return <FormModal title={initial ? 'แก้ไขรายการผ่อน' : 'เพิ่มรายการผ่อน 0%'} onClose={onClose} valid={f.name.trim() && numv(f.total) > 0 && numv(f.months) > 0 && f.card}
    onSave={() => losUpsert(LOS_PLANS, { ...f, name: f.name.trim(), total: numv(f.total), months: numv(f.months), paid: numv(f.paid) }, 'บันทึกรายการผ่อนแล้ว')}
    onDelete={initial ? () => losRemove(LOS_PLANS, initial.id, 'ลบรายการผ่อนแล้ว') : null}>
    <Field label="สินค้า"><input value={f.name} onChange={set('name')} placeholder="iPhone ผ่อน 0% 10 เดือน" autoFocus /></Field>
    <Field label="ผ่อนผ่านบัตร"><select value={f.card} onChange={set('card')}>{LOS_CARDS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
    <G2><Field label="ราคารวม"><input value={f.total} onChange={set('total')} inputMode="decimal" /></Field>
      <Field label="จำนวนงวด"><input value={f.months} onChange={set('months')} inputMode="numeric" /></Field>
      <Field label="จ่ายไปแล้ว (งวด)"><input value={f.paid} onChange={set('paid')} inputMode="numeric" /></Field>
      <Field label="ต่องวด"><input value={numv(f.months) ? money(numv(f.total) / numv(f.months)) : '—'} readOnly /></Field></G2>
  </FormModal>;
}
const ASSET_CHANNELS = ['หน้าร้าน', 'HomePro', 'Power Buy', 'Lazada', 'Shopee', 'NocNoc', 'Central', 'BNB Home', 'Official Store'];
function AssetForm({ initial, onClose }) {
  const [f, set, setF] = useF({ model: '', listPrice: '', channel: '', note: '', sold: false, soldPrice: '', soldDate: TODAY_ISO, ...(initial || { name: '', kind: ASSET_KINDS[0], brand: '', price: '', bought: TODAY_ISO, store: '', serial: '', warranty: addMonths(TODAY_ISO, 12), paySrc: '' }) });
  const wYears = [1, 2, 3, 5, 10];
  const setWarrantyYears = (y) => setF(p => ({ ...p, warranty: addMonths(p.bought || TODAY_ISO, y * 12) }));
  const save = numv(f.listPrice) - numv(f.price);
  return <FormModal title={initial ? 'แก้ไขทรัพย์สิน' : 'เพิ่มของที่ซื้อ / ทรัพย์สิน'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpdate(() => {
      const { paySrc, ...a } = f; const item = { ...a, name: a.name.trim(), model: (a.model || '').trim(), price: numv(a.price), listPrice: numv(a.listPrice), soldPrice: a.sold ? numv(a.soldPrice) : 0, soldDate: a.sold ? a.soldDate : '' };
      const i = LOS_ASSETS.findIndex(x => x.id === item.id); if (i >= 0) LOS_ASSETS[i] = item; else LOS_ASSETS.push({ ...item, id: lid() });
      if (!initial && paySrc && item.price > 0) addTxn({ type: 'expense', amount: item.price, src: paySrc, cat: 'ช้อปปิ้ง', name: item.name, date: item.bought });
      if (!initial && item.warranty) LOS_DOCS.push({ id: lid(), name: 'ใบรับประกัน ' + item.name, type: 'ใบรับประกัน', expiry: item.warranty, rel: item.name });
    }, initial ? 'บันทึกแล้ว' : 'เพิ่มทรัพย์สินแล้ว')}
    onDelete={initial ? () => losRemove(LOS_ASSETS, initial.id, 'ลบทรัพย์สินแล้ว') : null}>
    <Field label="ชื่อ"><input value={f.name} onChange={set('name')} placeholder="เช่น เครื่องซักผ้าฝาหน้า" autoFocus={!initial} /></Field>
    <G2><Field label="ประเภท"><select value={f.kind} onChange={set('kind')}>{ASSET_KINDS.map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="แบรนด์"><input value={f.brand} onChange={set('brand')} placeholder="Electrolux" /></Field>
      <Field label="รุ่น / โมเดล"><input value={f.model} onChange={set('model')} placeholder="EWF8025CQWA 8 kg" /></Field>
      <Field label="ซีเรียล (S/N)"><input value={f.serial} onChange={set('serial')} /></Field>
      <Field label="ราคาที่จ่ายจริง"><input value={f.price} onChange={set('price')} inputMode="decimal" /></Field>
      <Field label="ราคาป้าย (ก่อนลด)"><input value={f.listPrice} onChange={set('listPrice')} inputMode="decimal" placeholder="ไม่บังคับ" /></Field></G2>
    {save > 0 && numv(f.price) > 0 && <div className="hint" style={{ margin: '-6px 2px 14px', color: 'var(--pos)' }}>ประหยัดได้ {money(save)} ({Math.round(save / numv(f.listPrice) * 100)}%)</div>}
    <G2><Field label="วันที่ซื้อ"><input type="date" value={f.bought} onChange={set('bought')} /></Field>
      <Field label="ช่องทาง"><input value={f.channel} onChange={set('channel')} list="asset-ch" placeholder="Lazada, HomePro" /><datalist id="asset-ch">{ASSET_CHANNELS.map(x => <option key={x} value={x} />)}</datalist></Field></G2>
    <Field label="ร้าน / ผู้ขาย"><input value={f.store} onChange={set('store')} placeholder="เช่น Electrolux Official Mall" /></Field>
    <Field label="ประกันถึงวันที่"><input type="date" value={f.warranty} onChange={set('warranty')} /></Field>
    <div className="chips" style={{ marginTop: -6, marginBottom: 14 }}>{wYears.map(y => <button type="button" key={y} className={'chip' + (f.warranty === addMonths(f.bought || TODAY_ISO, y * 12) ? ' on' : '')} onClick={() => setWarrantyYears(y)}>ประกัน {y} ปี</button>)}<button type="button" className={'chip' + (!f.warranty ? ' on' : '')} onClick={() => set('warranty')('')}>ไม่มี</button></div>
    <Field label="หมายเหตุ"><input value={f.note} onChange={set('note')} placeholder="เช่น เบอร์ศูนย์บริการ, ของแถม, เงื่อนไขประกัน" /></Field>
    {initial && <>
      <label className="check"><input type="checkbox" checked={!!f.sold} onChange={set('sold')} />ขาย / ปลดระวางแล้ว</label>
      {f.sold && <G2><Field label="ขายได้ (บาท)"><input value={f.soldPrice} onChange={set('soldPrice')} inputMode="decimal" placeholder="0 ถ้าทิ้ง/ให้" /></Field>
        <Field label="วันที่ขาย"><input type="date" value={f.soldDate} onChange={set('soldDate')} /></Field></G2>}
    </>}
    {!initial && <Field label="บันทึกเป็นรายจ่ายด้วย"><SrcSelect value={f.paySrc} onChange={set('paySrc')} none="ไม่ต้องบันทึก" /></Field>}
  </FormModal>;
}
function VehiclePick({ value, onChange }) { return <select value={value} onChange={onChange}>{LOS_VEHICLES.map(v => <option key={v.id} value={v.id}>{vehicleName(v)}</option>)}</select>; }
function FuelForm({ vid, onClose }) {
  const v0 = LOS_VEHICLES.find(v => v.id === vid) || LOS_VEHICLES[0];
  const [f, set] = useF({ vid: v0 ? v0.id : '', date: TODAY_ISO, mileage: v0 ? v0.mileage : '', liters: '', perL: '', total: '', src: firstAcc() });
  const total = numv(f.total) || Math.round(numv(f.liters) * numv(f.perL));
  if (!v0) return <Modal title="เติมน้ำมัน" onClose={onClose}><Empty text="ยังไม่มีรถ — เพิ่มรถในหน้ารถยนต์ก่อน" /></Modal>;
  return <FormModal title="บันทึกเติมน้ำมัน" onClose={onClose} valid={total > 0 && numv(f.mileage) > 0}
    onSave={() => losUpdate(() => {
      const v = LOS_VEHICLES.find(x => x.id === f.vid); const liters = numv(f.liters) || (numv(f.perL) ? total / numv(f.perL) : 0);
      LOS_FUEL.push({ id: lid(), vid: f.vid, date: f.date, mileage: numv(f.mileage), liters: Math.round(liters * 10) / 10, perL: numv(f.perL) || (liters ? Math.round(total / liters * 10) / 10 : 0), total });
      if (v && numv(f.mileage) > v.mileage) v.mileage = numv(f.mileage);
      if (f.src) addTxn({ type: 'expense', amount: total, src: f.src, cat: 'รถ', name: 'เติมน้ำมัน ' + (v ? v.model : ''), date: f.date });
    }, `บันทึกเติมน้ำมัน ${money(total)} แล้ว`)}>
    <Field label="รถ"><VehiclePick value={f.vid} onChange={set('vid')} /></Field>
    <G2><Field label="เลขไมล์ (กม.)"><input value={f.mileage} onChange={set('mileage')} inputMode="numeric" /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field>
      <Field label="ลิตร"><input value={f.liters} onChange={set('liters')} inputMode="decimal" /></Field>
      <Field label="ราคา/ลิตร"><input value={f.perL} onChange={set('perL')} inputMode="decimal" /></Field></G2>
    <Field label="ยอดรวม (บาท)"><input value={f.total} onChange={set('total')} inputMode="decimal" placeholder={total ? String(total) : '0'} /></Field>
    <Field label="จ่ายจาก"><SrcSelect value={f.src} onChange={set('src')} none="ไม่บันทึกรายจ่าย" /></Field>
  </FormModal>;
}
const SVC_CATS = [['ซ่อมบำรุง', 'wrench'], ['อะไหล่', 'box'], ['ภาษี/ทะเบียน', 'doc'], ['ล้าง/ดูแล', 'star'], ['อื่นๆ', 'more']];
const svcCat = (s) => s.cat || 'ซ่อมบำรุง';
const svcIcon = (s) => (SVC_CATS.find(c => c[0] === svcCat(s)) || [0, 'wrench'])[1];
const baht2 = (n) => window.__losHide ? '฿ •••' : '฿' + (+n || 0).toLocaleString('en-US', { minimumFractionDigits: Math.round((+n || 0) * 100) % 100 ? 2 : 0, maximumFractionDigits: 2 });
function ServiceForm({ vid, initial, onClose }) {
  const i = initial || {};
  const v0 = LOS_VEHICLES.find(v => v.id === (i.vid || vid)) || LOS_VEHICLES[0];
  const blank = () => ({ id: lid(), name: '', price: '', free: false });
  const [f, set, setF] = useF({ vid: v0 ? v0.id : '', cat: svcCat(i), name: i.name || '', date: i.date || TODAY_ISO, mileage: initial ? (i.mileage || '') : (v0 ? v0.mileage : ''), provider: i.provider || '', note: i.note || '', src: initial ? '' : firstAcc(),
    items: i.items && i.items.length ? i.items.map(it => ({ id: lid(), name: it.name, price: it.price ? String(it.price) : '', free: !it.price })) : [{ ...blank(), price: i.cost ? String(i.cost) : '' }] });
  if (!v0) return <Modal title="ซ่อมบำรุง" onClose={onClose}><Empty text="ยังไม่มีรถ — เพิ่มรถในหน้ารถยนต์ก่อน" /></Modal>;
  const setItem = (id, p) => setF(x => ({ ...x, items: x.items.map(it => it.id === id ? { ...it, ...p } : it) }));
  const total = Math.round(f.items.reduce((s, it) => s + (it.free ? 0 : numv(it.price)), 0) * 100) / 100;
  const hasVat = f.items.some(it => /vat/i.test(it.name));
  const addVat = () => { const sub = f.items.reduce((s, it) => s + (it.free ? 0 : numv(it.price)), 0); setF(x => ({ ...x, items: [...x.items, { id: lid(), name: 'VAT 7%', price: String(Math.round(sub * 7) / 100), free: false }] })); };
  const save = () => losUpdate(() => {
    const v = LOS_VEHICLES.find(x => x.id === f.vid);
    const items = f.items.filter(it => it.name.trim() || numv(it.price) || it.free).map(it => ({ name: it.name.trim() || 'รายการ', price: it.free ? 0 : numv(it.price) }));
    const rec = { id: i.id || lid(), vid: f.vid, cat: f.cat, name: f.name.trim(), date: f.date, mileage: numv(f.mileage), cost: total, provider: f.provider.trim(), note: f.note.trim(), items: items.length > 1 || (items[0] && items[0].name !== 'รายการ') ? items : [] };
    const k = LOS_SERVICE.findIndex(x => x.id === rec.id); if (k >= 0) LOS_SERVICE[k] = rec; else LOS_SERVICE.push(rec);
    if (v && numv(f.mileage) > v.mileage) v.mileage = numv(f.mileage);
    if (!initial && f.src && total > 0) addTxn({ type: 'expense', amount: total, src: f.src, cat: 'รถ', name: f.name.trim() + ' · ' + (v ? v.model : ''), date: f.date });
  }, initial ? 'บันทึกการแก้ไขแล้ว' : 'บันทึกค่าใช้จ่ายรถแล้ว');
  return <FormModal title={initial ? 'แก้ไขรายการรถ' : 'บันทึกซ่อมบำรุง / ค่าใช้จ่ายรถ'} onClose={onClose} valid={f.name.trim()} onSave={save}
    onDelete={initial ? () => losRemove(LOS_SERVICE, i.id, 'ลบประวัติแล้ว') : null}>
    <Field label="รถ"><VehiclePick value={f.vid} onChange={set('vid')} /></Field>
    <Field label="หมวด"><div className="chips">{SVC_CATS.map(([c]) => <button type="button" key={c} className={'chip' + (f.cat === c ? ' on' : '')} onClick={() => set('cat')(c)}>{c}</button>)}</div></Field>
    <Field label="หัวข้อ"><input value={f.name} onChange={set('name')} placeholder="เช็กระยะ 10,000 กม." autoFocus={!initial} /></Field>
    <G2><Field label="เลขไมล์ (ไม่บังคับ)"><input value={f.mileage} onChange={set('mileage')} inputMode="numeric" /></Field>
      <Field label="วันที่"><input type="date" value={f.date} onChange={set('date')} /></Field></G2>
    <Field label="ร้าน / ศูนย์"><input value={f.provider} onChange={set('provider')} placeholder="ไม่บังคับ" /></Field>
    <Field label="รายการย่อย">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {f.items.map((it, k) => (
          <div key={it.id} className="field svc-item">
            <input style={{ flex: 1, minWidth: 0 }} value={it.name} onChange={e => setItem(it.id, { name: e.target.value })} placeholder={k ? 'เช่น กรองน้ำมันเครื่อง' : 'เช่น น้ำมันเครื่อง 7 ลิตร'} />
            {it.free ? <span className="svc-free">ฟรี</span> : <input className="num" style={{ width: 96 }} value={it.price} onChange={e => setItem(it.id, { price: e.target.value })} inputMode="decimal" placeholder="0" />}
            <button type="button" className={'chip' + (it.free ? ' on' : '')} onClick={() => setItem(it.id, { free: !it.free })}>ฟรี</button>
            {f.items.length > 1 && <button type="button" className="btn icon-btn" aria-label="ลบรายการ" onClick={() => setF(x => ({ ...x, items: x.items.filter(y => y.id !== it.id) }))}><LIcon name="x" size={14} /></button>}
          </div>))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="btn btn-sm" onClick={() => setF(x => ({ ...x, items: [...x.items, blank()] }))}><LIcon name="plus" size={14} />เพิ่มรายการ</button>
          {!hasVat && <button type="button" className="btn btn-sm" onClick={addVat}>+ VAT 7%</button>}
          <span style={{ marginLeft: 'auto', fontSize: 14 }}>รวม <b className="num" style={{ fontSize: 18 }}>{baht2(total)}</b></span>
        </div>
      </div>
    </Field>
    <Field label="หมายเหตุ"><textarea rows={2} value={f.note} onChange={set('note')} placeholder="ไม่บังคับ" style={{ resize: 'vertical' }} /></Field>
    {!initial && <Field label="จ่ายจาก"><SrcSelect value={f.src} onChange={set('src')} none="ไม่บันทึกรายจ่าย" /></Field>}
  </FormModal>;
}
function TaskForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', due: TODAY_ISO, pri: 'กลาง', rel: '', done: false });
  return <FormModal title={initial ? 'แก้ไขงาน' : 'เพิ่มงาน / เตือนความจำ'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpsert(LOS_TASKS, { ...f, name: f.name.trim() }, 'บันทึกงานแล้ว')} onDelete={initial ? () => losRemove(LOS_TASKS, initial.id, 'ลบงานแล้ว') : null}>
    <Field label="งาน"><input value={f.name} onChange={set('name')} placeholder="นัดช่างล้างแอร์" autoFocus /></Field>
    <G2><Field label="กำหนด"><input type="date" value={f.due} onChange={set('due')} /></Field>
      <Field label="ความสำคัญ"><select value={f.pri} onChange={set('pri')}>{['สูง', 'กลาง', 'ต่ำ'].map(x => <option key={x}>{x}</option>)}</select></Field></G2>
    <Field label="เกี่ยวกับ"><input value={f.rel} onChange={set('rel')} placeholder="ไม่บังคับ" /></Field>
  </FormModal>;
}
function DocForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', type: DOC_TYPES[0], expiry: '', rel: '' });
  return <FormModal title={initial ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสาร'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpsert(LOS_DOCS, { ...f, name: f.name.trim() }, 'บันทึกเอกสารแล้ว')} onDelete={initial ? () => losRemove(LOS_DOCS, initial.id, 'ลบเอกสารแล้ว') : null}>
    <Field label="ชื่อเอกสาร"><input value={f.name} onChange={set('name')} placeholder="บัตรประชาชน" autoFocus /></Field>
    <G2><Field label="ประเภท"><select value={f.type} onChange={set('type')}>{DOC_TYPES.map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="หมดอายุ"><input type="date" value={f.expiry} onChange={set('expiry')} /></Field></G2>
    <Field label="เกี่ยวกับ"><input value={f.rel} onChange={set('rel')} placeholder="เช่น Toyota Yaris" /></Field>
  </FormModal>;
}
function HomeTaskForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: '', every: 'ทุก 6 เดือน', next: addMonths(TODAY_ISO, 1), last: '', cost: '' });
  return <FormModal title={initial ? 'แก้ไขงานดูแลบ้าน' : 'เพิ่มงานดูแลบ้าน'} onClose={onClose} valid={f.name.trim()}
    onSave={() => losUpsert(LOS_HOME_TASKS, { ...f, name: f.name.trim(), cost: numv(f.cost) }, 'บันทึกแล้ว')} onDelete={initial ? () => losRemove(LOS_HOME_TASKS, initial.id, 'ลบแล้ว') : null}>
    <Field label="งาน"><input value={f.name} onChange={set('name')} placeholder="ล้างแอร์" autoFocus /></Field>
    <G2><Field label="ทำทุก"><select value={f.every} onChange={set('every')}>{['ทุก 3 เดือน', 'ทุก 6 เดือน', 'ทุกปี'].map(x => <option key={x}>{x}</option>)}</select></Field>
      <Field label="ครั้งถัดไป"><input type="date" value={f.next} onChange={set('next')} /></Field></G2>
    <Field label="ค่าใช้จ่ายโดยประมาณ"><input value={f.cost} onChange={set('cost')} inputMode="decimal" /></Field>
  </FormModal>;
}
function IncomeForm({ initial, onClose }) {
  const [f, set] = useF(initial || { name: 'เงินเดือน', amount: '', day: 25, account: firstAcc() });
  return <FormModal title={initial ? 'แก้ไขรายรับประจำ' : 'เพิ่มรายรับประจำ'} onClose={onClose} valid={f.name.trim() && numv(f.amount) > 0}
    onSave={() => losUpsert(LOS_INCOME, { ...f, amount: numv(f.amount), day: Math.min(31, Math.max(1, numv(f.day))) }, 'บันทึกแล้ว')} onDelete={initial ? () => losRemove(LOS_INCOME, initial.id, 'ลบแล้ว') : null}>
    <Field label="ชื่อ"><input value={f.name} onChange={set('name')} /></Field>
    <G2><Field label="จำนวน"><input value={f.amount} onChange={set('amount')} inputMode="decimal" /></Field>
      <Field label="เข้าทุกวันที่"><input value={f.day} onChange={set('day')} inputMode="numeric" /></Field></G2>
    <Field label="เข้าบัญชี"><SrcSelect value={f.account} onChange={set('account')} cards={false} /></Field>
  </FormModal>;
}
function QuickAdd({ onClose }) {
  const kinds = [['expense', 'รายจ่าย', 'card'], ['income', 'รายรับ', 'money'], ['slips', 'อ่านสลิปโอนเงิน', 'slip'], ['transfer', 'โอนเงินระหว่างบัญชี', 'swap'], ['asset', 'ซื้อของ / ทรัพย์สิน', 'box'], ['fuel', 'เติมน้ำมัน', 'fuel'], ['service', 'ซ่อม / ค่าใช้จ่ายรถ', 'wrench'], ['bill', 'บิล / ค่าใช้จ่ายประจำ', 'clock'], ['sub', 'สมาชิกรายเดือน', 'clock'], ['plan', 'ผ่อน 0%', 'card'], ['trip', 'ทริปใหม่ (หารกับเพื่อน)', 'trip'], ['project', 'โครงการต่อเติม / ก่อสร้าง', 'hammer'], ['task', 'งาน / เตือนความจำ', 'check'], ['doc', 'เอกสาร', 'doc']];
  return <Modal title="เพิ่มรายการ" onClose={onClose}>
    <div className="qa-grid">{kinds.map(([k, l, ic]) => (
      <button key={k} className="qa-item" onClick={() => { onClose(); setTimeout(() => losOpen(k === 'income' ? 'txn' : k === 'expense' ? 'txn' : k, k === 'income' ? { type: 'income' } : {}), 0); }}>
        <span className="ic"><LIcon name={ic} size={18} color="var(--ink-soft)" /></span><span>{l}</span>
      </button>))}</div>
  </Modal>;
}
const LOS_FORMS = { account: AccountForm, card: CardForm, payCard: PayCardModal, transfer: TransferForm, txn: TxnForm, bill: BillForm, sub: SubForm, plan: PlanForm, asset: AssetForm, fuel: FuelForm, service: ServiceForm, task: TaskForm, doc: DocForm, homeTask: HomeTaskForm, income: IncomeForm, quick: QuickAdd };
function FormHost() {
  const [cur, setCur] = React.useState(null);
  React.useEffect(() => { const f = (x) => setCur(x); formSubs.add(f); return () => formSubs.delete(f); }, []);
  if (!cur) return null;
  const C = LOS_FORMS[cur.kind] || window[cur.kind];
  return C ? <C key={cur.t} {...cur.props} onClose={() => setCur(null)} /> : null;
}
Object.assign(window, { SVC_CATS, svcCat, svcIcon, baht2, FormHost, LOS_FORMS, QuickAdd, useF, numv, FormModal, SrcSelect, BankSelect, G2 });
