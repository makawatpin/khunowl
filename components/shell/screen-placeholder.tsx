export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <div className="card card-pad">
      <div className="cap">ยังไม่พร้อมใช้งาน</div>
      <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
        หน้า &ldquo;{title}&rdquo; จะถูกสร้างในขั้นถัดไปของ README §10
      </p>
    </div>
  );
}
