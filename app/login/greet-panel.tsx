import Image from "next/image";
import styles from "./login.module.css";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "สวัสดีตอนเช้า";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

export function GreetPanel() {
  return (
    <section className={styles.panel}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
      <div className={`${styles.orb} ${styles.orb3}`} />
      <div className={styles.brand}>
        <Image className={styles.brandIcon} src="/icons/icon-192.png" alt="" width={34} height={34} />
        KhunOwl
      </div>
      <div className={styles.greet}>
        <div className={styles.gtime}>MheeTang Life OS</div>
        <div className={styles.gname}>{greeting()}</div>
        <div className={styles.gq}>วันนี้มีงานอะไรบ้าง?</div>
      </div>
      <div className={styles.chips}>
        <div className={styles.chip}>
          <i style={{ background: "#FF8A63" }} />
          บิลใกล้ครบกำหนด
        </div>
        <div className={styles.chip}>
          <i style={{ background: "#F2658A" }} />
          เช็กระยะรถ
        </div>
        <div className={styles.chip}>
          <i style={{ background: "#8FD3B6" }} />
          ทริปที่กำลังจะถึง
        </div>
      </div>
      <div className={styles.foot}>ข้อมูลการเงิน ทรัพย์สิน รถ และบ้านของคุณ ในที่เดียว</div>
    </section>
  );
}
