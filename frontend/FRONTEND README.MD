# SavyStake — Frontend Blockchain Integration Guide

## What This Document Is

This document explains how your smart contract connects to your Next.js frontend. It covers every tool used, every hook called, and how each page talks to the blockchain. The goal is for you to understand this well enough to integrate any smart contract into any frontend on your own in the future.

---

## The Three Tools and What They Do

### Wagmi

Wagmi stands for **We're All Gonna Make It** — it's a collection of React hooks specifically built for interacting with Ethereum and EVM-compatible blockchains. Think of it as the brain of your blockchain frontend. It handles:

- Reading data from smart contracts
- Writing transactions to smart contracts
- Tracking wallet connection state
- Managing transaction lifecycle (pending, confirming, success, error)

Every blockchain interaction in your frontend goes through wagmi.

### Viem

Viem is the low-level library that wagmi is built on top of. You rarely call viem directly — wagmi does that for you — but you use two viem utilities constantly:

- `parseEther(amount)` — converts a human-readable number like `"100"` into wei (the raw unit the blockchain understands). So `"100"` becomes `100000000000000000000`.
- `formatEther(bigint)` — does the reverse. Converts a raw wei number back to a human-readable decimal. So `100000000000000000000n` becomes `"100.0"`.

You need these because Solidity stores all token amounts as integers scaled by 1e18. There are no decimals on the blockchain.

### RainbowKit

RainbowKit is a UI library built on top of wagmi that gives you a ready-made wallet connection button and modal. It handles the complicated work of detecting which wallets a user has installed, showing the connection modal, and managing the connected wallet state. Once a user connects through RainbowKit, wagmi automatically knows the wallet address and can sign transactions.

---

## How They Connect Together

The connection flows like this:

```
RainbowKit (wallet UI)
    ↓ connects wallet
Wagmi (blockchain hooks)
    ↓ uses
Viem (raw blockchain calls)
    ↓ talks to
Your Smart Contract on Sepolia
```

In your code, this is set up in three files:

**`lib/config.ts`** — configures wagmi with your chain (Sepolia), your WalletConnect project ID, and SSR settings.

**`app/provider.tsx`** — wraps your entire app with `WagmiProvider`, `QueryClientProvider`, and `RainbowKitProvider`. Every component inside these providers can use wagmi hooks and access wallet state.

**`app/layout.tsx`** — imports the providers and wraps all pages with them using `ClientProviders`.

---

## The Two Types of Contract Interactions

Every blockchain interaction falls into one of two categories:

### Read (free, no gas)

Reading data from the blockchain costs nothing and requires no wallet signature. You're just asking a node to return stored values. In wagmi this is done with `useReadContract`.

### Write (costs gas, requires signature)

Writing data to the blockchain changes state. It costs gas and requires the user to sign the transaction with their wallet. In wagmi this is done with `useWriteContract`.

---

## The Core Wagmi Hooks Explained

### useAccount

```typescript
const { address, isConnected } = useAccount();
```

This gives you the connected wallet's address and whether a wallet is connected. Used in every page to:

- Show the user's wallet address
- Guard write functions so they only work when connected
- Pass the user's address to contract read functions

### useReadContract

```typescript
const { data } = useReadContract({
  address: contractAddress,
  abi: contractABI,
  functionName: "getPoolTotalStaked",
  args: [0n],
});
```

This calls a `view` function on your contract and returns the data. Four things you always need to provide:

- `address` — the deployed contract address
- `abi` — the contract ABI (the description of all functions)
- `functionName` — the exact function name from your Solidity contract
- `args` — the arguments to pass in (always as BigInt for uint256)

The hook automatically re-fetches when args change. It returns `undefined` while loading and the actual value once loaded.

### useWriteContract

```typescript
const { writeContract, data: txHash, isPending } = useWriteContract();

writeContract({
  address: contractAddress,
  abi: contractABI,
  functionName: "stake",
  args: [BigInt(poolId), parseEther(amount)],
});
```

This sends a transaction to your contract. Calling `writeContract()` opens MetaMask for the user to confirm. After calling it you get back a `txHash` which is the transaction hash.

`isPending` is true while MetaMask is open waiting for the user to confirm. It goes false once they confirm or reject.

### useWaitForTransactionReceipt

```typescript
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
```

After the user confirms in MetaMask, the transaction goes to the network and waits to be mined into a block. This hook tracks that process. `isLoading` is true while waiting for the block confirmation. `isSuccess` becomes true once the transaction is confirmed on chain. This is when you know the contract state has actually changed.

