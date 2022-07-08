import * as path from "path"
import * as fs from "fs"
import pinataSDK, { PinataPinResponse } from "@pinata/sdk"

const pinata = pinataSDK(process.env.PINATA_API_KEY || "", process.env.PINATA_API_SECRET || "")

export type NFT_METADATA = {
  name: string
  description: string
  image: string
  attributes: Record<string, string>[]
}

export const storeImages = async (
  imagesFilePath: string
): Promise<{ responses: PinataPinResponse[]; files: string[] }> => {
  console.log("Uploading images to Pinata...")
  const fullImagesPath = path.resolve(imagesFilePath)
  const files = fs.readdirSync(fullImagesPath)
  let responses: PinataPinResponse[] = []

  for (const fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)

    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile)

      responses.push(response)
    } catch (error) {
      console.error(error)
    }
  }

  console.log("--------------------------------")

  return { responses, files }
}

export const storeTokenUriMetadata = async (
  metadata: NFT_METADATA
): Promise<PinataPinResponse | null> => {
  console.log(`Uploading ${metadata.name} metadata to Pinata...`)

  try {
    const response = await pinata.pinJSONToIPFS(metadata)

    console.log("--------------------------------")

    return response
  } catch (error) {
    console.error(error)

    return null
  }
}
