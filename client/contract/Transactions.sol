//SPDX-License-Identifier: GPL-3.0
/*
    This is the main contract, it can reward user, get a deposit from user,
    get user's and contract's address and balance
*/
pragma solidity >=0.8.7;

/** 
 * @title Transactions
 * @dev Implements methods to interact with user
 */
contract Transactions {

    /**
    * @notice function to deposit funds from user's balance to the contract
    */
    function deposit() external payable{ }

    /**
    * @notice function to withdraw(reward) funds from the contract balance to user
    * @param _to user's address
    * @param _amount withdraw funds amount
    * @param win_history string contains user's marks(X or O) to show winnings history in the profile
    */
    function withdraw(address payable _to, uint _amount, string memory win_history) external {
        require(address(this).balance > _amount, "insufficient contract balance");
        _to.transfer(_amount);
    }

    /**
    * @notice function that shows a balance of the contract
    * @return uint
    */
    function getBalance() external view returns(uint) {
        return address(this).balance;
    }

    /**
    * @notice function returns a contract address
    * @return address
    */
    function getAddress() external view returns(address) {
        return address(this);
    }

    /**
    * @notice function returns user's address
    * @return address
    */
    function getUserAddress() external view returns(address) {
        return msg.sender;
    }

}
