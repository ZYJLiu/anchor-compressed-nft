import { Button } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import { cNftProgram as program } from "../utils/setup"
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression"
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"

export default function MintCnft() {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("AUTH")],
    program.programId
  )

  // bubblegum signer
  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  )

  const onClick = async () => {
    if (!publicKey) return
    const transaction = await program.methods
      .mintCompressedNft()
      .accounts({
        payer: publicKey,
        pda: pda,
        merkleTree: new PublicKey(
          "FWjK7ww2gmmZVjbwhc2VHeLkpUKKTxG2USfRsA48TSya"
        ),
        treeAuthority: new PublicKey(
          "JBQw2zdKooAMxXMJpDXoYc9XxcrtMfqV11HE2ES7CBBJ"
        ),
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumSigner: bubblegumSigner,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

        collectionMint: new PublicKey(
          "9VWPFjB7uniVsZVgyf3a8HoCTCAJ8mRooKJLRXXSbDsg"
        ),
        collectionMetadata: new PublicKey(
          "8UqZLAftuaht1RGbBT47e6Jo9C2iFw5YY988SYLbRvms"
        ),
        editionAccount: new PublicKey(
          "G9SKThhp2PAyk4k3S8pt64yZoEEb9kKzFSuzSyeBAjpc"
        ),
      })
      .transaction()

    sendTransaction(transaction, connection)
  }

  return <Button onClick={onClick}>Mint CNFT</Button>
}
