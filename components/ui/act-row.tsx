"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { Money } from "@/components/ui/money";
import { dueLabel } from "@/lib/domain/dates";
import { todayISOInBangkok } from "@/lib/dates/today";

/** Ported from design-reference/lifeos-money.jsx (ActRow): an upcoming-payment row
 * with an optional due badge and action button (pay bill / pay card). */
export function ActRow({
  icon = "card",
  title,
  sub,
  amount,
  due,
  btn,
  onBtn,
  onClick,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  amount?: number;
  due?: string | null;
  btn?: string;
  onBtn?: () => void;
  onClick?: () => void;
}) {
  const todayISO = todayISOInBangkok();
  const d = due ? dueLabel(due, todayISO) : null;
  // A row can have both an onClick (open edit form) and a nested action button
  // (pay now) — an HTML <button> can't contain another <button>, so the row
  // itself is only ever a real <button> when there's no nested action button.
  const Tag = onClick && !btn ? "button" : "div";
  const interactiveProps =
    onClick && btn
      ? {
          role: "button" as const,
          tabIndex: 0,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          },
        }
      : {};
  return (
    <Tag className={"row" + (onClick ? " rowlink" : "")} onClick={onClick} {...interactiveProps}>
      <span className="ic">
        <Icon name={icon} size={17} color="var(--ink-soft)" />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span className="row-t">{title}</span>
        {sub && <span className="row-s">{sub}</span>}
      </span>
      <span style={{ textAlign: "right", flexShrink: 0 }}>
        {amount != null && (
          <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>
            <Money value={amount} />
          </span>
        )}
        {d && <span className={"badge " + d.tone}>{d.text}</span>}
      </span>
      {btn && (
        <button
          className="btn btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onBtn?.();
          }}
        >
          {btn}
        </button>
      )}
    </Tag>
  );
}
