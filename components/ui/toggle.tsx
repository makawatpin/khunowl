"use client";

export function Toggle({
  on,
  onChange,
  label,
  sub,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <div className="row" style={{ cursor: "pointer" }} onClick={() => onChange(!on)} role="switch" aria-checked={on} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(!on); } }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="row-t">{label}</span>
        {sub && <span className="row-s">{sub}</span>}
      </span>
      <span className={"switch" + (on ? " on" : "")}>
        <i />
      </span>
    </div>
  );
}
