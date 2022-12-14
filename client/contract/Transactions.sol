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

    address private owner_ = 0x205D8006383Bd92785e29DDaf398D92c65EE7020;
    
    /**
     * @notice function to verify if signer is an owner of a contract to avoid access to a contract
     * @return bool
     */
    function verify_signer(bytes32 _ethSignedMessageHash, bytes memory _signature)
        private
        view
        returns (bool)
    {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);

        address signer = ecrecover(_ethSignedMessageHash, v, r, s);

        if (signer == owner_) {
            return true;
        }

        return false;
    }

    function splitSignature(bytes memory sig)
        private
        pure
        returns (
            bytes32 r,
            bytes32 s,
            uint8 v
        )
    {
        require(sig.length == 65, "invalid signature length");

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        // implicitly return (r, s, v)
    }

    /**
    * @notice function to deposit funds from user's balance to the contract
    */
    function deposit() external payable{ }

    /**
    * @notice function to withdraw(reward) funds from the contract balance to user
    * @param _to user's address
    * @param _amount withdraw funds amount
    * @param win_history string contains user's marks(X or O) to show winnings history in the profile
    * @param _h signed message hash, needs to verify a message
    * @param _s signature hash, needs to check if user allowed to mint an nft(if transaction was signed by owner)
    */
    function withdraw(address payable _to, uint _amount, string memory win_history, bytes32 _h, bytes memory _s) external {
        require(verify_signer(_h, _s), "You are not allowed to access this contract");
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
