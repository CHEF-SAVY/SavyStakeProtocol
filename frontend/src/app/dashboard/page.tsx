"use client";
import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  contractAddress,
  contractABI,
  svxAddress,
  svxABI,
} from "../../../lib/contractABI";
import styles from "./page.module.css";

const POOLS = [
  {
    id: 0,
    code: "ALPHA",
    label: "5 Minutes",
    apr: "10%",
    color: "#00f5a0",
    threat: "LOW RISK",
  },
  {
    id: 1,
    code: "BETA",
    label: "10 Minutes",
    apr: "25%",
    color: "#00b4ff",
    threat: "MODERATE",
  },
  {
    id: 2,
    code: "GAMMA",
    label: "1 Hour",
    apr: "50%",
    color: "#9945ff",
    threat: "HIGH RISK",
  },
  {
    id: 3,
    code: "OMEGA",
    label: "1 Day",
    apr: "100%",
    color: "#ff2d7a",
    threat: "TITAN ZONE",
  },
];

export default function Dashboard() {
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [amount, setAmount] = useState("");

  const { address, isConnected } = useAccount();

  const { data: svxBalance } = useReadContract({
    address: svxAddress as `0x${string}`,
    abi: svxABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: pool0Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [0n],
  });
  const { data: pool1Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [1n],
  });
  const { data: pool2Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [2n],
  });
  const { data: pool3Staked } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: contractABI,
    functionName: "getPoolTotalStaked",
    args: [3n],
  });

  const poolStaked = [pool0Staked, pool1Staked, pool2Staked, pool3Staked];

  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
  } = useWriteContract();
  const {
    writeContract: writeStake,
    data: stakeTxHash,
    isPending: isStakePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } =
    useWaitForTransactionReceipt({ hash: stakeTxHash });

  function handleApprove() {
    if (!amount || selectedPool === null) return;
    writeApprove({
      address: svxAddress as `0x${string}`,
      abi: svxABI,
      functionName: "approve",
      args: [contractAddress as `0x${string}`, parseEther(amount)],
    });
  }

  function handleStake() {
    if (!amount || selectedPool === null) return;
    writeStake({
      address: contractAddress as `0x${string}`,
      abi: contractABI,
      functionName: "stake",
      args: [BigInt(selectedPool), parseEther(amount)],
    });
  }

  const formattedBalance = svxBalance
    ? parseFloat(formatEther(svxBalance as bigint)).toFixed(2)
    : "—";

  function formatStaked(val: unknown) {
    if (!val) return "0";
    return parseFloat(formatEther(val as bigint)).toFixed(2);
  }

  const approveLabel = isApprovePending
    ? "CONFIRMING..."
    : isApproveConfirming
      ? "WAITING..."
      : isApproveSuccess
        ? "✓ AUTHORIZED"
        : "01 — AUTHORIZE SVX";

  const stakeLabel = isStakePending
    ? "CONFIRMING..."
    : isStakeConfirming
      ? "WAITING..."
      : isStakeSuccess
        ? "✓ DEPLOYED"
        : "02 — DEPLOY ASSETS";

  return (
    <main className={styles.main}>
      <div className={styles.pageBorder} />

      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>[ DEPLOYMENT COMMAND ]</div>
          <h1 className={styles.pageTitle}>STAKING DASHBOARD</h1>
          <p className={styles.pageSub}>
            Select your sector and commit your assets to the mission
          </p>
        </div>
        <div className={styles.statusPanel}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>SVX BALANCE</span>
            <span className={styles.statusValue}>{formattedBalance} SVX</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>WALLET</span>
            <span
              className={styles.statusValue}
              style={{
                color: isConnected ? "#00f5a0" : "#ff2d7a",
                fontSize: "11px",
              }}
            >
              {isConnected ? "● CONNECTED" : "○ DISCONNECTED"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sectorLabel}>
        <span className={styles.sectorLine} />
        <span>SELECT DEPLOYMENT SECTOR</span>
        <span className={styles.sectorLine} />
      </div>

      <div className={styles.poolsGrid}>
        {POOLS.map((pool) => (
          <button
            key={pool.id}
            className={`${styles.poolCard} ${selectedPool === pool.id ? styles.poolSelected : ""}`}
            style={{ "--pool-color": pool.color } as React.CSSProperties}
            onClick={() =>
              setSelectedPool(pool.id === selectedPool ? null : pool.id)
            }
          >
            <div className={styles.poolHeader}>
              <span className={styles.poolThreat} style={{ color: pool.color }}>
                {pool.threat}
              </span>
              {selectedPool === pool.id && (
                <span className={styles.selectedTag}>◈ SELECTED</span>
              )}
            </div>
            <div className={styles.poolCode}>
              {pool.code} · POOL {pool.id}
            </div>
            <div className={styles.poolApr} style={{ color: pool.color }}>
              {pool.apr}
              <span className={styles.aprLabel}>APR</span>
            </div>
            <div className={styles.poolStats}>
              <div className={styles.poolStatRow}>
                <span>Lock</span>
                <span>{pool.label}</span>
              </div>
              <div className={styles.poolStatRow}>
                <span>Total Staked</span>
                <span>{formatStaked(poolStaked[pool.id])} SVX</span>
              </div>
            </div>
            <div
              className={styles.poolGlowLine}
              style={{ background: pool.color }}
            />
          </button>
        ))}
      </div>

      {selectedPool !== null ? (
        <div className={styles.deployPanel}>
          <div className={styles.deployHeader}>
            <div>
              <div className={styles.breadcrumb}>[ MISSION PARAMETERS ]</div>
              <h2 className={styles.deployTitle}>
                {POOLS[selectedPool].code} SECTOR DEPLOYMENT
                <span style={{ color: POOLS[selectedPool].color }}>
                  {" "}
                  · {POOLS[selectedPool].apr} APR
                </span>
              </h2>
            </div>
            <div className={styles.lockTag}>
              ⏱ {POOLS[selectedPool].label} LOCK
            </div>
          </div>

          <div className={styles.deployForm}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>ASSET QUANTITY</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className={styles.inputToken}>SVX</span>
                <button
                  className={styles.maxBtn}
                  onClick={() =>
                    svxBalance && setAmount(formatEther(svxBalance as bigint))
                  }
                >
                  MAX
                </button>
              </div>
            </div>

            <div className={styles.missionBriefing}>
              <div className={styles.briefingTitle}>MISSION INTELLIGENCE</div>
              <div className={styles.briefingRow}>
                <span>Receipt tokens issued</span>
                <span>{amount || "0"} RCTX</span>
              </div>
              <div className={styles.briefingRow}>
                <span>Lock expires</span>
                <span>+{POOLS[selectedPool].label} from stake</span>
              </div>
              <div className={styles.briefingRow}>
                <span>Projected yield</span>
                <span style={{ color: POOLS[selectedPool].color }}>
                  ~
                  {amount
                    ? (
                        (parseFloat(amount) *
                          parseFloat(POOLS[selectedPool].apr)) /
                        100
                      ).toFixed(4)
                    : "0"}{" "}
                  RWDX
                </span>
              </div>
              <div className={styles.briefingRow}>
                <span>Available balance</span>
                <span>{formattedBalance} SVX</span>
              </div>
            </div>

            {!isConnected && (
              <div className={styles.warningMsg}>
                ⚠ Connect your wallet before deploying assets
              </div>
            )}

            {isStakeSuccess ? (
              <div className={styles.successPanel}>
                <div className={styles.successHeader}>
                  <span className={styles.successIcon}>✓</span>
                  <span className={styles.successTitle}>MISSION DEPLOYED</span>
                </div>
                <div className={styles.successDetails}>
                  <div className={styles.successRow}>
                    <span>Sector</span>
                    <span style={{ color: POOLS[selectedPool].color }}>
                      {POOLS[selectedPool].code} — POOL {selectedPool}
                    </span>
                  </div>
                  <div className={styles.successRow}>
                    <span>Amount deployed</span>
                    <span>{amount} SVX</span>
                  </div>
                  <div className={styles.successRow}>
                    <span>Lock period</span>
                    <span>{POOLS[selectedPool].label}</span>
                  </div>
                  <div className={styles.successRow}>
                    <span>Receipt tokens</span>
                    <span>{amount} RCTX issued to wallet</span>
                  </div>
                </div>
                <div className={styles.successActions}>
                  <a
                    href="/stakes"
                    className={styles.successLink}
                    style={{
                      borderColor: `${POOLS[selectedPool].color}50`,
                      color: POOLS[selectedPool].color,
                    }}
                  >
                    VIEW REGIMENT → MY STAKES
                  </a>
                  <button
                    className={styles.stakeAgainBtn}
                    onClick={() => setAmount("")}
                  >
                    STAKE AGAIN
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.deployBtns}>
                <button
                  className={`${styles.approveBtn} ${isApproveSuccess ? styles.btnSuccess : ""}`}
                  onClick={handleApprove}
                  disabled={
                    !isConnected ||
                    !amount ||
                    isApprovePending ||
                    isApproveConfirming
                  }
                >
                  <span className={styles.btnNum}>01</span>
                  {approveLabel}
                </button>
                <button
                  className={styles.stakeBtn}
                  style={
                    {
                      "--pool-color": POOLS[selectedPool].color,
                    } as React.CSSProperties
                  }
                  onClick={handleStake}
                  disabled={
                    !isConnected ||
                    !amount ||
                    !isApproveSuccess ||
                    isStakePending ||
                    isStakeConfirming
                  }
                >
                  <span className={styles.btnNum}>02</span>
                  {stakeLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.emptyHint}>
          <span className={styles.emptyLine} />
          <span className={styles.emptyText}>
            SELECT A SECTOR ABOVE TO BEGIN DEPLOYMENT
          </span>
          <span className={styles.emptyLine} />
        </div>
      )}
    </main>
  );
}
