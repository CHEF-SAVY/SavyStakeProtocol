"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={styles.nav}>
      <div className={styles.leftBrace} />
      {pathname !== "/" && (
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← RETREAT
        </button>
      )}

      <div className={styles.logo}>
        <div className={styles.logoWings}>
          <span className={styles.wing}>╱</span>
          <div className={styles.logoCore}>
            <span className={styles.logoText}>SAVY</span>
            <span className={styles.logoDivider}>✦</span>
            <span className={styles.logoText}>STAKE</span>
          </div>
          <span className={styles.wing}>╲</span>
        </div>
        <span className={styles.logoSub}>SURVEY CORPS PROTOCOL</span>
      </div>

      <div className={styles.links}>
        {[
          { href: "/", label: "WALLS" },
          { href: "/dashboard", label: "DEPLOY" },
          { href: "/stakes", label: "REGIMENT" },
          { href: "/admin", label: "COMMAND" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${pathname === href ? styles.active : ""}`}
          >
            {pathname === href && <span className={styles.activeMark}>▶</span>}
            {label}
          </Link>
        ))}
      </div>

      <div className={styles.connectWrapper}>
        <ConnectButton />
      </div>

      <div className={styles.rightBrace} />
    </nav>
  );
}
