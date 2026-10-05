"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BankMark } from "@/components/ui/bank-mark";
import { Icon } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { AccountForm, type AccountFormInitial } from "@/components/forms/account-form";
import { togglePinAccount } from "@/lib/actions/accounts";
import { ACCOUNT_TYPE_LABEL } from "@/lib/i18n/th";
import type { Database } from "@/lib/db.types";

export interface AccountListItem {
  id: string;
  name: string;
  bank: string | null;
  type: Database["public"]["Enums"]["account_type"];
  last4: string | null;
  balance: number;
  pinned: boolean;
}

const LIMIT = 4;

export function AccountList({ accounts }: { accounts: AccountListItem[] }) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [openForm, setOpenForm] = useState<"new" | AccountFormInitial | null>(null);

  const sorted = useMemo(() => [...accounts].sort((a, b) => Number(b.pinned) - Number(a.pinned)), [accounts]);
  const shown = editMode || showAll || sorted.length <= LIMIT + 1 ? sorted : sorted.slice(0, LIMIT);
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  const togglePin = async (id: string, pinned: boolean) => {
    await togglePinAccount(id, !pinned);
    router.refresh();
  };

  return (
    <>
      <div className="sec">
        <h2>บัญชี</h2>
        <span className="num acct-total"><Money value={total} /></span>
        <span className="acct-acts">
          {accounts.length > 1 && (
            <button className="more" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "เสร็จ" : "จัดเรียง"}
            </button>
          )}
          <button className="more" onClick={() => setOpenForm("new")}>+ เพิ่ม</button>
        </span>
      </div>
      <div className="card list acct-list">
        {shown.map((a) => (
          <div className="acct-row" key={a.id}>
            <button className="acct-main" onClick={() => !editMode && setOpenForm(toInitial(a))}>
              <BankMark bank={a.bank} size={38} />
              <span className="acct-name">
                <span className="row-t">{a.name}</span>
                <span className="row-s">
                  {ACCOUNT_TYPE_LABEL[a.type]}
                  {a.last4 ? ` · •••• ${a.last4}` : ""}
                </span>
              </span>
              <span className="acct-amt">
                <Money value={a.balance} />
              </span>
            </button>
            {editMode && (
              <span className="acct-edit">
                <button className={"pin" + (a.pinned ? " on" : "")} onClick={() => togglePin(a.id, a.pinned)} aria-label="ปักหมุด">
                  <Icon name="star" size={16} />
                </button>
              </span>
            )}
          </div>
        ))}
        {!editMode && sorted.length > LIMIT + 1 && (
          <button className="acct-more" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "ย่อรายการ" : `ดูทั้งหมด (${sorted.length})`}
          </button>
        )}
        {!accounts.length && <div className="empty">ยังไม่มีบัญชี</div>}
      </div>
      {openForm === "new" && <AccountForm onClose={() => setOpenForm(null)} />}
      {openForm && openForm !== "new" && <AccountForm initial={openForm} onClose={() => setOpenForm(null)} />}
    </>
  );
}

function toInitial(a: AccountListItem): AccountFormInitial {
  return { id: a.id, name: a.name, bank: a.bank, type: a.type, balance: a.balance, last4: a.last4 };
}
