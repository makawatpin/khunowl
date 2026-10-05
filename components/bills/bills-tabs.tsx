"use client";

import { useState } from "react";
import { BillsTab, type BillItem } from "@/components/bills/bills-tab";
import { SubsTab, type SubItem } from "@/components/bills/subs-tab";
import { CardsTab } from "@/components/bills/cards-tab";
import type { CardListItem } from "@/components/money/card-list";

type TabId = "bills" | "subs" | "cards";
const TABS: { id: TabId; label: string }[] = [
  { id: "bills", label: "บิล" },
  { id: "subs", label: "สมาชิก" },
  { id: "cards", label: "บัตรเครดิต" },
];

export function BillsTabs({
  bills,
  subs,
  cards,
  accounts,
  cardRefs,
}: {
  bills: BillItem[];
  subs: SubItem[];
  cards: CardListItem[];
  accounts: { id: string; name: string }[];
  cardRefs: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<TabId>("bills");
  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "bills" && <BillsTab bills={bills} accounts={accounts} />}
      {tab === "subs" && <SubsTab subs={subs} accounts={accounts} cards={cardRefs} />}
      {tab === "cards" && <CardsTab cards={cards} accounts={accounts} />}
    </>
  );
}
