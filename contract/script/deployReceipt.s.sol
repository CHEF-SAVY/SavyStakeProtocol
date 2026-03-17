// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

 
import {Script, console} from "forge-std/Script.sol";
import {RecieptERC20} from "../src/receipt.sol";
 
contract DeployScript is Script {
    function run() public {
        uint256 initialSupply = 0; 
 
        vm.startBroadcast();
        
        RecieptERC20 receiptToken = new RecieptERC20("RECEIPTX", "REX", 18, 0);
        console.log("RewardToken deployed at:", address(receiptToken));
        console.log("Initial supply:", initialSupply);
        
        vm.stopBroadcast();
    }
}