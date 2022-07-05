import { expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { isDevelopment } from "../../helper-hardhat-config"
import { BasicNft } from "../../typechain"

!isDevelopment
  ? describe.skip
  : describe("BasicNft Unit Tests", () => {
      let deployer: string
      let basicNFT: BasicNft

      beforeEach(async () => {
        const namedAccounts = await getNamedAccounts()
        deployer = namedAccounts.deployer

        await deployments.fixture(["all"])

        basicNFT = await ethers.getContract("BasicNft", deployer)
      })

      describe("constructor", () => {
        it("initialises correctly", async () => {
          const tokenCounter = await basicNFT.getTokenCounter()

          expect(tokenCounter.toString()).to.equal("0")
        })
      })

      describe("mintNFT", () => {
        it("mints an NFT correctly", async () => {
          const tokenCounter = await basicNFT.getTokenCounter()
          const tx = await basicNFT.mintNft()
          await tx.wait(1)

          const tokenOwner = await basicNFT.ownerOf(tokenCounter)
          expect(tokenOwner).to.equal(deployer)

          const newTokenCounter = await basicNFT.getTokenCounter()
          expect(newTokenCounter.toString()).to.equal("1")
        })
      })
    })
