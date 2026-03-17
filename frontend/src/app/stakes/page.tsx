"use client";
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { contractAddress, contractABI } from "../../../lib/contractABI";
import styles from "./page.module.css";

const POOL_COLORS = ["#00f5a0", "#00b4ff", "#9945ff", "#ff2d7a"];
const POOL_CODES = ["ALPHA", "BETA", "GAMMA", "OMEGA"];
const POOL_APRS = ["10%", "25%", "50%", "100%"];
const POOL_LABELS = ["5 Minutes", "10 Minutes", "1 Hour", "1 Day"];

interface ModalStake {
  poolId: number;
  stakeId: number;
  amount: bigint;
  unlockTime: bigint;
  startTime: bigint;
  rewardRate: bigint;
  rewardAccrued: bigint;
  lastUpdateTime: bigint;
  active: boolean;
}

function useCountdown(unlockTime: bigint) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    function update() {
      const now = Math.floor(Date.now() / 1000);
      const unlock = Number(unlockTime);
      const diff = unlock - now;
      if (diff <= 0) {
        setTimeLeft("UNLOCKED");
        setIsLocked(false);
        return;
      }
      setIsLocked(true);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [unlockTime]);

  return { timeLeft, isLocked };
}

function useLiveReward(stake: ModalStake | null) {
  const [liveReward, setLiveReward] = useState("0");

  useEffect(() => {
    if (!stake) return;
    function calc() {
      if (!stake) return;
      const now = BigInt(Math.floor(Date.now() / 1000));
      const cappedNow = now > stake.unlockTime ? stake.unlockTime : now;
      const elapsed = cappedNow - stake.lastUpdateTime;
      const newRewards =
        (stake.amount * stake.rewardRate * elapsed) / BigInt(1e18);
      const total = stake.rewardAccrued + newRewards;
      setLiveReward(parseFloat(formatEther(total)).toFixed(6));
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [stake]);

  return liveReward;
}

function StakeModal({
  stake,
  onClose,
}: {
  stake: ModalStake;
  onClose: () => void;
}) {
  const { timeLeft, isLocked } = useCountdown(stake.unlockTime);
  const liveReward = useLiveReward(stake);
  const color = POOL_COLORS[stake.poolId];

  const {
    writeContract: writeClaim,
    data: claimHash,
    isPending: isClaimPending,
  } = useWriteContract();
  const { isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({
    hash: claimHash,
  });
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();
  const {
    writeContract: writeEmergency,
    data: emergencyHash,
    isPending: isEmergencyPending,
  } = useWriteContract();

  const { isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });
  const { isSuccess: isEmergencySuccess } = useWaitForTransactionReceipt({
    hash: emergencyHash,
  });

  useEffect(() => {
    if (isWithdrawSuccess || isEmergencySuccess || isClaimSuccess) onClose();
  }, [isWithdrawSuccess, isEmergencySuccess, isClaimSuccess, onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ "--modal-color": color } as React.CSSProperties}
      >
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTag} style={{ color }}>
              {POOL_CODES[stake.poolId]} SECTOR · POOL {stake.poolId}
            </div>
            <h2 className={styles.modalTitle}>MISSION DETAILS</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.countdownSection}>
          <div className={styles.countdownLabel}>
            {isLocked ? "TIME UNTIL EXTRACTION" : "MISSION COMPLETE"}
          </div>
          <div
            className={styles.countdown}
            style={{ color: isLocked ? color : "#00f5a0" }}
          >
            {timeLeft}
          </div>
          <div className={styles.unlockDate}>
            UNLOCK: {new Date(Number(stake.unlockTime) * 1000).toLocaleString()}
          </div>
        </div>

        <div className={styles.modalStats}>
          <div className={styles.modalStatCard}>
            <span className={styles.modalStatLabel}>DEPLOYED</span>
            <span className={styles.modalStatValue}>
              {parseFloat(formatEther(stake.amount)).toFixed(2)}
            </span>
            <span className={styles.modalStatUnit}>SVX</span>
          </div>
          <div className={styles.modalStatCard}>
            <span className={styles.modalStatLabel}>APR</span>
            <span className={styles.modalStatValue} style={{ color }}>
              {POOL_APRS[stake.poolId]}
            </span>
            <span className={styles.modalStatUnit}>annual</span>
          </div>
          <div className={styles.modalStatCard}>
            <span className={styles.modalStatLabel}>LOCK PERIOD</span>
            <span className={styles.modalStatValue}>
              {POOL_LABELS[stake.poolId]}
            </span>
            <span className={styles.modalStatUnit}>duration</span>
          </div>
        </div>

        <div className={styles.rewardSection}>
          <div className={styles.rewardLabel}>ACCUMULATED REWARDS</div>
          <div className={styles.rewardValue} style={{ color }}>
            {liveReward}
            <span className={styles.rewardUnit}>RWDX</span>
          </div>
          <div className={styles.rewardTicker}>● LIVE</div>
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.claimBtn}
            disabled={isClaimPending}
            onClick={() =>
              writeClaim({
                address: contractAddress as `0x${string}`,
                abi: contractABI,
                functionName: "claimRewards",
                args: [BigInt(stake.poolId), BigInt(stake.stakeId)],
              })
            }
          >
            {isClaimPending ? "CONFIRMING..." : "CLAIM REWARDS"}
          </button>
          <button
            className={styles.withdrawBtn}
            disabled={isLocked || isWithdrawPending}
            onClick={() =>
              writeWithdraw({
                address: contractAddress as `0x${string}`,
                abi: contractABI,
                functionName: "withdraw",
                args: [BigInt(stake.poolId), BigInt(stake.stakeId)],
              })
            }
          >
            {isWithdrawPending
              ? "CONFIRMING..."
              : isLocked
                ? "EXTRACT (LOCKED)"
                : "EXTRACT ASSETS"}
          </button>
          <button
            className={styles.emergencyBtn}
            disabled={isEmergencyPending}
            onClick={() => {
              if (
                confirm(
                  "ABORT MISSION?\n\nYou will forfeit ALL rewards and pay a 10% penalty.",
                )
              ) {
                writeEmergency({
                  address: contractAddress as `0x${string}`,
                  abi: contractABI,
                  functionName: "emergencyWithdraw",
                  args: [BigInt(stake.poolId), BigInt(stake.stakeId)],
                });
              }
            }}
          >
            {isEmergencyPending ? "CONFIRMING..." : "⚠ ABORT MISSION"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StakeRow({
  poolId,
  stakeId,
  address,
  onSelect,
}: {
  poolId: number;
  stakeId: number;
  address: string;
  onSelect: (s: ModalStake) => void;
}) {
  const { data: stakeData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "userStakes",
    args: [BigInt(poolId), address as `0x${string}`, BigInt(stakeId)],
  });

  if (!stakeData) return null;

  const [
    amount,
    startTime,
    unlockTime,
    rewardRate,
    lastUpdateTime,
    rewardAccrued,
    active,
  ] = stakeData as [bigint, bigint, bigint, bigint, bigint, bigint, boolean];

  if (!active) return null;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isLocked = unlockTime > now;
  const unlockDate = new Date(Number(unlockTime) * 1000).toLocaleString();

  const liveReward = (() => {
    const cappedNow = now > unlockTime ? unlockTime : now;
    const elapsed = cappedNow - lastUpdateTime;
    const newRewards = (amount * rewardRate * elapsed) / BigInt(1e18);
    return parseFloat(formatEther(rewardAccrued + newRewards)).toFixed(4);
  })();

  const stakeObj: ModalStake = {
    poolId,
    stakeId,
    amount,
    unlockTime,
    startTime,
    rewardRate,
    rewardAccrued,
    lastUpdateTime,
    active,
  };

  return (
    <div
      className={styles.stakeRow}
      onClick={() => onSelect(stakeObj)}
      style={{ cursor: "pointer" }}
    >
      <div
        className={styles.sectorBadge}
        style={{
          color: POOL_COLORS[poolId],
          borderColor: `${POOL_COLORS[poolId]}30`,
        }}
      >
        {POOL_CODES[poolId]} · P{poolId}
      </div>
      <span className={styles.stakeAmount}>
        {parseFloat(formatEther(amount)).toFixed(2)} SVX
      </span>
      <span className={styles.stakeTime}>{unlockDate}</span>
      <span
        className={styles.stakeReward}
        style={{ color: POOL_COLORS[poolId] }}
      >
        {liveReward} RWDX
      </span>
      <span
        className={`${styles.statusBadge} ${isLocked ? styles.statusLocked : styles.statusUnlocked}`}
      >
        {isLocked ? "⏱ LOCKED" : "✓ READY"}
      </span>
      <div className={styles.actionBtns}>
        <span className={styles.viewBtn} style={{ color: POOL_COLORS[poolId] }}>
          VIEW DETAILS →
        </span>
      </div>
    </div>
  );
}

