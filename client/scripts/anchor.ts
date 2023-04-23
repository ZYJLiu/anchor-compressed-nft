//  yarn demo ./scripts/anchor.ts
import {
  AccountMeta,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

import { Program, AnchorProvider, Idl, setProvider, BN } from "@project-serum/anchor";
import { AnchorCompressedNft, IDL } from "@/utils/anchor_compressed_nft";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
  ConcurrentMerkleTreeAccount,
  MerkleTree,
  MerkleTreeProof,
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";
import { PROGRAM_ID as BUBBLEGUM_PROGRAM_ID } from "@metaplex-foundation/mpl-bubblegum";
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

// import custom helpers for demos
import {
  explorerURL,
  loadKeypairFromFile,
  loadOrGenerateKeypair,
  numberFormatter,
  printConsoleSeparator,
  savePublicKeyToFile,
} from "@/utils/helpers";

// import custom helpers to mint compressed NFTs
import { createCollection, createTree, mintCompressedNFT } from "@/utils/compression";

// local import of the connection wrapper, to help with using the ReadApi
import { WrapperConnection } from "@/ReadApi/WrapperConnection";

import dotenv from "dotenv";
dotenv.config();

// define some reusable balance values for tracking
let initBalance: number, balance: number;

(async () => {
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // generate a new Keypair for testing, named `wallet`
  const testWallet = loadOrGenerateKeypair("testWallet");

  // generate a new keypair for use in this demo (or load it locally from the filesystem when available)
  const payer = process.env?.LOCAL_PAYER_JSON_ABSPATH
    ? loadKeypairFromFile(process.env?.LOCAL_PAYER_JSON_ABSPATH)
    : loadOrGenerateKeypair("payer");

  console.log("Payer address:", payer.publicKey.toBase58());
  console.log("Test wallet address:", testWallet.publicKey.toBase58());

  // locally save the addresses for the demo
  savePublicKeyToFile("userAddress", payer.publicKey);
  savePublicKeyToFile("testWallet", testWallet.publicKey);

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // load the env variables and store the cluster RPC url
  const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

  // create a new rpc connection, using the ReadApi wrapper
  const connection = new WrapperConnection(CLUSTER_URL, "confirmed");

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  // get the payer's starting balance
  initBalance = await connection.getBalance(payer.publicKey);
  console.log(
    "Starting account balance:",
    numberFormatter(initBalance / LAMPORTS_PER_SOL),
    "SOL\n",
  );

  const provider = new AnchorProvider(connection, new NodeWallet(payer), {});
  setProvider(provider);
  const programId = new PublicKey("AYorEHWdAA7SLzWgQfuv6kypdzriqCeG7GrGifa7c4Kp");
  const program = new Program(IDL as Idl, programId) as unknown as Program<AnchorCompressedNft>;

  // pda tree delegate
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("AUTH")], program.programId);

  // bubblegum signer
  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID,
  );

  // // Check Solana Explorer of a mint txSig for addresses
  // const tx = await program.methods
  //   .mintCompressedNft()
  //   .accounts({
  //     pda: pda,
  //     merkleTree: new PublicKey("DKfVW5sjaUnC5Q5Fu6zLzPfkHn7xYXDzCu2EBScUfsLQ"),
  //     treeAuthority: new PublicKey("DwpXS8BQUTyeSX6ftrh9HN8SRiBVkoQXGnro7KnQNR4s"),
  //     logWrapper: SPL_NOOP_PROGRAM_ID,
  //     bubblegumSigner: bubblegumSigner,
  //     bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
  //     compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,

  //     collectionMint: new PublicKey("9BK79Gs72jq3UyqNqSaBkG5iiiwy85NfQDVpNgD8pCRa"),
  //     collectionMetadata: new PublicKey("Ga2GM2t6pjMGUefrV8FyRALg1WdyHKqN6UoUfWKQcGiH"),
  //     editionAccount: new PublicKey("D72ArxhvDMFvXpyyrdJQLbNX3uiPugWWBT6q6BPUspHn"),
  //   })
  //   .rpc();
  // console.log("Your transaction signature", tx);

  const assetId = new PublicKey("t5dV3UpBf565FNuGL2KSgkAi6no7S4PApVgEKUcqLdW");
  const asset = await connection.getAsset(assetId);
  const assetProof = await connection.getAssetProof(assetId);
  const treeAddress = new PublicKey(asset.compression.tree);
  const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(connection, treeAddress);
  const treeAuthority = treeAccount.getAuthority();
  const canopyDepth = treeAccount.getCanopyDepth();

  console.log("canopyDepth", canopyDepth);
  const proofPath: AccountMeta[] = assetProof.proof
    .map((node: string) => ({
      pubkey: new PublicKey(node),
      isSigner: false,
      isWritable: false,
    }))
    .slice(0, assetProof.proof.length - (!!canopyDepth ? canopyDepth : 0));

  console.log(proofPath);

  const merkleTreeProof: MerkleTreeProof = {
    leafIndex: asset.compression.leaf_id,
    leaf: new PublicKey(assetProof.leaf).toBuffer(),
    root: new PublicKey(assetProof.root).toBuffer(),
    proof: assetProof.proof.map((node: string) => new PublicKey(node).toBuffer()),
  };

  const currentRoot = treeAccount.getCurrentRoot();
  const rpcRoot = new PublicKey(assetProof.root).toBuffer();

  console.log(
    "Is RPC provided proof/root valid:",
    MerkleTree.verify(rpcRoot, merkleTreeProof, false),
  );

  console.log(
    "Does the current on-chain root match RPC provided root:",
    new PublicKey(currentRoot).toBase58() === new PublicKey(rpcRoot).toBase58(),
  );

  const root = [...new PublicKey(assetProof.root.trim()).toBytes()];
  const dataHash = [...new PublicKey(asset.compression.data_hash.trim()).toBytes()];
  const creatorHash = [...new PublicKey(asset.compression.creator_hash.trim()).toBytes()];
  const nonce = asset.compression.leaf_id;
  const index = asset.compression.leaf_id;

  const tx = await program.methods
    .transferCompressedNft(root, dataHash, creatorHash, new BN(nonce), index)
    .accounts({
      leafOwner: payer.publicKey,
      leafDelegate: payer.publicKey,
      newLeafOwner: payer.publicKey,
      merkleTree: treeAddress,
      treeAuthority: treeAuthority,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .remainingAccounts(proofPath)
    .transaction();
  console.log("Your transaction signature", JSON.stringify(tx, null, 2));

  // send the transaction
  const txSignature = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  console.log(explorerURL({ txSignature }));

  console.log("PAYER: ", payer.publicKey.toBase58());
  const tx2 = await program.methods
    .burnCompressedNft(root, dataHash, creatorHash, new BN(nonce), index)
    .accounts({
      payer: payer.publicKey,
      leafOwner: payer.publicKey,
      leafDelegate: payer.publicKey,
      merkleTree: treeAddress,
      treeAuthority: treeAuthority,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    })
    .signers([payer])
    .remainingAccounts(proofPath)
    .transaction();
  // .rpc();

  // send the transaction
  const txSignature2 = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });
  console.log(explorerURL({ txSignature: txSignature2 }));

  // await connection
  //   .getAssetsByOwner({
  //     ownerAddress: payer.publicKey.toBase58(),
  //   })
  //   .then(res => {
  //     console.log("Total assets returned:", res.total);

  //     // loop over each of the asset items in the collection
  //     res.items?.map(asset => {
  //       // only show compressed nft assets
  //       if (!asset.compression.compressed) return;

  //       const treeAuthority = "5497iJjYQWkZGJKeUg4vLJ6Umc4cUzsQYrZytyGrgHoM";
  //       const hasTargetAddress = asset.authorities.some(
  //         authority => authority.address === treeAuthority,
  //       );

  //       if (!hasTargetAddress) return;

  //       // display a spacer between each of the assets
  //       console.log("\n===============================================");

  //       // locally save the addresses for the demo
  //       savePublicKeyToFile("assetIdTestAddress", new PublicKey(asset.id));

  //       console.log(asset);

  //       // extra useful info
  //       console.log("assetId:", asset.id);

  //       // view the ownership info for the given asset
  //       console.log("ownership:", asset.ownership);

  //       // metadata json data (auto fetched thanks to the Metaplex Read API)
  //       console.log("metadata:", asset.content.metadata);

  //       // view the compression specific data for the given asset
  //       console.log("compression:", asset.compression);

  //       if (asset.compression.compressed) {
  //         console.log("==> This NFT is compressed! <===");
  //         console.log("\tleaf_id:", asset.compression.leaf_id);
  //       } else console.log("==> NFT is NOT compressed! <===");
  //     });
  //   });
})();
