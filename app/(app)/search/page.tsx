import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { todayISOInBangkok } from "@/lib/dates/today";
import { searchAll } from "@/lib/server/search";
import { Icon, type IconName } from "@/components/ui/icon";

const KIND_ICON: Record<string, IconName> = {
  "ทรัพย์สิน": "box", "บิล": "clock", "สมาชิกรายเดือน": "clock", "เอกสาร": "doc",
  "ประวัติรถ": "wrench", "รถ": "car", "ดูแลบ้าน": "house", "งาน": "check",
  "บัญชี": "money", "บัตรเครดิต": "card", "รายการเงิน": "money",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const todayISO = todayISOInBangkok();
  const results = await searchAll(supabase, q, todayISO);
  const groups = [...new Set(results.map((r) => r.kind))];

  if (!q.trim()) {
    return <div className="empty">พิมพ์เพื่อค้นหาบัญชี รายการเงิน ทรัพย์สิน บิล เอกสาร ประวัติรถ และงาน</div>;
  }
  if (!results.length) {
    return <div className="empty">ไม่พบ &ldquo;{q}&rdquo;</div>;
  }

  return (
    <>
      {groups.map((g) => (
        <div key={g}>
          <div className="sec"><h2>{g} ({results.filter((r) => r.kind === g).length})</h2></div>
          <div className="card list">
            {results
              .filter((r) => r.kind === g)
              .slice(0, 20)
              .map((r, i) => (
                <Link key={i} href={r.href} className="row rowlink">
                  <span className="ic"><Icon name={KIND_ICON[r.kind] ?? "doc"} size={17} color="var(--ink-soft)" /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="row-t">{r.title}</span>
                    {r.sub && <span className="row-s">{r.sub}</span>}
                  </span>
                  <Icon name="arrow" size={15} color="var(--ink-faint)" />
                </Link>
              ))}
          </div>
        </div>
      ))}
    </>
  );
}
