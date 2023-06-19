import * as anchor from "@project-serum/anchor"
import { AnchorCompressedNft } from "../target/types/anchor_compressed_nft"
import { Program } from "@project-serum/anchor"
import {
  AccountMeta,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  ValidDepthSizePair,
  createAllocTreeIx,
  createVerifyLeafIx,
} from "@solana/spl-account-compression"
import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  computeCompressedNFTHash,
  getLeafAssetId,
  TokenProgramVersion,
  TokenStandard,
  MetadataArgs,
  Collection,
  Creator,
} from "@metaplex-foundation/mpl-bubblegum"
import {
  Metaplex,
  keypairIdentity,
  CreateNftOutput,
} from "@metaplex-foundation/js"
import { assert } from "chai"
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { extractAssetId, heliusApi } from "../utils/utils"

describe("anchor-compressed-nft", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const wallet = provider.wallet as anchor.Wallet
  const program = anchor.workspace
    .AnchorCompressedNft as Program<AnchorCompressedNft>

  // const connection = program.provider.connection
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

  const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet.payer))

  // keypair for tree
  const merkleTree = Keypair.generate()

  // tree authority
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [merkleTree.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )

  // pda "tree creator", allows our program to update the tree
  const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("AUTH")],
    program.programId
  )

  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  )

  const maxDepthSizePair: ValidDepthSizePair = {
    maxDepth: 3,
    maxBufferSize: 8,
  }
  const canopyDepth = maxDepthSizePair.maxDepth - 5

  const metadata = {
    uri: "https://arweave.net/h19GMcMz7RLDY7kAHGWeWolHTmO83mLLMNPzEkF32BQ",
    name: "NAME",
    symbol: "SYMBOL",
  }

  let collectionNft: CreateNftOutput
  let assetId: PublicKey
  let assetId2: PublicKey

  before(async () => {
    // Create collection nft
    collectionNft = await metaplex.nfts().create({
      uri: metadata.uri,
      name: metadata.name,
      sellerFeeBasisPoints: 0,
      isCollection: true,
    })

    // transfer collection nft metadata update authority to pda
    await metaplex.nfts().update({
      nftOrSft: collectionNft.nft,
      updateAuthority: wallet.payer,
      newUpdateAuthority: pda,
    })

    // instruction to create new account with required space for tree
    const allocTreeIx = await createAllocTreeIx(
      connection,
      merkleTree.publicKey,
      wallet.publicKey,
      maxDepthSizePair,
      canopyDepth
    )

    const tx = new Transaction().add(allocTreeIx)

    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [wallet.payer, merkleTree],
      {
        commitment: "confirmed",
      }
    )
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
  })

  it("Create Tree", async () => {
    // create tree via CPI
    const txSignature = await program.methods
      .anchorCreateTree(
        maxDepthSizePair.maxDepth,
        maxDepthSizePair.maxBufferSize
      )
      .accounts({
        pda: pda,
        merkleTree: merkleTree.publicKey,
        treeAuthority: treeAuthority,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .rpc({ commitment: "confirmed" })
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)

    // fetch tree account
    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      merkleTree.publicKey
    )

    console.log("MaxBufferSize", treeAccount.getMaxBufferSize())
    console.log("MaxDepth", treeAccount.getMaxDepth())
    console.log("Tree Authority", treeAccount.getAuthority().toString())

    assert.strictEqual(
      treeAccount.getMaxBufferSize(),
      maxDepthSizePair.maxBufferSize
    )
    assert.strictEqual(treeAccount.getMaxDepth(), maxDepthSizePair.maxDepth)
    assert.isTrue(treeAccount.getAuthority().equals(treeAuthority))
  })

  it("Mint Compressed NFT", async () => {
    // mint compressed nft via CPI
    const txSignature = await program.methods
      .mintCompressedNft()
      .accounts({
        pda: pda,
        merkleTree: merkleTree.publicKey,
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
      .rpc({ commitment: "confirmed" })
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)

    assetId = await extractAssetId(
      connection,
      txSignature,
      merkleTree.publicKey,
      program.programId
    )
  })

  it("Transfer Cnft", async () => {
    const [assetData, assetProofData] = await Promise.all([
      heliusApi("getAsset", { id: assetId.toBase58() }),
      heliusApi("getAssetProof", { id: assetId.toBase58() }),
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

    const receiver = Keypair.generate()
    const newLeafOwner = receiver.publicKey

    const txSignature = await program.methods
      .transferCompressedNft(
        Array.from(new PublicKey(root.trim()).toBytes()),
        Array.from(new PublicKey(compression.data_hash.trim()).toBytes()),
        Array.from(new PublicKey(compression.creator_hash.trim()).toBytes()),
        new anchor.BN(compression.leaf_id),
        compression.leaf_id
      )
      .accounts({
        leafOwner: ownerPublicKey,
        leafDelegate: delegatePublicKey,
        newLeafOwner: newLeafOwner,
        merkleTree: treePublicKey,
        treeAuthority: treeAuthority,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .remainingAccounts(proofPath)
      .rpc()

    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
  })

  it("Mint Another Compressed NFT", async () => {
    // mint compressed nft via CPI
    const txSignature = await program.methods
      .mintCompressedNft()
      .accounts({
        pda: pda,
        merkleTree: merkleTree.publicKey,
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
      .rpc({ commitment: "confirmed" })
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)

    assetId2 = await extractAssetId(
      connection,
      txSignature,
      merkleTree.publicKey,
      program.programId
    )
  })

  it("Burn Cnft", async () => {
    const [assetData, assetProofData] = await Promise.all([
      heliusApi("getAsset", { id: assetId2.toBase58() }),
      heliusApi("getAssetProof", { id: assetId2.toBase58() }),
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

    const txSignature = await program.methods
      .burnCompressedNft(
        Array.from(new PublicKey(root.trim()).toBytes()),
        Array.from(new PublicKey(compression.data_hash.trim()).toBytes()),
        Array.from(new PublicKey(compression.creator_hash.trim()).toBytes()),
        new anchor.BN(compression.leaf_id),
        compression.leaf_id
      )
      .accounts({
        leafOwner: ownerPublicKey,
        leafDelegate: delegatePublicKey,
        merkleTree: treePublicKey,
        treeAuthority: treeAuthority,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .remainingAccounts(proofPath)
      .rpc()

    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
  })
})