---

## The ABI — The Bridge Between Frontend and Contract

The ABI (Application Binary Interface) is a JSON description of every function in your smart contract. It tells wagmi:

- What functions exist
- What arguments each function takes
- What each function returns
- Whether a function reads or writes state

Without the ABI, wagmi has no idea how to talk to your contract. Your `lib/contractABI.ts` file contains two ABIs:

- `contractABI` — for your DefiStaking contract
- `svxABI` — for your SVX token contract

Every time you call `useReadContract` or `useWriteContract`, you pass in the ABI so wagmi knows how to encode the function call correctly.

---

## How the Dashboard Page Connects to the Contract

The dashboard handles two contract interactions: approving SVX and staking.

### Reading SVX Balance

```typescript
const { data: svxBalance } = useReadContract({
  address: svxAddress,
  abi: svxABI,
  functionName: "balanceOf",
  args: [address],
});
```

This reads the user's SVX balance from the SVX token contract. The result comes back as a raw bigint in wei, so it's formatted with `formatEther` before displaying.

### Reading Pool Total Staked

```typescript
const { data: pool0Staked } = useReadContract({
  address: contractAddress,
  abi: contractABI,
  functionName: "getPoolTotalStaked",
  args: [0n],
});
```

This is called four times — once per pool — to show how much SVX is locked in each pool card. The `0n` means BigInt zero, which is pool ID 0.

### The Two-Step Stake Process

Staking requires two transactions because of how ERC20 tokens work on Ethereum:

### Step 1 — Approve

Before your DefiStaking contract can pull SVX from the user's wallet, the user must give it permission. This calls `approve` on the SVX token contract:

```typescript
writeApprove({
  address: svxAddress,
  abi: svxABI,
  functionName: "approve",
  args: [contractAddress, parseEther(amount)],
});
```

This tells the SVX token: "Allow the DefiStaking contract to spend up to X tokens from my wallet."

### Step 2 — Stake

Only after approval succeeds can the stake go through. The Stake button is disabled until `isApproveSuccess` is true:

```typescript
writeStake({
  address: contractAddress,
  abi: contractABI,
  functionName: "stake",
  args: [BigInt(selectedPool), parseEther(amount)],
});
```

This calls your Solidity `stake(pooId, _amount)` function. Your contract then calls `transferFrom` internally to pull the SVX from the user's wallet into the contract.

### Why Two Separate writeContract Hooks

```typescript
const { writeContract: writeApprove } = useWriteContract();
const { writeContract: writeStake } = useWriteContract();
```

Each `useWriteContract` hook tracks one transaction's state independently. If you used the same hook for both, the state would get confused — you wouldn't know which transaction's hash or pending state you were looking at.

---

## How the Stakes Page Connects to the Contract

The stakes page has the most complex contract integration because it dynamically reads an unknown number of stakes per user.

### The StakeCount Pattern

```typescript
const { data: count } = useReadContract({
  functionName: "stakeCount",
  args: [BigInt(poolId), address],
});
const stakeCount = count ? Number(count) : 0;
```

First it reads how many stakes the user has in each pool. This number determines how many `StakeRow` components to render.

### Dynamic StakeRow Components

```typescript
Array.from({ length: stakeCount }, (_, i) => (
  <StakeRow poolId={poolId} stakeId={i} address={address} />
))
```

For each stake index, a `StakeRow` component is created. Each `StakeRow` independently reads its own data:

```typescript
const { data: stakeData } = useReadContract({
  functionName: "userStakes",
  args: [BigInt(poolId), address, BigInt(stakeId)],
});
```

This calls your `userStakes` mapping which returns the full Stake struct: amount, startTime, unlockTime, rewardRate, lastUpdateTime, rewardAccrued, and active.

### Reading the Stake Struct

The struct comes back as an array in the same order the fields are declared in Solidity:

```typescript
const [
  amount,
  startTime,
  unlockTime,
  rewardRate,
  lastUpdateTime,
  rewardAccrued,
  active,
] = stakeData as [bigint, bigint, bigint, bigint, bigint, bigint, boolean];
```

Position 0 is amount, position 6 is active — matching your Solidity struct exactly.

### Live Reward Calculation

Rewards are not re-read from the contract every second — that would be thousands of RPC calls. Instead they're calculated locally using the same formula as your Solidity contract:

