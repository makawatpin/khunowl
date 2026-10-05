"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { listTransactionsPage } from "@/lib/actions/transactions";
import type { TxnCursor, TxnListItem } from "@/lib/domain/txn-list";
import { Money } from "@/components/ui/money";
import { categoryColor } from "@/lib/domain/categories";
import { dShort } from "@/lib/format/date";
import { daysTo } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";
import { TransactionForm, type TransactionFormInitial } from "@/components/forms/transaction-form";
import { TransferEditForm } from "@/components/forms/transfer-edit-form";

export type { TxnListItem };

const CAT_ICON: Record<string, IconName> = {
  "อาหาร": "food", "เดินทาง": "car", "ช้อปปิ้ง": "box", "บ้าน": "house",
  "บิล/ค่าน้ำไฟ": "clock", "บันเทิง": "star", "สุขภาพ": "shield", "รถ": "fuel",
  "โอน": "swap", "ชำระบัตร": "card",
};

type Filter = "all" | "expense" | "income" | "transfer";

export function TransactionList({
  transactions,
  nextCursor,
  sourceNames,
  accounts,
  cards,
}: {
  transactions: TxnListItem[];
  /** Cursor for the page after `transactions` (null = everything is already loaded). */
  nextCursor: TxnCursor | null;
  sourceNames: Record<string, string>;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
}) {
  const todayISO = todayISOInBangkok();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [editing, setEditing] = useState<TxnListItem | null>(null);
  // Older pages fetched via "โหลดเพิ่ม". Reset whenever the server-rendered first page changes
  // (router.refresh after an edit) so edited/deleted rows can't linger from a stale older page.
  const [older, setOlder] = useState<TxnListItem[]>([]);
  const [cursor, setCursor] = useState<TxnCursor | null>(nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    setOlder([]);
    setCursor(nextCursor);
  }, [transactions, nextCursor]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const res = await listTransactionsPage(cursor);
    setLoadingMore(false);
    if (res.error) return;
    setOlder((prev) => [...prev, ...res.rows]);
    setCursor(res.next);
  };

  const allSources = useMemo(() => [...accounts, ...cards], [accounts, cards]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions, ...older]
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) => !account || t.srcId === account || t.toId === account)
      .filter((t) => !q || [t.name, t.category, t.note].some((x) => (x ?? "").toLowerCase().includes(q)))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [transactions, older, filter, account, query]);

  const visible = showMore ? filtered : filtered.slice(0, 8);
  const groups = groupByDay(visible);

  const clearFilters = () => {
    setQuery("");
    setAccount("");
    setFilter("all");
  };

  return (
    <>
      <div className="tx-filter">
        <div className="searchbox">
          <Icon name="search" size={15} color="var(--ink-faint)" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหารายการ" />
          {query && (
            <button className="tx-clear" onClick={() => setQuery("")} aria-label="ล้าง">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <select value={account} onChange={(e) => setAccount(e.target.value)} aria-label="กรองตามบัญชี">
          <option value="">ทุกบัญชี/บัตร</option>
          {allSources.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div className="chips" style={{ marginBottom: 10 }}>
        {([
          ["all", "ทั้งหมด"],
          ["expense", "รายจ่าย"],
          ["income", "รายรับ"],
          ["transfer", "โอน"],
        ] as const).map(([k, l]) => (
          <button key={k} className={"chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="card list">
        {groups.length ? (
          groups.map((g) => (
            <div key={g.date} className="day-grp">
              <div className="day-head">
                <span>{dayLabel(g.date, todayISO)}</span>
                {g.net !== 0 && (
                  <span className="num" style={{ color: g.net > 0 ? "var(--pos)" : "var(--ink-soft)" }}>
                    {g.net > 0 ? "+" : "−"}
                    <Money value={Math.abs(g.net)} />
                  </span>
                )}
              </div>
              {g.items.map((t) => (
                <TxnRow key={t.id} t={t} sourceNames={sourceNames} onClick={() => setEditing(t)} />
              ))}
            </div>
          ))
        ) : query || account ? (
          <div className="empty">
            <span>ไม่พบรายการที่ตรงกับตัวกรอง</span>
            <button className="btn btn-sm" onClick={clearFilters}>ล้างตัวกรอง</button>
          </div>
        ) : (
          <div className="empty">ยังไม่มีรายการ</div>
        )}
        {filtered.length > 8 && (
          <button
            className="row rowlink"
            style={{ justifyContent: "center", color: "var(--accent-deep)", fontSize: 13.5 }}
            onClick={() => setShowMore((v) => !v)}
          >
            {showMore ? "ย่อ" : `ดูทั้งหมด ${filtered.length}${cursor ? "+" : ""} รายการ`}
          </button>
        )}
        {cursor && (showMore || filtered.length <= 8) && (
          <button
            className="row rowlink"
            style={{ justifyContent: "center", color: "var(--accent-deep)", fontSize: 13.5 }}
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "กำลังโหลด…" : "โหลดรายการเก่ากว่านี้"}
          </button>
        )}
      </div>
      {editing?.type === "transfer" && <TransferEditForm txn={editing} accounts={accounts} onClose={() => setEditing(null)} />}
      {editing && editing.type !== "transfer" && (
        <TransactionForm initial={toFormInitial(editing)} accounts={accounts} cards={cards} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function toFormInitial(t: TxnListItem): TransactionFormInitial {
  return {
    id: t.id, type: t.type as "expense" | "income", amount: t.amount, category: t.category,
    name: t.name, date: t.date, note: t.note, source: t.srcId ?? "", sourceKind: t.srcKind ?? "account",
  };
}

function dayLabel(iso: string, todayISO: string): string {
  const n = daysTo(iso, todayISO);
  if (n === 0) return "วันนี้";
  if (n === -1) return "เมื่อวาน";
  return dShort(iso, todayISO);
}

function groupByDay(items: TxnListItem[]) {
  const groups: { date: string; items: TxnListItem[]; net: number }[] = [];
  for (const t of items) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== t.date) {
      g = { date: t.date, items: [], net: 0 };
      groups.push(g);
    }
    g.items.push(t);
    g.net += t.type === "income" ? t.amount : t.type === "expense" ? -t.amount : 0;
  }
  return groups;
}

function TxnRow({ t, sourceNames, onClick }: { t: TxnListItem; sourceNames: Record<string, string>; onClick: () => void }) {
  const isIncome = t.type === "income";
  const isTransfer = t.type === "transfer";
  const cc = !isIncome && !isTransfer ? categoryColor(t.category) : null;
  const icon = CAT_ICON[t.category ?? ""] || (isIncome ? "money" : "card");
  const tone = isIncome ? "pos" : isTransfer ? "accent" : null;
  return (
    <button className="row rowlink" onClick={onClick}>
      <span className="ic" style={cc ? { background: cc.bg } : tone ? { background: `var(--${tone}-soft)` } : undefined}>
        <Icon name={icon} size={17} color={cc ? cc.fg : tone ? `var(--${tone})` : "var(--ink-soft)"} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{t.name}</span>
        <span className="row-s">
          {dShort(t.date)} ·{" "}
          {isTransfer
            ? `${sourceNames[t.srcId ?? ""] ?? "—"} → ${sourceNames[t.toId ?? ""] ?? "—"}`
            : `${t.category ?? ""} · ${sourceNames[t.srcId ?? ""] ?? "—"}`}
        </span>
      </span>
      <span className="num" style={{ color: isIncome ? "var(--pos)" : isTransfer ? "var(--ink-soft)" : "var(--ink)" }}>
        {isIncome ? "+" : isTransfer ? "" : "−"}
        <Money value={t.amount} />
      </span>
    </button>
  );
}
