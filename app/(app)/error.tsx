"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="empty" role="alert">
      <p>เกิดข้อผิดพลาด</p>
      <button className="btn btn-primary" onClick={reset}>
        ลองใหม่
      </button>
    </div>
  );
}