function ClosedStakeRow({
  poolId,
  stakeId,
  address,
}: {
  poolId: number;
  stakeId: number;
  address: string;
}) {
  const { data: stakeData } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "userStakes",
    args: [BigInt(poolId), address as `0x${string}`, BigInt(stakeId)],
  });

  if (!stakeData) return null;

  const [amount, , unlockTime, , , , active] = stakeData as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean,
  ];

  if (active) return null;

  return (
    <div className={styles.closedRow}>
      <div
        className={styles.sectorBadge}
        style={{ color: "#3a3730", borderColor: "#2a2a3a" }}
      >
        {POOL_CODES[poolId]} · P{poolId}
      </div>
      <span className={styles.stakeAmount} style={{ color: "#3a3730" }}>
        {parseFloat(formatEther(amount)).toFixed(2)} SVX
      </span>
      <span className={styles.stakeTime} style={{ color: "#2a2a3a" }}>
        {new Date(Number(unlockTime) * 1000).toLocaleString()}
      </span>
      <span className={styles.stakeReward} style={{ color: "#2a2a3a" }}>
        — RWDX
      </span>
      <span
        className={styles.statusBadge}
        style={{
          background: "#0e0e14",
          color: "#3a3730",
          border: "1px solid #1c1c28",
        }}
      >
        ✓ CLOSED
      </span>
      <span
        style={{
          fontFamily: "Share Tech Mono, monospace",
          fontSize: "11px",
          color: "#2a2a3a",
          letterSpacing: "0.1em",
        }}
      >
        MISSION ENDED
      </span>
    </div>
  );
}

