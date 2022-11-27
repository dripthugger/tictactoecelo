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

    uint gamesLength;

    uint winBounty = 0.1 ether;

    struct Game {
        address playerOne;
        address playerTwo;
        bytes32 hashedSecretPhrase;
        address winner;
        bool over;
    }

    mapping(uint => Game) public games;
    mapping(address => bool) public ingame;
    mapping(address => uint) public winsCount;


    /**
    * @notice function to deposit funds from user's balance to the contract
    * @return uint256
    */
    function deposit() external payable returns (uint256){
    }


    /**
        * @dev allows a user to start a game
        * @param secretPhrase a secret phrase to be provided to join game
     */
    function startGame(string calldata secretPhrase) public {
        require(!ingame[msg.sender], "User is already participating in a game");
        require(bytes(secretPhrase).length > 0, "Empty secret phrase");
        ingame[msg.sender] = true;
        bytes32 _hashedSecretPhrase = keccak256(abi.encode(secretPhrase));
        games[gamesLength] = Game(msg.sender, address(0),  _hashedSecretPhrase, address(0), false);
        gamesLength++;
    }

    /**
        * @dev allows a user to join a game
        * @param secretPhrase a secret phrase to be provided to join game
     */
    function joinGame(string calldata secretPhrase, uint _index) public{
        require(!ingame[msg.sender], "User is already participating in a game");
        Game storage currentGame = games[_index];
        bytes32 _hashedSecretPhrase = keccak256(abi.encode(secretPhrase));
        require(currentGame.hashedSecretPhrase == _hashedSecretPhrase, "Incorrect secret phrase");
        require(currentGame.playerOne != address(0) && !currentGame.over, "Game is over");
        require(currentGame.playerTwo == address(0), "No spot is available for this game");
        require(currentGame.playerOne != msg.sender, "You can't play versus yourself");
        currentGame.playerTwo = msg.sender;
        ingame[msg.sender] = true;
    }

    /**
    * @notice function to withdraw(reward) funds from the contract balance to winner and end a game
    * @param _winner address of the winner
    */
    function endAndWithdraw(string calldata secretPhrase, uint _index, address _winner) external payable {
        Game storage currentGame = games[_index];
        bytes32 _hashedSecretPhrase = keccak256(abi.encode(secretPhrase));
        require(currentGame.playerOne != address(0) && currentGame.playerTwo != address(0) && !currentGame.over, "Game is over");
        require(currentGame.hashedSecretPhrase == _hashedSecretPhrase, "Incorrect secret phrase");
        require(currentGame.playerOne == _winner || currentGame.playerTwo == _winner, "Incorrect winner address");
        currentGame.over = true;
        currentGame.winner = _winner;
        winsCount[_winner]++;
        ingame[currentGame.playerOne] = false;
        ingame[currentGame.playerTwo] = false;
        (bool success, ) = payable(_winner).call{value:winBounty}("");
        require(success, "Transfer failed");
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


}