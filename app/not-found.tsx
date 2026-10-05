import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 80 }}>
      <p>ไม่พบหน้านี้</p>
      <Link href="/" className="btn btn-primary">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
