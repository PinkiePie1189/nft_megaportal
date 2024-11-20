# BPDA Assignment, Trading Card Game
### Preoteasa Mircea-Costin, SAS2


## Summary

This project aims to implement an API which can be used to interact with a
smart contract deployed on the MultiversX blochain. The API, implemented in
**Flask** is used by a simple frontend implemented using the **React** framework.

## Implementation

The **Flask** API exposes the following endpoints:

*  `GET /getYourNftCardProperties`: 
    Makes a transaction to the corresponding smart contract function, which
    chooses a random card from the list of unclaimed ones and returns, assigns it
    to the callers' address and returns the card's properties. The endpoint decodes
    the card's hex-encoded properties into their respective enum variant and also
    calculates the correspoding position in the list of NFTs
    (by performing a query to the `nftSupply` view, will be explained later)

* `GET /getAssignedCard`:
    Returns the assigned card of the callers' address once the previous endpoint
    has been called, by querying the `studentCards` view.

* `GET /findMatchingNft`
    Find the position of the assigned card in the NFT list by querying `studentCards` and `NFT supply`

* `GET /nftSupply`:
    Returns a list of the available NFTs. Since we are treating the contract as a
    blackbox, thus not using the ABI, each NFT is parsed at byte-level to retrieve
    the attributes.

* `POST /createNftCollection`:
    Creates an NFT collection by invoking the `issueNonFungible` function from the
    ESDT contract, having the collection name and ticker supplied as JSON 
    parameters. Another transaction invoking `setSpecialRoles` is also issued to
    set `ESDTLocalMint` and `ESDTLocalBurn` roles to the collection. Returns
    the created collection id.

* `POST /issueNFT`:
    Creates an NFT by invoking `ESDTNFTCreate`, with supplied collection id, name
    and attributes. Returns the collection id and the nonce of the issued NFT.

* `POST /exchange`:
    Makes a transaction to the `exchangeNft` smart contract function, with the
    supplied destination nonce as argument (as returned by `getYourNftCardProperties`)
    and a token with the supplied ID and nonce as transfer.

* `GET /getCardHistory, /createCollectionHistory, /issueNftHistory, /exchangeHistory:`:
    Return data of historical calls to their respective endpoints, also including
    the sender address.


The **React** frontend `NFT Megaportal` consists of three React components, namely:

* `NftTrader`, which guides the user through the flow of the main application,
allowing them to perform an exchange.
* `NftTable`, which displays the table of available NFTs.
* `Transaction History`, which shows historical uses of transaction-issuing endpoints.

## Challenges faced

* The `multiversx-sdk` Python SDK is not perfectly documented in the Cookbook,
    references to its source code were necessary. This also applies to the ESDT
    token internal structure, which also required references to the MultiversX
    source code
* The transaction / query difference wasn't explained until the lab held at 
the start of the second week of a two-week assignment