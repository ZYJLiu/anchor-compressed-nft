// Not working correctly, transction goes through but the CNFT is not burned
// custom program error: 0x1771
import { Button, VStack } from "@chakra-ui/react"
import { PublicKey, AccountMeta } from "@solana/web3.js"
import { cNftProgram as program } from "../utils/setup"
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  ConcurrentMerkleTreeAccount,
} from "@solana/spl-account-compression"
import { BN } from "@project-serum/anchor"
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { treeAddress } from "../utils/setup"
import { heliusApi } from "../utils/utils"

export default function BurnCnft(asset: any) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const onClick = async () => {
    if (!publicKey) return
    // console.log(JSON.stringify(asset, null, 2))

    const [assetData, assetProofData] = await Promise.all([
      heliusApi("getAsset", { id: asset.asset.id }),
      heliusApi("getAssetProof", { id: asset.asset.id }),
    ])

    const { compression, ownership } = assetData
    const { proof, root } = assetProofData

    const treePublicKey = new PublicKey(compression.tree)
    const ownerPublicKey = new PublicKey(ownership.owner)
    const delegatePublicKey = ownership.delegate
      ? new PublicKey(ownership.delegate)
      : ownerPublicKey

    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      treePublicKey
    )
    const treeAuthority = treeAccount.getAuthority()
    const canopyDepth = treeAccount.getCanopyDepth() || 0

    const proofPath: AccountMeta[] = proof
      .map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
      }))
      .slice(0, proof.length - canopyDepth)

    const transaction = await program.methods
      .burnCompressedNft(
        Array.from(new PublicKey(root.trim()).toBytes()),
        Array.from(new PublicKey(compression.data_hash.trim()).toBytes()),
        Array.from(new PublicKey(compression.creator_hash.trim()).toBytes()),
        new BN(compression.leaf_id),
        compression.leaf_id
      )
      .accounts({
        leafOwner: ownerPublicKey,
        leafDelegate: delegatePublicKey,
        merkleTree: treeAddress,
        treeAuthority: treeAuthority,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .remainingAccounts(proofPath)
      .transaction()

    // console.log(JSON.stringify(transaction, null, 2))
    sendTransaction(transaction, connection)
  }

  return (
    <VStack>
      <Button onClick={onClick}>Burn CNFT</Button>
    </VStack>
  )
}
