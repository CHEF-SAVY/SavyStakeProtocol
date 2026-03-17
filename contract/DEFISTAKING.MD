# DefiStaking Protocol — Technical Documentation

## Overview

This is a DeFi staking protocol built on Ethereum. Users stake SVX tokens into time-locked pools and earn RewardX tokens based on how long they lock their tokens. A ReceiptX token is minted as proof of stake and burned when the user withdraws.

---

## The Three Tokens and Their Roles

### SavyXERC20 (Stake Token)

This is the token users bring to the protocol to stake. It is a standard ERC20 token with no special restrictions. The staking contract pulls it from the user's wallet using `transferFrom` and holds it for the duration of the lock period.

### RewardERC20 (Reward Token)

This is what users earn for staking. It is minted directly by the staking contract — no pre-existing supply needs to be held. The `onlyPool` modifier ensures only the staking contract can call `mint`, so rewards cannot be created by anyone else. The `setPool` function is called by the owner after deployment to register the staking contract's address.

### ReceiptERC20 (Receipt Token)

This is minted 1:1 with whatever amount the user stakes. It serves as an on-chain proof that the user has an active stake. It is burned when the user withdraws or calls emergency withdraw. Like the reward token, only the staking contract can mint or burn it via the `onlyPool` modifier. Receipt tokens are non-transferable — they are tied to the staker's address.

---

## Why initialSupply is Not Needed for Reward and Receipt Tokens

The reward token is minted on demand whenever a user earns rewards. The receipt token is minted on demand whenever a user stakes. Neither token needs a pre-existing supply because the staking contract creates them as needed. Setting `initialSupply = 0` in their constructors is the correct approach.

SavyXERC20 does need an initial supply because users need tokens to stake with in the first place. The owner mints the initial supply to themselves and distributes it.

---

## Contract Architecture — DefiStaking.sol

### Interfaces

IERC20          → bridge to the stake token (SavyX)
                  gives the contract access to transferFrom and transfer

IRewardToken    → bridge to the reward token
                  gives the contract access to mint

IRecieptToken   → bridge to the receipt token
                  gives the contract access to mint and burn

The reason there are three separate interfaces is that each token has different capabilities. The stake token is a standard ERC20. The reward token needs minting. The receipt token needs both minting and burning.

---

### State Variables

```solidity
uint256 public poolCount
```

A counter that tracks how many pools exist. It starts at 0 and increments each time `createPool` is called. It also serves as the `poolId` for each new pool — pool 0 is created when poolCount is 0, pool 1 when poolCount is 1, and so on.

```solidity
mapping(uint256 poolId => uint256) public poolTotalStaked
```

Tracks the total amount of SVX locked across all users in a specific pool. This is different from an individual user's stake — it is the sum of everyone staking in that pool.

```solidity
mapping(uint256 poolId => uint256 rate) public poolsRewardRate
```

Stores the reward rate for each pool. The rate is expressed as a per-second rate scaled to 1e18, derived from an APR percentage. This is snapshotted into each user's Stake struct at the time of staking so future rate changes by the owner do not affect existing stakes.

```solidity
mapping(uint256 poolId => uint256 lockDuration) public poolsLockDuration
```

Stores the lock duration in seconds for each pool. Pool 0 locks for 300 seconds (5 minutes), pool 1 for 600 seconds (10 minutes), and so on.

```solidity
mapping(uint256 poolId => mapping(address user => mapping(uint256 stakeId => Stake))) public userStakes
```

This is the main storage for all stakes. It is a triple nested mapping. To reach a specific stake you need three keys: which pool, which user, and which stake number for that user in that pool. This allows one user to have multiple active stakes in the same pool simultaneously.

```solidity
mapping(uint256 poolId => mapping(address user => uint256 count)) public stakeCount
```

Tracks how many stakes a user has in each pool. This count also serves as the next available `stakeId`. When a user stakes for the first time in pool 0, their stakeId is 0. After staking, the count increments to 1, so their next stake in pool 0 gets stakeId 1.

---

### The Stake Struct

```solidity
struct Stake {
    uint256 amount;          // how much SVX the user staked
    uint256 startTime;       // block.timestamp when they staked
    uint256 unlockTime;      // startTime + pool lock duration
    uint256 rewardRate;      // pool rate snapshotted at time of staking
    uint256 lastUpdateTime;  // last time rewards were calculated for this stake
    uint256 rewardAccrued;   // rewards saved up since last claim
    bool active;             // false once withdrawn or emergency withdrawn
}
```

The `rewardRate` is snapshotted from the pool at the moment of staking. This is important — if the owner later updates the pool's reward rate, existing stakes are not affected. Only new stakes after the update will use the new rate.

The `active` flag is the gatekeeper for all functions. Every function checks this first. Setting it to `false` before making any external calls is what protects against reentrancy attacks.

