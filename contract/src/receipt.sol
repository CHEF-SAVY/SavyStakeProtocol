// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RecieptERC20 {

    // name of the ercToken created
    string public name;
    // symbol of the ercToken created
    string public symbol;
    // decimal points to add to the erc20Token created
    uint8 public decimals;

    // this is the totalSupply of the erc20Token that will be ever be issued
    uint256 private _totalSupply;

    address public owner;

    address public pool;



    modifier onlyOwner {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not authorized");
    }


    modifier onlyPool {
        _onlyPool();
        _;
    }

    function _onlyPool() internal view {
        require(msg.sender == pool, "Not authorized");
    }


    // this maps the the address of whoever is minting the token, to the amount minted
    mapping (address => uint256) private _balances;

    mapping (address => mapping (address => uint256)) private _allowances;

    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;

        _mint(msg.sender, initialSupply);
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns(uint256) {
        return _balances[account];
    }

    function allowances(address account, address spender) external view returns(uint256) {
        return _allowances[account][spender];
    }


    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "transfer to zero address");
        
        uint256 senderBalance = _balances[from];
        require(senderBalance >= amount, "insufficient funds");

        unchecked {
            _balances[from] = senderBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "cannot mint to address 0");

        _totalSupply += amount;
        _balances[account] += amount;

        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(_balances[account] >= amount, "insufficient funds");

        _totalSupply -= amount;
        _balances[account] -= amount;

        emit Transfer(account, address(0), amount);
    }

    function burn(address account, uint256 amount) external onlyPool returns(bool) {
        _burn(account, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns(bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // function transferFrom(address from, address to, uint256 amount) external returns(bool) {
    //     revert("Receipt token is non-transferable");
    // }

    // function transfer(address to, uint256 amount) external returns(bool) {
    // //    revert("Receipt token is non-transferable");
    // // }

    function mint(address account, uint256 amount) external onlyPool returns(bool) {
        _mint(account, amount);
        return true;
    }


    function setPool(address _pool) external onlyOwner{
        pool = _pool;
    }
    

}