```typescript
const elapsed = now - lastUpdateTime;
const newRewards = (amount * rewardRate * elapsed) / BigInt(1e18);
const total = rewardAccrued + newRewards;
```

This mirrors your `calculateReward` function exactly. The result ticks up every second using `setInterval` inside a `useEffect`.

### The Countdown Timer

Same pattern — calculated locally from `unlockTime`:

```typescript
const diff = Number(unlockTime) - Math.floor(Date.now() / 1000);
```

When `diff` is positive the pool is locked. When it hits zero the pool unlocks. No contract call needed — the unlock time is already stored in the stake data.

### Claim, Withdraw, Emergency Write Calls

Each action button calls its corresponding contract function:

```typescript
// Claim
functionName: 'claimRewards', args: [BigInt(poolId), BigInt(stakeId)]

// Withdraw
functionName: 'withdraw', args: [BigInt(poolId), BigInt(stakeId)]

// Emergency
functionName: 'emergencyWithdraw', args: [BigInt(poolId), BigInt(stakeId)]
```

After withdraw or emergency succeed, `useWaitForTransactionReceipt` detects `isSuccess` and automatically closes the modal — at which point the stake row disappears because `active` will return `false` on the next read.

---

## How the Admin Page Connects to the Contract

### Reading the Owner Address

```typescript
const { data: ownerAddress } = useReadContract({
  functionName: "owner",
});
```

This reads the `owner` public variable from your contract. It's compared against the connected wallet:

```typescript
const isOwner = address?.toLowerCase() === ownerAddress?.toLowerCase();
```

If they match, the inputs and buttons are enabled. If not, they're disabled and show "RESTRICTED".

### Updating Reward Rate

```typescript
writeContract({
  functionName: "updateRewardRate",
  args: [BigInt(poolId), BigInt(newRate)],
});
```

This calls your `updateRewardRate(poolId, newRate)` function which is protected by `onlyOwner` in Solidity. If a non-owner wallet tries to call it, the contract reverts and the transaction fails.

---

## The General Pattern for Integrating Any Contract

Now that you've seen how this specific contract is integrated, here is the pattern you follow every time for any contract:

### Step 1 — Get the ABI and address

Export your contract and copy its ABI into a TypeScript file. Store the deployed address alongside it.

### Step 2 — Set up providers

Wrap your app with `WagmiProvider`, `QueryClientProvider`, and `RainbowKitProvider`. Configure the chain and project ID.

### Step 3 — Read data with useReadContract

For every piece of data you want to display from the contract, call `useReadContract` with the function name and args. Format bigint values with `formatEther` before displaying.

### Step 4 — Write data with useWriteContract

For every button that changes contract state, call `writeContract` with the function name and args. Parse number inputs with `parseEther` before passing them.

### Step 5 — Track transaction lifecycle

Use `isPending` to show loading state while MetaMask is open. Use `useWaitForTransactionReceipt` to know when the transaction is confirmed. Update UI accordingly.

### Step 6 — Handle ERC20 approvals

Any function that pulls tokens from the user's wallet needs an approval step first. Always call `approve` on the token contract before calling the function that spends the tokens.

### Step 7 — Guard writes

Disable write buttons when `!isConnected` or when required conditions aren't met (like approval not done yet, or lock period not expired).

---

## How Each Page Talks to the Contract — Summary

| Page      | Reads                                                       | Writes                                    |
| --------- | ----------------------------------------------------------- | ----------------------------------------- |
| Dashboard | SVX balance, pool total staked per pool                     | approve (SVX contract), stake             |
| Stakes    | stakeCount per pool, userStakes per stake, getPendingReward | claimRewards, withdraw, emergencyWithdraw |
| Admin     | owner address, pool total staked per pool                   | updateRewardRate                          |

---

## Key Things to Remember

The blockchain only understands integers. All token amounts are stored as integers scaled by 1e18. Always use `parseEther` when sending amounts to the contract and `formatEther` when displaying them.

The ABI is mandatory. Without it wagmi cannot encode or decode contract calls. If your ABI is wrong or outdated your calls will fail silently or return garbage data.

Reads are free. Writes cost gas. Design your UI so users only sign transactions when absolutely necessary.

Always follow checks-effects-interactions in your frontend too. Disable buttons while transactions are pending. Show loading states. Handle errors gracefully.

The two-step approve-then-action pattern applies to any ERC20 interaction. It is not specific to your contract — it is how all ERC20 tokens work on Ethereum.
