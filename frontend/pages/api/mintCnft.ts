import { NextApiRequest, NextApiResponse } from "next"
import { PublicKey, Transaction } from "@solana/web3.js"
import { connection, cNftProgram as program, collectionNft, treeAddress } from "../../utils/setup"

import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression"
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"

type InputData = {
  account: string
}

type GetResponse = {
  label: string
  icon: string
}

export type PostResponse = {
  transaction: string
  message: string
}

export type PostError = {
  error: string
}

function get(res: NextApiResponse<GetResponse>) {
  res.status(200).json({
    label: "My Store",
    icon: "https://solana.com/src/img/branding/solanaLogoMark.svg",
  })
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<PostResponse | PostError>
) {
  const { account } = req.body as InputData
  console.log(req.body)
  if (!account) {
    res.status(400).json({ error: "No account provided" })
    return
  }

  const { reference } = req.query
  if (!reference) {
    console.log("Returning 400: no reference")
    res.status(400).json({ error: "No reference provided" })
    return
  }

  try {
    const mintOutputData = await postImpl(
      new PublicKey(account),
      new PublicKey(reference)
    )
    res.status(200).json(mintOutputData)
    return
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "error creating transaction" })
    return
  }
}

async function postImpl(
  account: PublicKey,
  reference: PublicKey
): Promise<PostResponse> {
  // pda tree delegate
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("AUTH")],
    program.programId
  )

  // tree authority
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeAddress.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )


  // bubblegum signer
  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  )

  const instruction = await program.methods
    .mintCompressedNft()
    .accounts({
      payer: account,
      pda: pda,
      merkleTree: treeAddress,
      treeAuthority: treeAuthority,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumSigner: bubblegumSigner,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

      collectionMint: collectionNft.mintAddress,
      collectionMetadata: collectionNft.metadataAddress,
      editionAccount: collectionNft.masterEditionAddress,
    })
    .instruction()

  instruction.keys.push({
    pubkey: reference,
    isSigner: false,
    isWritable: false,
  })

  // Convert to transaction
  const latestBlockhash = await connection.getLatestBlockhash()
  // const transaction = await transactionBuilder.toTransaction(latestBlockhash)

  // create new Transaction
  const transaction = new Transaction({
    recentBlockhash: latestBlockhash.blockhash,
    feePayer: account,
  })

  // add instruction to transaction
  transaction.add(instruction)

  // Serialize the transaction and convert to base64 to return it
  const serializedTransaction = transaction.serialize({
    requireAllSignatures: false, // account is a missing signature
  })
  const base64 = serializedTransaction.toString("base64")

  const message = "Please approve the transaction to mint your NFT!"

  // Return the serialized transaction
  return {
    transaction: base64,
    message,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetResponse | PostResponse | PostError>
) {
  if (req.method === "GET") {
    return get(res)
  } else if (req.method === "POST") {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: "Method not allowed" })
  }
}
