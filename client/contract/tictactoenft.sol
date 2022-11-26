//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.5.5;

import "@openzeppelin/contracts@2.5.1/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts@2.5.1/drafts/Counters.sol";
import "@openzeppelin/contracts@2.5.1/drafts/Strings.sol";

/** 
 * @title TICTACTOENFT
 * @dev Implements methods to interact with nfts
 */
contract TICTACTOENFT is ERC721Full {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor()  ERC721Full("TTTNFT", "TTN") public {}

    /**
    * @notice safe mint function to reward user for his achievements
    * @param _to user's address
    * @param wins_count nft type, can be for 5 wins or for 10 wins
    * @return uint256
    */
    function safeMint(address to, uint256 wins_count) public returns (uint256){
        _tokenIds.increment();

        string memory uri = "ipfs://QmfY2vW1AoTJneDkRnqsGNmLgerj2koZRQcKfXVGCqtDcQ/";

        uint256 newItemId = _tokenIds.current();

        _mint(to, newItemId);
        // There are only two nfts, so they all will be the same but unique because of different ids
        _setTokenURI(newItemId, string(abi.encodePacked(uri, Strings.fromUint256(wins_count))));

        return newItemId;
    }
}