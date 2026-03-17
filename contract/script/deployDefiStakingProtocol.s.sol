// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

 
import {Script, console} from "forge-std/Script.sol";
import {DefiStaking} from "../src/defiStaking.sol";
import {RecieptERC20} from "../src/receipt.sol";
import {RewardERC20} from "../src/reward.sol";
 
contract DeployScript is Script {
    function run() public {

    
        address savyX = 0x71cE14F027A03b36CA138de7B927fC4407f199B9;
        address rewardX = 0xA42Ab10295285036Da2d511D30c7c63ba36e302C;
        address receiptX =  ;
 
        vm.startBroadcast();
        
        DefiStaking stakingProtocol = new DefiStaking(savyX, rewardX, receiptX);
        console.log("Contract deployed at:", address(stakingProtocol));


        RecieptERC20(receiptX).setPool(address(stakingProtocol));
        RewardERC20(rewardX).setPool(address(stakingProtocol));

        
        vm.stopBroadcast();
    }
}