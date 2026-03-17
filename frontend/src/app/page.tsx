"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.fogLayer1} />
      <div className={styles.fogLayer2} />

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.missionTag}>
            <span className={styles.missionLine} />
            <span className={styles.missionText}>
              MISSION BRIEFING — SEPOLIA TESTNET
            </span>
            <span className={styles.missionLine} />
          </div>

          <h1 className={styles.heroTitle}>
            STAKE YOUR
            <br />
            <span className={styles.heroAccent}>FREEDOM</span>
          </h1>

          <p className={styles.heroSub}>
            Beyond the walls lies opportunity. Lock your SVX tokens with the
            Survey Corps Protocol and earn RewardX — the further you push, the
            greater the return.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/dashboard" className={styles.ctaPrimary}>
              <span className={styles.ctaCorner}>╔</span>
              DEPLOY ASSETS
              <span className={styles.ctaArrow}>→</span>
              <span className={styles.ctaCorner}>╝</span>
            </Link>
            <Link href="/stakes" className={styles.ctaSecondary}>
              VIEW REGIMENT
            </Link>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.emblemOuter}>
            <div className={styles.emblemInner}>
              <div className={styles.emblemCore}>
                <span className={styles.emblemWings}>⟨ ✦ ⟩</span>
                <span className={styles.emblemLabel}>
                  SURVEY
                  <br />
                  CORPS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>◈ INTELLIGENCE REPORT ◈</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.statsRow}>
        {[
          {
            label: "Total Value Locked",
            value: "—",
            unit: "SVX",
            prefix: "01",
          },
          {
            label: "Total Operators",
            value: "—",
            unit: "wallets",
            prefix: "02",
          },
          {
            label: "Rewards Distributed",
            value: "—",
            unit: "RWDX",
            prefix: "03",
          },
          { label: "Active Sectors", value: "4", unit: "pools", prefix: "04" },
        ].map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statPrefix}>{stat.prefix}</span>
            <span className={styles.statLabel}>{stat.label}</span>
            <div className={styles.statValue}>
              {stat.value}
              <span className={styles.statUnit}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.poolsSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>[ SECTOR MAP ]</span>
          <h2 className={styles.sectionTitle}>DEPLOYMENT ZONES</h2>
          <p className={styles.sectionSub}>
            Choose your lock period. The deeper you go, the higher the yield.
          </p>
        </div>

        <div className={styles.poolsGrid}>
          {[
            {
              id: 0,
              label: "5 Minutes",
              apr: "10%",
              color: "#00f5a0",
              threat: "LOW RISK",
              code: "ALPHA",
            },
            {
              id: 1,
              label: "10 Minutes",
              apr: "25%",
              color: "#00b4ff",
              threat: "MODERATE",
              code: "BETA",
            },
            {
              id: 2,
              label: "1 Hour",
              apr: "50%",
              color: "#9945ff",
              threat: "HIGH RISK",
              code: "GAMMA",
            },
            {
              id: 3,
              label: "1 Day",
              apr: "100%",
              color: "#ff2d7a",
              threat: "TITAN ZONE",
              code: "OMEGA",
            },
          ].map((pool) => (
            <div
              key={pool.id}
              className={styles.poolCard}
              style={{ "--pool-color": pool.color } as React.CSSProperties}
            >
              <div className={styles.poolThreat} style={{ color: pool.color }}>
                {pool.threat}
              </div>
              <div className={styles.poolCode}>
                {pool.code} SECTOR — POOL {pool.id}
              </div>
              <div className={styles.poolApr} style={{ color: pool.color }}>
                {pool.apr}
                <span className={styles.aprSuffix}>APR</span>
              </div>
              <div className={styles.poolDetail}>
                <div className={styles.poolDetailRow}>
                  <span>Lock Period</span>
                  <span style={{ color: pool.color }}>{pool.label}</span>
                </div>
                <div className={styles.poolDetailRow}>
                  <span>Status</span>
                  <span className={styles.poolStatus}>● ACTIVE</span>
                </div>
              </div>
              <Link
                href="/dashboard"
                className={styles.poolBtn}
                style={{ borderColor: `${pool.color}50`, color: pool.color }}
              >
                INFILTRATE →
              </Link>
              <div
                className={styles.poolCornerTL}
                style={{ borderColor: pool.color }}
              />
              <div
                className={styles.poolCornerBR}
                style={{ borderColor: pool.color }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.howSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionNum}>[ OPERATION GUIDE ]</span>
          <h2 className={styles.sectionTitle}>MISSION PROTOCOL</h2>
        </div>
        <div className={styles.steps}>
          {[
            {
              n: "01",
              title: "AUTHORIZE",
              desc: "Grant the protocol access to your SVX tokens before deployment.",
            },
            {
              n: "02",
              title: "SELECT SECTOR",
              desc: "Choose a lock period. Longer missions yield greater rewards.",
            },
            {
              n: "03",
              title: "DEPLOY",
              desc: "Stake SVX and receive ReceiptX as proof of your deployment.",
            },
            {
              n: "04",
              title: "EXTRACT",
              desc: "Claim RewardX tokens during or after your mission ends.",
            },
          ].map((step, i) => (
            <div key={step.n} className={styles.step}>
              <div
                className={styles.stepConnector}
                style={{ opacity: i < 3 ? 1 : 0 }}
              />
              <div className={styles.stepNum}>{step.n}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}