---

### The Pools

Four pools are created automatically in the constructor:

| Pool | Lock Duration | APR  | Reward Rate    |
| ---- | ------------- | ---- | -------------- |
| 0    | 5 minutes     | 10%  | 3,170,979,198  |
| 1    | 10 minutes    | 25%  | 7,927,447,995  |
| 2    | 1 hour        | 50%  | 15,854,895,991 |
| 3    | 1 day         | 100% | 31,709,791,983 |

The reward rates are calculated using the formula:

rewardRate = (APR * 1e18) / (100 * 31536000)

The division by `31536000` (seconds in a year) converts the annual rate into a per-second rate that the blockchain can work with.

---

### Functions

#### createPool (internal)

createPool(lockDuration, rewardRate)

Stores the reward rate and lock duration in their respective mappings using `poolCount` as the key. Then increments `poolCount`. Called internally by the constructor to set up all four pools at deployment. Can also be wrapped in an external owner function to add new pools later.

---

#### calculateReward (internal)

calculateReward(poolId, user, stakeId)

The core math function. It fetches the user's Stake struct and calculates how many reward tokens they have earned since `lastUpdateTime`:

rewards = amount * rewardRate * timeElapsed / 1e18

The division by `1e18` is necessary because `rewardRate` is scaled up by `1e18` to preserve precision in integer math. Returns 0 if the stake amount is 0. Every function that pays out rewards calls this first.

---

#### stake

stake(poolId, amount)

The user chooses a pool and an amount to stake. The function:

1. Validates amount is greater than 0
2. Assigns the current `stakeCount` as the `stakeId`
3. Creates a new Stake struct with all fields populated, snapshotting the pool's current reward rate and calculating the unlock time
4. Pulls SVX from the user's wallet into the contract using `transferFrom`
5. Updates the pool's total staked
6. Mints receipt tokens 1:1 to the user
7. Increments the user's stake count for this pool

---

#### withdraw

withdraw(poolId, stakeId)

The user can only call this after the lock period has expired. The function:

1. Fetches the Stake struct
2. Checks the stake is active
3. Checks the current time is past `unlockTime`
4. Calculates total rewards (saved up accrued + new since last update)
5. Sets `active = false` **before** any transfers (reentrancy protection)
6. Reduces pool total staked
7. Burns the receipt token
8. Transfers SVX back to the user
9. Mints reward tokens to the user

---

#### claimRewards

claimRewards(poolId, stakeId)

Allows a user to claim accumulated rewards without withdrawing their stake. The lock period does not need to have ended. The function:

1. Fetches the Stake struct
2. Checks active and that rewards are greater than 0
3. Calculates total rewards
4. Resets `rewardAccrued = 0` and `lastUpdateTime = block.timestamp` **before** minting (reentrancy protection)
5. Mints reward tokens to the user

The reason `lastUpdateTime` is reset is so that the next time rewards are calculated, it starts counting from now rather than double-counting rewards that were just paid out.

---

#### emergencyWithdraw

emergencyWithdraw(poolId, stakeId)

Allows a user to exit before the lock period ends, but at a cost. A 10% penalty is taken from their staked amount and sent to the owner. All accumulated rewards are forfeited — no reward tokens are minted. The function:

1. Fetches the Stake struct
2. Checks active and amount greater than 0
3. Calculates penalty (10%) and amount after penalty (90%)
4. Sets `active = false`, clears `rewardAccrued`, reduces pool total — all before transfers
5. Burns receipt token
6. Transfers 90% SVX to user
7. Transfers 10% SVX to owner

---

#### updateRewardRate

updateRewardRate(poolId, newRate)

Owner-only function. Updates the reward rate for a specific pool. Only affects new stakes created after this point. Existing stakes keep their snapshotted rate from when they originally staked.

---

## Checks-Effects-Interactions Pattern

Every function in this contract follows the same order:

1. **Checks** — all `require` statements first
2. **Effects** — all state changes (setting active = false, updating balances, resetting timers)
3. **Interactions** — all external calls last (transfers, mints, burns)

This order is critical for security. If an external call were made before state was updated, a malicious contract could re-enter the function and drain funds before the state reflected the withdrawal.

---

## Deployment Order

1. Deploy SavyXERC20 (with initial supply)
2. Deploy RewardERC20 (initial supply = 0)
3. Deploy ReceiptERC20 (initial supply = 0)
4. Deploy DefiStaking passing in all 3 token addresses
   → constructor automatically creates all 4 pools
5. Call setPool on RewardERC20 with DefiStaking address
6. Call setPool on ReceiptERC20 with DefiStaking address

Steps 5 and 6 are critical. Without them, the staking contract cannot mint reward or receipt tokens and every stake call will revert.
