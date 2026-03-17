// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

 
import {Script, console} from "forge-std/Script.sol";
import {SavyXERC20} from "../src/savyX.sol";
 
contract DeployScript is Script {
    function run() public {
        uint256 initialSupply = (uint256(1_000_000 ether)); 
 
        vm.startBroadcast();
        
        SavyXERC20 stakedToken = new SavyXERC20("savyX", "svx", 18, initialSupply);
        console.log("Token deployed at:", address(stakedToken));
        console.log("Initial supply:", initialSupply);
        
        vm.stopBroadcast();
    }
}