import * as anchor from "@project-serum/anchor"
import { AnchorCompressedNft } from "../target/types/anchor_compressed_nft"
import { Program } from "@project-serum/anchor"
import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import {
  ConcurrentMerkleTreeAccount,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
  ValidDepthSizePair,
  createAllocTreeIx,
} from "@solana/spl-account-compression"
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum"
import {
  Metaplex,
  keypairIdentity,
  CreateNftOutput,
} from "@metaplex-foundation/js"
import { assert } from "chai"
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"

describe("anchor-compressed-nft", () => {
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace
    .AnchorCompressedNft as Program<AnchorCompressedNft>
  const connection = program.provider.connection
  const wallet = anchor.workspace.AnchorCompressedNft.provider.wallet
  const metaplex = Metaplex.make(connection).use(keypairIdentity(wallet.payer))

  const merkleTree = Keypair.generate()

  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [merkleTree.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )

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
  const canopyDepth = maxDepthSizePair.maxDepth - 3

  const metadata = {
    uri: "https://raw.githubusercontent.com/solana-developers/program-examples/new-examples/tokens/tokens/.assets/spl-token.json",
    name: "Solana Gold",
    symbol: "GOLDSOL",
  }

  let collectionNft: CreateNftOutput

  before(async () => {
    collectionNft = await metaplex.nfts().create({
      uri: metadata.uri,
      name: metadata.name,
      sellerFeeBasisPoints: 0,
      isCollection: true,
    })

    await metaplex.nfts().update({
      nftOrSft: collectionNft.nft,
      updateAuthority: wallet.payer,
      newUpdateAuthority: pda,
    })

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
    console.log("txSignature", txSignature)
  })

  it("Create Tree", async () => {
    const tx = await program.methods
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
      .rpc({ skipPreflight: true })
    console.log("Your transaction signature", tx)

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
    const tx = await program.methods
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
      .rpc()
    console.log("Your transaction signature", tx)
  })

  // it("Mint Compressed NFT", async () => {
  //   // Devnet
  //   const tx = await program.methods
  //     .mintCompressedNft()
  //     .accounts({
  //       pda: pda,
  //       merkleTree: new PublicKey(
  //         "FHuqtTczAMgBxaALej8S9ctsgLcCW7vyzf9KUmXheUE2"
  //       ),
  //       treeAuthority: new PublicKey(
  //         "61jF1bUcAbHtG6eo7stecU4MdXFg7JuBkh8NijASNosN"
  //       ),
  //       logWrapper: SPL_NOOP_PROGRAM_ID,
  //       bubblegumSigner: bubblegumSigner,
  //       bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
  //       compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //       tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

  //       collectionMint: new PublicKey(
  //         "AJR7jSzvv4pTp9x8LYi5sRzqsKeAp4br4S3PNSLaGQo3"
  //       ),
  //       collectionMetadata: new PublicKey(
  //         "GUwsaB92iSgQnQToLkQC5jwFjyL51ftSGuYoct1bfLFN"
  //       ),
  //       editionAccount: new PublicKey(
  //         "8FMwvAVQq94dXDm9tXonwj2xZRRVoHc1PXxcUVqR6A14"
  //       ),
  //     })
  //     .rpc()
  //   console.log("Your transaction signature", tx)
  // })
})
