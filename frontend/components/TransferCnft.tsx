// not working, wallet displays error when trying to send transaction
import { Button, Input, VStack } from "@chakra-ui/react"
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
// import { connection } from "../utils/setup"
import axios from "axios"
import { useState } from "react"

export default function TransferCnft(asset: any) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [transferAddress, setTransferAddress] = useState("")

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTransferAddress(e.target.value)

  const onClick = async () => {
    if (!publicKey) return
    // console.log(JSON.stringify(asset, null, 2))

    const { data } = await axios.post(process.env.NEXT_PUBLIC_RPC_URL!, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetProof",
      params: {
        id: asset.asset.id,
      },
    })

    const { data: data2 } = await axios.post(process.env.NEXT_PUBLIC_RPC_URL!, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAsset",
      params: {
        id: asset.asset.id,
      },
    })

    const assetProof = data.result
    const assetData = data2.result
    const treeAddress = new PublicKey(assetData.compression.tree)
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      treeAddress
    )
    const treeAuthority = treeAccount.getAuthority()
    const canopyDepth = treeAccount.getCanopyDepth()
    const proofPath: AccountMeta[] = assetProof.proof
      .map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
      }))
      .slice(0, assetProof.proof.length - (!!canopyDepth ? canopyDepth : 0))

    const root = Array.from(new PublicKey(assetProof.root.trim()).toBytes())
    const dataHash = Array.from(
      new PublicKey(assetData.compression.data_hash.trim()).toBytes()
    )
    const creatorHash = Array.from(
      new PublicKey(assetData.compression.creator_hash.trim()).toBytes()
    )

    const nonce = assetData.compression.leaf_id
    const index = assetData.compression.leaf_id

    const transaction = await program.methods
      .transferCompressedNft(root, dataHash, creatorHash, new BN(nonce), index)
      .accounts({
        leafOwner: publicKey,
        leafDelegate: publicKey,
        newLeafOwner: new PublicKey(transferAddress), // transfer to self to test
        // newLeafOwner: publicKey, // transfer to self to test
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
