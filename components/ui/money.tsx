"use client";

import { formatMoney } from "@/lib/format/money";
import { usePrefs } from "@/components/providers/prefs-provider";

export function Money({ value, className, style }: { value: number | null | undefined; className?: string; style?: React.CSSProperties }) {
  const { hide } = usePrefs();
  return (
    <span className={"num " + (className ?? "")} style={style}>
      {formatMoney(value, hide)}
    </span>
  );
}
