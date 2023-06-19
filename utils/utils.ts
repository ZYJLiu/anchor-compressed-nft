import { getLeafAssetId } from "@metaplex-foundation/mpl-bubblegum"
import {
  SPL_NOOP_PROGRAM_ID,
  deserializeChangeLogEventV1,
} from "@solana/spl-account-compression"
import { Connection, PublicKey } from "@solana/web3.js"
import BN from "bn.js"
import base58 from "bs58"
import fetch from "node-fetch"
import dotenv from "dotenv"
dotenv.config()

export async function extractAssetId(
  connection: Connection,
  txSignature: string,
  treeAddress: PublicKey,
  programId: PublicKey
) {
  // Get the transaction info using the tx signature
  const txInfo = await connection.getTransaction(txSignature, {
    maxSupportedTransactionVersion: 0,
  })

  // Function to check the program Id of an instruction
  const isProgramId = (instruction, programId) =>
    txInfo?.transaction.message.staticAccountKeys[
      instruction.programIdIndex
    ].toBase58() === programId

  // Find the index of the program instruction
  const relevantIndex =
    txInfo!.transaction.message.compiledInstructions.findIndex((instruction) =>
      isProgramId(instruction, programId.toBase58())
    )

  // If there's no matching instruction, exit
  if (relevantIndex < 0) {
    return
  }

  // Get the inner instructions related to the program instruction
  const relevantInnerInstructions =
    txInfo!.meta?.innerInstructions?.[relevantIndex].instructions

  // Filter out the instructions that aren't no-ops
  const relevantInnerIxs = relevantInnerInstructions.filter((instruction) =>
    isProgramId(instruction, SPL_NOOP_PROGRAM_ID.toBase58())
  )

  // Locate the asset index by attempting to locate and parse the correct `relevantInnerIx`
  let assetIndex
  // Note: the `assetIndex` is expected to be at position `1`, and we normally expect only 2 `relevantInnerIx`
  for (let i = relevantInnerIxs.length - 1; i >= 0; i--) {
    try {
      // Try to decode and deserialize the instruction
      const changeLogEvent = deserializeChangeLogEventV1(
        Buffer.from(base58.decode(relevantInnerIxs[i]?.data!))
      )

      // extract a successful changelog index
      assetIndex = changeLogEvent?.index

      // If we got a valid index, no need to continue the loop
      if (assetIndex !== undefined) {
        break
      }
    } catch (__) {}
  }

  const assetId = await getLeafAssetId(treeAddress, new BN(assetIndex))

  console.log("Asset ID:", assetId.toBase58())

  return assetId
}

export async function heliusApi(method, params) {
  const response = await fetch(process.env.RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "my-id",
      method,
      params,
    }),
  })
  const { result } = await response.json()
  return result
}
