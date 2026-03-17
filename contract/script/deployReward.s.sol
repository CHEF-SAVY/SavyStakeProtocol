// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

 
import {Script, console} from "forge-std/Script.sol";
import {RewardERC20} from "../src/reward.sol";
 
contract DeployScript is Script {
    function run() public {
        uint256 initialSupply = 0; 
 
        vm.startBroadcast();
        
        RewardERC20 rewardToken = new RewardERC20("RewardX", "RWDX", 18,0);
        console.log("Token deployed at:", address(rewardToken));
        console.log("Initial supply:", initialSupply);
        
        vm.stopBroadcast();
    }
}