import { Button } from "@chakra-ui/react"
import { PublicKey } from "@solana/web3.js"
import { cNftProgram as program, nft } from "../utils/setup"
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
          "3qtDptmCQ8LUNBifHNWMLsQ8ueG4hwSU6deUj5b9CV8y"
        ),
        treeAuthority: new PublicKey(
          "3aU3PXWtPDAZUvaKNAo8hH4gwjQKcDQhh323K2gFdh1x"
        ),
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumSigner: bubblegumSigner,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

        collectionMint: new PublicKey(
          "6HSCi45SUfUCFX6vnyKCA5fwBEgnUZV2ALuUrPXRBg9q"
        ),
        collectionMetadata: new PublicKey(
          "EcCsMe7MP6XCfFPcuMDB1jyVX3ibW8vtQaS6fQeZfAqB"
        ),
        editionAccount: new PublicKey(
          "3LUjNV2MGBMbUqgtiyFpmQE1N6RbSkHaCHH5Jtf6b8Rb"
        ),
      })
      .transaction()

    sendTransaction(transaction, connection)
  }

  return <Button onClick={onClick}>Mint CNFT</Button>
}