function PoolStakes({
  poolId,
  address,
  onSelect,
}: {
  poolId: number;
  address: string;
  onSelect: (s: ModalStake) => void;
}) {
  const { data: count } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "stakeCount",
    args: [BigInt(poolId), address as `0x${string}`],
  });
  const stakeCount = count ? Number(count) : 0;
  return (
    <>
      {Array.from({ length: stakeCount }, (_, i) => (
        <StakeRow
          key={`${poolId}-${i}`}
          poolId={poolId}
          stakeId={i}
          address={address}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

function ClosedPoolStakes({
  poolId,
  address,
}: {
  poolId: number;
  address: string;
}) {
  const { data: count } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "stakeCount",
    args: [BigInt(poolId), address as `0x${string}`],
  });
  const stakeCount = count ? Number(count) : 0;
  return (
    <>
      {Array.from({ length: stakeCount }, (_, i) => (
        <ClosedStakeRow
          key={`closed-${poolId}-${i}`}
          poolId={poolId}
          stakeId={i}
          address={address}
        />
      ))}
    </>
  );
}

export default function Stakes() {
  const { address, isConnected } = useAccount();
  const [activeFilter, setActiveFilter] = useState("ALL SECTORS");
  const [selectedStake, setSelectedStake] = useState<ModalStake | null>(null);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>[ REGIMENT RECORDS ]</div>
          <h1 className={styles.pageTitle}>MY STAKES</h1>
          <p className={styles.pageSub}>
            Active deployments and mission status
          </p>
        </div>
      </div>

      <div className={styles.regimentSection}>
        <div className={styles.regimentHeader}>
          <div>
            <div className={styles.breadcrumb}>[ ACTIVE OPERATIONS ]</div>
            <h2 className={styles.regimentTitle}>DEPLOYMENT LOG</h2>
          </div>
          <div className={styles.filterRow}>
            {["ALL SECTORS", "ALPHA", "BETA", "GAMMA", "OMEGA"].map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${activeFilter === f ? styles.filterActive : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {!isConnected ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyGlyph}>
              <span className={styles.emptyWings}>⟨ ✦ ⟩</span>
              <span className={styles.emptyLabel}>WALLET NOT CONNECTED</span>
            </div>
            <p className={styles.emptySub}>
              Connect your wallet to view your active deployments.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.listHeader}>
              <span>SECTOR</span>
              <span>DEPLOYED</span>
              <span>UNLOCK TIME</span>
              <span>PENDING YIELD</span>
              <span>STATUS</span>
              <span>ACTIONS</span>
            </div>
            {address &&
              [0, 1, 2, 3]
                .filter(
                  (id) =>
                    activeFilter === "ALL SECTORS" ||
                    POOL_CODES[id] === activeFilter,
                )
                .map((poolId) => (
                  <PoolStakes
                    key={poolId}
                    poolId={poolId}
                    address={address}
                    onSelect={setSelectedStake}
                  />
                ))}
          </>
        )}
      </div>

      {isConnected && address && (
        <div className={styles.regimentSection} style={{ marginTop: "1.5rem" }}>
          <div className={styles.regimentHeader}>
            <div>
              <div className={styles.breadcrumb}>[ MISSION ARCHIVES ]</div>
              <h2 className={styles.regimentTitle} style={{ color: "#3a3730" }}>
                CLOSED MISSIONS
              </h2>
            </div>
          </div>
          <div className={styles.listHeader}>
            <span>SECTOR</span>
            <span>DEPLOYED</span>
            <span>UNLOCK TIME</span>
            <span>REWARDS</span>
            <span>STATUS</span>
            <span></span>
          </div>
          {[0, 1, 2, 3].map((poolId) => (
            <ClosedPoolStakes key={poolId} poolId={poolId} address={address} />
          ))}
        </div>
      )}

      {selectedStake && (
        <StakeModal
          stake={selectedStake}
          onClose={() => setSelectedStake(null)}
        />
      )}
    </main>
  );
}
