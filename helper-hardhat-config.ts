import { network } from "hardhat"

export const networkConfig: {
  [name: string]: {
    vrfCoordinatorV2: string
    gasLane: string
    subscriptionId: string
    callbackGasLimit: string
    mintFee: string
  }
} = {
  hardhat: {
    vrfCoordinatorV2: "", // mocked
    // this is mocked but it fails if we don't use a valid hex string
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "", // mocked
    callbackGasLimit: "500000",
    mintFee: "10000000000000000", // 0.01
  },
  rinkeby: {
    vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "7542",
    callbackGasLimit: "500000",
    mintFee: "10000000000000000",
  },
}

export const developmentChains = ["hardhat", "localhost"]

export const isDevelopment = developmentChains.includes(network.name)

export const DECIMALS = 8

export const INITIAL_ETH_USD_PRICE = 200000000000

export const BLOCK_CONFIRMATIONS = 6
