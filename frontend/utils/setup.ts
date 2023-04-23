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
import { WrapperConnection } from "../ReadApi/WrapperConnection"

const MockWallet = {
  signTransaction: () => Promise.reject(),
  signAllTransactions: () => Promise.reject(),
  publicKey: Keypair.generate().publicKey,
}

export const connection = new WrapperConnection(
  process.env.NEXT_PUBLIC_RPC_URL!,
  "confirmed"
)

const provider = new AnchorProvider(connection, MockWallet, {})
setProvider(provider)

const AnchorCompressedNftId = new PublicKey(
  "AYorEHWdAA7SLzWgQfuv6kypdzriqCeG7GrGifa7c4Kp"
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
