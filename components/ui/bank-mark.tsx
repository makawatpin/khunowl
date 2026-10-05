import { bankBadge } from "@/lib/domain/banks";

export function BankMark({ bank, size = 38 }: { bank: string | null | undefined; size?: number }) {
  const m = bankBadge(bank);
  const len = m.short.length;
  return (
    <span
      className="ic"
      style={{
        width: size,
        height: size,
        background: m.bg,
        color: m.fg,
        fontWeight: 700,
        fontSize: len > 2 ? size * 0.3 : len > 1 ? size * 0.36 : size * 0.46,
        lineHeight: 1,
        letterSpacing: len > 2 ? "-.02em" : 0,
        textAlign: "center",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {m.short}
    </span>
  );
}
