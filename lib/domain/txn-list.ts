// Row shape shared by the /money page (first page, server-rendered) and the "load more" action.

export interface TxnListItem {
  id: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  date: string;
  name: string;
  category: string | null;
  note: string | null;
  srcId: string | null; // account or card id
  srcKind: "account" | "card" | null;
  toId: string | null; // account or card id (transfer only)
  toKind: "account" | "card" | null;
}

/** Keyset cursor: the last row of a page (ordered date desc, id desc). */
export interface TxnCursor {
  date: string;
  id: string;
}

export const TXN_PAGE_SIZE = 200;
export const TXN_LIST_COLUMNS = "id, type, amount, date, name, category, note, src_account_id, src_card_id, to_account_id, to_card_id";

export interface TxnRow {
  id: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  date: string;
  name: string;
  category: string | null;
  note: string | null;
  src_account_id: string | null;
  src_card_id: string | null;
  to_account_id: string | null;
  to_card_id: string | null;
}

export function toTxnListItem(t: TxnRow): TxnListItem {
  return {
    id: t.id, type: t.type, amount: t.amount, date: t.date, name: t.name, category: t.category, note: t.note,
    srcId: t.src_account_id ?? t.src_card_id, srcKind: t.src_account_id ? "account" : t.src_card_id ? "card" : null,
    toId: t.to_account_id ?? t.to_card_id, toKind: t.to_account_id ? "account" : t.to_card_id ? "card" : null,
  };
}

/** Cursor for the next page, or null when this page was the last one. */
export function nextTxnCursor(rows: { date: string; id: string }[], pageSize = TXN_PAGE_SIZE): TxnCursor | null {
  if (rows.length < pageSize) return null;
  const last = rows[rows.length - 1];
  return { date: last.date, id: last.id };
}
