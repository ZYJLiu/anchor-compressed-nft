import { Button } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import {
  cNftProgram as program,
  collectionNft,
  treeAddress,
} from "../utils/setup"
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

  // tree authority
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeAddress.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )

  const onClick = async () => {
    if (!publicKey) return

    const transaction = await program.methods
      .mintCompressedNft()
      .accounts({
        payer: publicKey,
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
      .transaction()

    sendTransaction(transaction, connection)
  }

  return <Button onClick={onClick}>Mint CNFT</Button>
}
