import { expect } from "chai"
import { BigNumber, Event } from "ethers"
import { Result } from "ethers/lib/utils"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { Receipt } from "hardhat-deploy/dist/types"
import { isDevelopment, networkConfig } from "../../helper-hardhat-config"
import { RandomIpfsNft } from "../../typechain"
import { VRFCoordinatorV2Mock } from "../../typechain/VRFCoordinatorV2Mock"
import { getRequestIdFromTxReceipt } from "../../utils/getRequestIdFromTxReceipt"
import { fastForwardToNewBlock } from "../utils/fastForwardToNewBlock"

!isDevelopment
  ? describe.skip
  : describe("RandomIpfsNft Unit Tests", () => {
      let deployer: string
      let randomIpfsNft: RandomIpfsNft
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock
      let mintFee: BigNumber

      const networkName = "hardhat"

      beforeEach(async () => {
        const namedAccounts = await getNamedAccounts()
        deployer = namedAccounts.deployer

        await deployments.fixture(["all"])

        randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        mintFee = await randomIpfsNft.getMintFee()
      })

      describe("constructor", () => {
        it("initialises the randomIpfsNft correctly", async () => {
          // TODO: test the rest of the constructor variables
          const tokenCounter = await randomIpfsNft.getTokenCounter()

          expect(tokenCounter.toString()).to.equal("0")
        })
      })

      describe("requestNft", () => {
        it("throws an error if the mint fee was not sent", async () => {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
            "RandomIpfsNft__NeedMoreETHSent"
          )
        })

        it("stores the requestId with the sender address", async () => {
          const tx = await randomIpfsNft.requestNft({ value: mintFee })
          const txReceipt = await tx.wait(1)
          const requestId = getRequestIdFromTxReceipt(txReceipt)

          expect(await randomIpfsNft.getSenderFromRequestId(requestId)).to.equal(deployer)
        })

        it("emits an event on requestNft", async () => {
          await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
            randomIpfsNft,
            "NftRequested"
          )
        })
      })

      describe("fulfillRandomWords", () => {
        let requestId: BigNumber

        beforeEach(async () => {
          const requestNftTx = await randomIpfsNft.requestNft({ value: mintFee })
          const requestNftTxReceipt = await requestNftTx.wait(1)
          requestId = getRequestIdFromTxReceipt(requestNftTxReceipt)
        })

        it("increments the token counter", async () => {
          const tx = await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
          await tx.wait(1)

          expect((await randomIpfsNft.getTokenCounter()).toString()).to.equal("1")
        })

        it("emits an event", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address)
          ).to.emit(randomIpfsNft, "NftMinted")
        })
      })
    })
