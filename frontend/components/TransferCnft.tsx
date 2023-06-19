import { Button, Input, VStack } from "@chakra-ui/react"
import { PublicKey, AccountMeta } from "@solana/web3.js"
import { cNftProgram as program, treeAddress } from "../utils/setup"
import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  ConcurrentMerkleTreeAccount,
} from "@solana/spl-account-compression"
import { BN } from "@project-serum/anchor"
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useState } from "react"
import { heliusApi } from "../utils/utils"

export default function TransferCnft(asset: any) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [transferAddress, setTransferAddress] = useState("")

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTransferAddress(e.target.value)

  const onClick = async () => {
    if (!publicKey) return

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
      .transferCompressedNft(
        Array.from(new PublicKey(root.trim()).toBytes()),
        Array.from(new PublicKey(compression.data_hash.trim()).toBytes()),
        Array.from(new PublicKey(compression.creator_hash.trim()).toBytes()),
        new BN(compression.leaf_id),
        compression.leaf_id
      )
      .accounts({
        leafOwner: ownerPublicKey,
        leafDelegate: delegatePublicKey,
        newLeafOwner: new PublicKey(transferAddress), // transfer to self to test
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
      <Input
        value={transferAddress}
        placeholder="Enter Address"
        maxLength={44}
        onChange={handleInput}
        w="140px"
      />
      <Button onClick={onClick}>Transfer CNFT</Button>
    </VStack>
  )
}
