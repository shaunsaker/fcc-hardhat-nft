// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__WithdrawFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  // Type Declarations
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  // Chainlink VRF variables
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUMBER_OF_WORDS = 1;

  // Chainlink VRF helpers
  mapping(uint256 => address) public s_requestIdToSender;

  // NFT variables
  uint256 private s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;

  // TODO: why is s_dogTokenUris marked as storage? Surely it is immutable?
  string[] internal s_dogTokenUris;
  uint256 internal i_mintFee;

  // Events
  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed dogBreed, address minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLane,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris,
    uint256 mintFee
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionId;
    i_gasLane = gasLane;
    i_callbackGasLimit = callbackGasLimit;
    s_tokenCounter = 0;
    s_dogTokenUris = dogTokenUris;
    i_mintFee = mintFee;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft__NeedMoreETHSent();
    }

    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUMBER_OF_WORDS
    );

    // save the requestId and sender address for fulfillRandomWords to correctly allocate nft
    s_requestIdToSender[requestId] = msg.sender;

    emit NftRequested(requestId, msg.sender);

    return requestId;
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    address nftOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;

    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    Breed dogBreed = getBreedFromModdedRng(moddedRng);

    _safeMint(nftOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    s_tokenCounter = s_tokenCounter + 1;
    emit NftMinted(dogBreed, nftOwner);
  }

  // TODO: I had to add payable
  function withdraw() public payable onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}("");

    if (!success) {
      revert RandomIpfsNft__WithdrawFailed();
    }
  }

  function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
    uint256[3] memory chanceArray = getChanceArray();

    if (moddedRng < chanceArray[0]) {
      return Breed.PUG;
    }

    if (moddedRng < chanceArray[1]) {
      return Breed.PUG;
    }

    return Breed.ST_BERNARD;
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 33, MAX_CHANCE_VALUE];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getSenderFromRequestId(uint256 requestId) public view returns (address) {
    return s_requestIdToSender[requestId];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenUri(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }
}
