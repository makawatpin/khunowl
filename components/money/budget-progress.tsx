import { Money } from "@/components/ui/money";
import { categoryColor } from "@/lib/domain/categories";

export interface BudgetRow {
  category: string;
  spent: number;
  limit: number | null;
}

export function BudgetProgress({ rows }: { rows: BudgetRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    const r = (x: BudgetRow) => (x.limit ? x.spent / x.limit : -1);
    return r(b) - r(a);
  });

  if (!sorted.length) return <div className="card card-pad empty">ยังไม่ได้ตั้งงบ</div>;

  return (
    <div className="card card-pad">
      {sorted.map((r, i) => {
        const cc = categoryColor(r.category);
        const ratio = r.limit ? r.spent / r.limit : 0.02;
        const over = r.limit != null && r.spent > r.limit;
        const near = r.limit != null && r.spent > r.limit * 0.85;
        return (
          <div key={r.category} style={{ marginTop: i ? 16 : 0 }}>
            <div style={{ display: "flex", fontSize: 14, marginBottom: 6, gap: 8 }}>
              <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {cc && <i className="cat-dot" style={{ background: cc.bar }} />}
                {r.category}
              </span>
              <span className="num" style={{ color: over ? "var(--neg)" : near ? "#B8762A" : "var(--ink-soft)" }}>
                <Money value={r.spent} />
                {r.limit ? (
                  <>
                    {" / "}
                    <Money value={r.limit} />
                  </>
                ) : null}
              </span>
              {r.limit ? (
                <span className={"badge " + (over ? "red" : near ? "amber" : "")} style={{ minWidth: 52, textAlign: "center" }}>
                  {over ? <>เกิน <Money value={r.spent - r.limit} /></> : `${Math.round((r.spent / r.limit) * 100)}%`}
                </span>
              ) : null}
            </div>
            <div className="bar">
              <i style={{ width: `${Math.min(100, ratio * 100)}%`, background: cc && !near ? cc.bar : undefined }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
