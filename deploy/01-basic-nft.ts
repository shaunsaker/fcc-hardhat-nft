import { HardhatRuntimeEnvironment } from "hardhat/types"
import { BLOCK_CONFIRMATIONS, isDevelopment } from "../helper-hardhat-config"
import { verify } from "../utils/verify"

module.exports = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment): Promise<void> => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const basicNFTArgs: string[] = []
  const basicNFT = await deploy("BasicNft", {
    from: deployer,
    args: basicNFTArgs,
    log: true,
    waitConfirmations: !isDevelopment ? BLOCK_CONFIRMATIONS : 1,
  })

  if (!isDevelopment && process.env.ETHERSCAN_API_KEY) {
    log("Verifying...")

    await verify(basicNFT.address, basicNFTArgs)
  }

  log("--------------------------------")
}

module.exports.tags = ["all", "basic-nft"]
