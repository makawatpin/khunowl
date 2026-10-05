"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { processDueForCurrentUser } from "@/lib/actions/process-due";
import { useToast } from "@/components/providers/toast-provider";

/** Fires once per app mount (README §5 "เรียกซ้ำตอนเปิดแอปได้"), not on every route change —
 * AppShell stays mounted across client-side navigation within the (app) route group. */
export function ProcessDueTrigger() {
  const router = useRouter();
  const { show } = useToast();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    processDueForCurrentUser()
      .then((result) => {
        const n = result.billsProcessed + result.subsProcessed;
        if (n > 0) {
          router.refresh();
          show(`ตัดบิล/สมาชิกอัตโนมัติ ${n} รายการ`);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
