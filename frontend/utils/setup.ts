import {
  Program,
  AnchorProvider,
  Idl,
  setProvider,
} from "@project-serum/anchor"
import {
  IDL as AnchorCompressedNftIdl,
  AnchorCompressedNft,
} from "../idl/anchor_compressed_nft"
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js"

const MockWallet = {
  signTransaction: () => Promise.reject(),
  signAllTransactions: () => Promise.reject(),
  publicKey: Keypair.generate().publicKey,
}

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

const provider = new AnchorProvider(connection, MockWallet, {})
setProvider(provider)

const AnchorCompressedNftId = new PublicKey(
  "AECLhMQ7QB11Ugxze54bQ535LL6V53RceEfPbBedzrSf"
)

export const cNftProgram = new Program(
  AnchorCompressedNftIdl as Idl,
  AnchorCompressedNftId
) as unknown as Program<AnchorCompressedNft>

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
)

export const nft = {
  uri: "https://arweave.net/bj7vXx6-AmFV0lk0QlCOGk1O9aCDoJAqefg55107rT4",
  name: "Test",
  symbol: "Test",
}

export const collectionNft = {
  mintAddress: new PublicKey("5oniR2gZeR1wv4EjfVM1oJsyAm34QVkyC1ax1gk5TH6M"),
  metadataAddress: new PublicKey("CHiDzcoV8PqTGDr5n7kDLQytYPZmBmHAa6xfPuAdSaTG"),
  masterEditionAddress: new PublicKey("3xbUKGNNT5TQww43v6FZaBnDQGD9NadGp1bYgKYTsu7n"),
}
export const treeAddress = new PublicKey("B2toMtcF5jWKJVomZdAS2mBdqcHTSqfPce7eXaKa45iD")
