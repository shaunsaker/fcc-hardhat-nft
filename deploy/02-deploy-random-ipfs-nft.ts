import { ethers, network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { BLOCK_CONFIRMATIONS, isDevelopment, networkConfig } from "../helper-hardhat-config"
import { NFT_METADATA, storeImages, storeTokenUriMetadata } from "../utils/uploadToPinata"
import { verify } from "../utils/verify"

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2")
const IMAGES_LOCATION = "./images/randomNft"

const handleTokenUris = async (): Promise<string[]> => {
  let tokenUris: string[] = []

  // store the image in IPFS (via Pinata)
  const { responses: imageUploadResponses, files } = await storeImages(IMAGES_LOCATION)

  // store the metadata in IPFS
  for (const index in imageUploadResponses) {
    // create the metadata
    const name = files[index].replace(".png", "")
    const tokenUriMetadata: NFT_METADATA = {
      name,
      description: `An adorable ${name}`,
      image: `ipfs://${imageUploadResponses[index].IpfsHash}`,
      attributes: [],
    }

    // upload it
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)

    if (metadataUploadResponse) {
      tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
  }

  console.log(tokenUris)

  return tokenUris
}

let tokenUris: string[] = [
  "ipfs://QmfKcsfPiYb7crjRdhfxvxrSUTFfxa9hVGk3aF6uRX9S4H",
  "ipfs://QmQxU61Fth3xvuw4RPLqrJrPWLZNSCXscyEmdcYTS6XMJz",
  "ipfs://QmVTec3TXgvfXTUfUov2UGLRoKs2hSSixXzDLkkwi9ctaP",
]

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment): Promise<void> => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  let vrfCoordinatorV2Address
  let subscriptionId

  // get the Ipfs hashes of our images
  if (process.env.UPLOAD_TO_PINATA) {
    tokenUris = await handleTokenUris()
  }

  if (isDevelopment) {
    // get the mock contract address
    const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address

    // get the subscriptionId
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
    const transactionReceipt = await transactionResponse.wait(1)
    subscriptionId = transactionReceipt.events[0].args.subId

    // fund the subscription
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
  } else {
    vrfCoordinatorV2Address = networkConfig[network.name].vrfCoordinatorV2
    subscriptionId = networkConfig[network.name].subscriptionId
  }

  const gasLane = networkConfig[network.name].gasLane
  const callbackGasLimit = networkConfig[network.name].callbackGasLimit
  const mintFee = networkConfig[network.name].mintFee

  const contractArgs = [
    vrfCoordinatorV2Address,
    subscriptionId,
    gasLane,
    callbackGasLimit,
    tokenUris,
    mintFee,
  ]
  const contract = await deploy("RandomIpfsNft", {
    from: deployer,
    args: contractArgs,
    log: true,
    waitConfirmations: !isDevelopment ? BLOCK_CONFIRMATIONS : 1,
  })

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    // verify the contract if not in development
    await verify(contract.address, contractArgs)
  }

  log("--------------------------------")
}

module.exports.tags = ["all", "randomIpfsNft"]
