"use client";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { contractAddress, contractABI } from "../../../lib/contractABI";
import styles from "./page.module.css";

const POOLS = [
  {
    id: 0,
    code: "ALPHA",
    label: "5 Minutes",
    apr: "10%",
    color: "#00f5a0",
    rate: "3170979198",
  },
  {
    id: 1,
    code: "BETA",
    label: "10 Minutes",
    apr: "25%",
    color: "#00b4ff",
    rate: "7927447995",
  },
  {
    id: 2,
    code: "GAMMA",
    label: "1 Hour",
    apr: "50%",
    color: "#9945ff",
    rate: "15854895991",
  },
  {
    id: 3,
    code: "OMEGA",
    label: "1 Day",
    apr: "100%",
    color: "#ff2d7a",
    rate: "31709791983",
  },
];

export default function Admin() {
  const [newRates, setNewRates] = useState<Record<number, string>>({});
  const { address, isConnected } = useAccount();

  const { data: ownerAddress } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "owner",
  });

  const { data: pool0Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [BigInt(0)],
  });
  const { data: pool1Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [BigInt(1)],
  });
  const { data: pool2Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [BigInt(2)],
  });
  const { data: pool3Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [BigInt(3)],
  });

  const poolStaked = [pool0Staked, pool1Staked, pool2Staked, pool3Staked];

  const { writeContract, isPending } = useWriteContract();

  const isOwner =
    isConnected &&
    address?.toLowerCase() === (ownerAddress as string)?.toLowerCase();

  function handleUpdateRate(poolId: number) {
    const rate = newRates[poolId];
    if (!rate) return;
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: "updateRewardRate",
      args: [BigInt(poolId), BigInt(rate)],
    });
  }

  function formatStaked(val: unknown) {
    if (!val) return "0";
    return parseFloat(formatEther(val as bigint)).toFixed(2);
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>[ COMMAND HEADQUARTERS ]</div>
          <h1 className={styles.pageTitle}>COMMAND CENTER</h1>
          <p className={styles.pageSub}>
            Protocol administration — restricted access
          </p>
        </div>
        <div className={styles.accessBadge}>
          <span className={styles.accessDot} />
          {isOwner ? "COMMANDER ACCESS GRANTED" : "OWNER ACCESS ONLY"}
        </div>
      </div>

      {!isOwner && isConnected && (
        <div className={styles.warningBanner}>
          <span className={styles.warningGlyph}>⚠</span>
          <span>
            Your wallet is not the contract owner. Write functions will revert.
          </span>
        </div>
      )}

      {!isConnected && (
        <div className={styles.warningBanner}>
          <span className={styles.warningGlyph}>⚠</span>
          <span>Connect your wallet to access command functions.</span>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.breadcrumb}>[ SECTOR CONTROL ]</div>
              <h2 className={styles.sectionTitle}>REWARD RATE ADJUSTMENT</h2>
              <p className={styles.sectionSub}>
                Modify reward rates per sector. Changes apply to new deployments
                only.
              </p>
            </div>

            <div className={styles.poolsList}>
              {POOLS.map((pool) => (
                <div
                  key={pool.id}
                  className={styles.poolRow}
                  style={{ "--pool-color": pool.color } as React.CSSProperties}
                >
                  <div className={styles.poolInfo}>
                    <div className={styles.poolTop}>
                      <span
                        className={styles.poolCode}
                        style={{ color: pool.color }}
                      >
                        {pool.code}
                      </span>
                      <span
                        className={styles.poolApr}
                        style={{ color: pool.color }}
                      >
                        {pool.apr} APR
                      </span>
                    </div>
                    <span className={styles.poolMeta}>
                      {pool.label} Lock Period
                    </span>
                    <span className={styles.poolRate}>
                      CURRENT RATE: {pool.rate}
                    </span>
                  </div>
                  <div className={styles.poolEdit}>
                    <input
                      type="text"
                      className={styles.rateInput}
                      placeholder={isOwner ? "New rate..." : "RESTRICTED"}
                      value={newRates[pool.id] || ""}
                      onChange={(e) =>
                        setNewRates((prev) => ({
                          ...prev,
                          [pool.id]: e.target.value,
                        }))
                      }
                      disabled={!isOwner}
                    />
                    <button
                      className={styles.updateBtn}
                      style={{
                        color: pool.color,
                        borderColor: `${pool.color}30`,
                      }}
                      disabled={!isOwner || isPending || !newRates[pool.id]}
                      onClick={() => handleUpdateRate(pool.id)}
                    >
                      {isPending ? "..." : "UPDATE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.breadcrumb}>[ LIVE INTELLIGENCE ]</div>
              <h2 className={styles.sectionTitle}>POOL STATUS</h2>
            </div>
            <div className={styles.statsList}>
              {POOLS.map((pool, i) => (
                <div key={pool.id} className={styles.statRow}>
                  <div className={styles.statLeft}>
                    <span
                      className={styles.statDot}
                      style={{
                        background: pool.color,
                        boxShadow: `0 0 4px ${pool.color}`,
                      }}
                    />
                    <span className={styles.statLabel}>{pool.code} SECTOR</span>
                  </div>
                  <span className={styles.statValue}>
                    {formatStaked(poolStaked[i])} SVX
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.breadcrumb}>[ ASSET REGISTRY ]</div>
              <h2 className={styles.sectionTitle}>CONTRACT ADDRESSES</h2>
            </div>
            <div className={styles.addrList}>
              {[
                { label: "DEFI STAKING", value: contractAddress },
                { label: "SAVYX TOKEN", value: "0xC241...51F5" },
                { label: "REWARDX TOKEN", value: "0x7005...41BD" },
                { label: "RECEIPTX TOKEN", value: "0x68d2...D1C2" },
                {
                  label: "OWNER",
                  value: ownerAddress
                    ? `${(ownerAddress as string).slice(0, 6)}...${(ownerAddress as string).slice(-4)}`
                    : "...",
                },
              ].map((info) => (
                <div key={info.label} className={styles.addrRow}>
                  <span className={styles.addrLabel}>{info.label}</span>
                  <span className={styles.addrValue}>{info.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
