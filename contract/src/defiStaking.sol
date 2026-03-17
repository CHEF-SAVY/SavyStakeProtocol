// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


// This Interface acts as a bridge between this Defi Staking contract and my tokens contract,  
// showing this Defi Staking contract what functions to call. 
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns(bool);
    function transfer(address to, uint256 amount) external returns(bool);
    function balanceOf(address account) external view returns(uint256);
    function approve(address spender, uint256 amount) external returns(bool);
}

interface IRewardToken {
    function mint(address to, uint256 amount) external returns(bool);
    function balanceOf(address account) external view returns(uint256);
    function approve(address spender, uint256 amount) external returns(bool);
}


// this interface allows the use of mint and burn in this contract. 
// As mint and burn aren't standard ERC20, we create a seperate interface for the reciept token 
// becauee we will need to mint the token when staking and also to burn it when withdrawing
interface IRecieptToken {
    function mint(address to, uint256 amount) external returns(bool);
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns(uint256);
}


contract DefiStaking {

    // stakeToken is of type of the interface. which gives this varaible the access to store an ERC20 token. 
    // samething goes with rewardToken.But for recieptToken, It's type is different because this very token has
    // it's own purpose set different than the others. 
    IERC20 public stakeToken; 
    IRewardToken public rewardToken;
    IRecieptToken public recieptToken;

    enum LockPeriod {
        FIVE_MINUTES,
        TEN_MINUTES,
        ONE_HOUR,
        ONE_DAY
    }

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 unlockTime;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardAccrued;
        bool active;
    }


    // tracts how many pools exist
    uint256 public poolCount;


    // pool storage
    mapping (uint256 poolId => uint256) public poolTotalStaked;

    // reward rate per lock period (globally for all pools) 
    mapping (uint256 poolId => uint256 rate) public poolsRewardRate;

    // Lock duration per lock period (in minutes)
    mapping ( uint256 poolId => uint256 lockDuration) public poolsLockDuration;

    // user stake storage
    mapping (uint256 poolId => mapping (address user => mapping (uint256 stakeId => Stake))) public userStakes;

    // track how many pools a user used to stake
    mapping (uint256 poolId => mapping (address user => uint256 count)) public stakeCount;



    // for admin functions
    address public owner;



    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);


    modifier onlyOwner() {
        _onlyOwner();
        _;
    }


    constructor(address _stakedToken, address _rewardToken, address _recieptToken) {
        stakeToken = IERC20(_stakedToken);
        rewardToken = IRewardToken(_rewardToken);
        recieptToken = IRecieptToken(_recieptToken);
        owner = msg.sender;

        createPool(300,   3170979198);   // 300 is the lockDuration in seconds
        createPool(600,   7927447995);   // 600 is the lockDuration in seconds
        createPool(3600,  15854895991);  // 3600 is the lockDuration in seconds
        createPool(86400, 31709791983);  // 86400 is the lockDuration in seconds
    }


    function _onlyOwner() internal view {
        require(msg.sender == owner, "unauthorized access");
    }


    // this is a helper function that looks at how long a user has been staking and how much they staked,
    // then returns how many rewards they've earned since the last time the rewards were updated 
    function calculateReward(uint256 poolId,address user, uint256 stakeId) internal view returns(uint256) {
        Stake storage userStake = userStakes[poolId][user][stakeId];

        if(userStake.amount == 0) return 0;
        uint256 timeElapsed = block.timestamp - userStake.lastUpdateTime;

        uint256 rewards = userStake.amount * userStake.rewardRate * timeElapsed / 1e18;
        return rewards;
    }



    // this view function returns user staked balance
    function getPoolTotalStaked(uint256 poolId) external view returns(uint256) {
        return poolTotalStaked[poolId];
    }


    function getPendingReward(uint256 poolId, uint256 stakeId) external view returns(uint256) {
        Stake storage userStake = userStakes[poolId][msg.sender][stakeId];
        return userStake.rewardAccrued + calculateReward(poolId, msg.sender, stakeId);
    }

    function createPool(uint256 lockDuration, uint256 rewardRate) internal {
        poolsRewardRate[poolCount] = rewardRate;
        poolsLockDuration[poolCount] = lockDuration;
        poolCount++;   
    }

    function stake(uint256 pooId ,uint256 _amount) external  {
        require(_amount > 0, "Must Stake Token greater than Zero");
        require(stakeCount[pooId][msg.sender])


        uint256 stakeId = stakeCount[pooId][msg.sender];

        userStakes[pooId][msg.sender][stakeId] = Stake({
            amount: _amount,
            startTime: block.timestamp,
            unlockTime: block.timestamp + poolsLockDuration[pooId],
            rewardRate: poolsRewardRate[pooId],
            lastUpdateTime: block.timestamp,
            rewardAccrued: 0,
            active: true            
        });


        bool success = stakeToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "Transfer Failed");

        poolTotalStaked[pooId] += _amount;

        recieptToken.mint(msg.sender, _amount);  

        stakeCount[pooId][msg.sender]++;

        emit Staked(msg.sender, _amount);
    }
    
    function withdraw(uint256 poolId, uint256 stakeId) external {
        
        Stake storage stakeStruct = userStakes[poolId][msg.sender][stakeId];
        require(stakeStruct.active, "pool not active");
        require(block.timestamp >= stakeStruct.unlockTime, "Pool still locked");
        
        // uint256 rewardCalculated = calculateReward(poolId, msg.sender, stakeId);
        uint256 totalReward = stakeStruct.rewardAccrued + calculateReward(poolId,msg.sender, stakeId);
        uint256 stakedAmount = stakeStruct.amount;

        stakeStruct.active = false;
        poolTotalStaked[poolId] -= stakedAmount;

        // bool success = stakeToken.transfer(msg.sender, );

        recieptToken.burn(msg.sender, stakedAmount);
        
        bool success = stakeToken.transfer(msg.sender, stakedAmount);
        require(success, "Transfer failed");

        bool success2 = rewardToken.mint(msg.sender ,totalReward);
        require(success2, "Transfer failed");

        emit Withdrawn(msg.sender, stakedAmount);
    }

    function claimRewards(uint256 poolId, uint256 stakeId) external {
        Stake storage stakeStruct = userStakes[poolId][msg.sender][stakeId];

        uint256 rewards = stakeStruct.rewardAccrued + calculateReward(poolId, msg.sender, stakeId);
        require(stakeStruct.active, "pool not active");
        require(rewards > 0, "Insufficient reward");

        stakeStruct.rewardAccrued = 0;
        stakeStruct.lastUpdateTime = block.timestamp;

        bool success = rewardToken.mint(msg.sender, rewards);
        require(success, "Transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    function emergencyWithdraw(uint256 poolId, uint256 stakeId) external {
        Stake storage userStruct = userStakes[poolId][msg.sender][stakeId];
        uint amount = userStruct.amount;

        require(userStruct.active, "pool not active");
        require(amount > 0, "must be greater than zero");

        uint256 penalty = amount * 10/100;
        uint256 amountAfterPenalty = amount - penalty;

        userStruct.active = false;
        userStruct.rewardAccrued = 0;
        poolTotalStaked[poolId] -= amount;

        recieptToken.burn(msg.sender, amount);

        // stakeToken.transfer(msg.sender, amountAfterPenalty);
        bool success1 = stakeToken.transfer(msg.sender, amountAfterPenalty);
        require(success1, "Transfer failed");

        // stakeToken.transfer(owner, penalty);
        bool success2 = stakeToken.transfer(owner, penalty);
        require(success2, "Transfer failed");

        emit EmergencyWithdraw(msg.sender, amount);
    }

    // Real Defi Protocol don't set rewards rate forever at deployment. 
    // Market condition changes. Token prices change.
    // This function gives the owner the ability to increase reward to attract more stakers,
    // and also to decrease reward to protcect the reward token supply
    function updateRewardRate(uint256 poolId, uint256 newRate) external onlyOwner {
        poolsRewardRate[poolId] = newRate;
    }

}