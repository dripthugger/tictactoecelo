//SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";



interface ITransactions {
    function winsCount(address _user) external view returns(uint);
}

/**
 * @title TICTACTOENFT
 * @dev Implements methods to interact with nfts
 */
contract TICTACTOENFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public transactionAddress;

    constructor(address _transactionAddress) ERC721("TTTNFT", "TTN") {
        transactionAddress = _transactionAddress;
    }


    /**
        * @dev allow the smart contract's owner to update the transaction smart contract's address
     */
    function updateTransactionAddress(address _transactionAddress) public onlyOwner{
        transactionAddress = _transactionAddress;
    }


    /**
    * @dev NFTs can only be minted if to has 5 or 10 wins
     * @notice safe mint function to reward user for his achievements
     * @param to user's address
     * @return uint256
     */
    function safeMint(address to) public returns (uint256) {
        uint256 wins_count = ITransactions(transactionAddress).winsCount(msg.sender);
        require(wins_count == 5 || wins_count == 10);
        _tokenIds.increment();

        string
            memory uri = "ipfs://QmfY2vW1AoTJneDkRnqsGNmLgerj2koZRQcKfXVGCqtDcQ/";

        uint256 newItemId = _tokenIds.current();

        _mint(to, newItemId);
        // There are only two nfts, so they all will be the same but unique because of different ids
        _setTokenURI(
            newItemId,
            string(abi.encodePacked(uri, Strings.toString(wins_count)))
        );

        return newItemId;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}