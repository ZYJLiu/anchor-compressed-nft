import { Flex, Box, Text } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import Image from "next/image"
import axios from "axios"
import BurnCnft from "./BurnCnft"
import TransferCnft from "./TransferCnft"
import { collectionNft } from "../utils/setup"

type Group = {
  group_key: string
  group_value: string
}

// todo: filter by collection and fetch image
const DisplayCnft = () => {
  const { publicKey } = useWallet()
  const [assets, setAssets] = useState<any[]>([])

  const fetchAssets = async () => {
    if (!publicKey) return
    const { data } = await axios.post(process.env.NEXT_PUBLIC_RPC_URL!, {
      jsonrpc: "2.0",
      id: "my-id",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: publicKey?.toBase58(),
        page: 1,
        limit: 300,
      },
    })

    const res = data.result

    console.log("Total assets returned:", res.total)

    const filteredAssets =
      res.items?.filter((asset: any) => {
        if (!asset.compression.compressed) return false

        // console.log(JSON.stringify(asset, null, 2))
        const hasTargetAddress = asset.grouping.some(
          (group: Group) =>
            group.group_value === collectionNft.mintAddress.toBase58()
        )

        return hasTargetAddress
      }) || []

    // console.log(JSON.stringify(filteredAssets, null, 2))
    setAssets(filteredAssets)
  }

  useEffect(() => {
    fetchAssets()
  }, [publicKey])

  return (
    <Flex justifyContent="center" flexWrap="wrap">
      {assets && assets.length > 0 ? (
        assets.map((asset, index) => (
          <Box key={index} borderWidth="1px" borderRadius="lg" p="4" m="2">
            <TransferCnft asset={asset} />
            {/* <BurnCnft asset={asset} /> */}
            <Text fontWeight="bold">ID: {asset.id}</Text>
            <Text>Name: {asset?.content?.metadata?.name}</Text>
            <Text>Description: {asset?.content?.metadata?.description}</Text>
            {asset.authorities.map((authority: any, idx: any) => (
              <Text key={idx}>
                Authority {idx + 1}: {authority.address}
              </Text>
            ))}
            <Text>
              Compression Eligible: {asset.compression.eligible.toString()}
            </Text>
            <Text>
              Compression Compressed: {asset.compression.compressed.toString()}
            </Text>
            <Text>Data Hash: {asset.compression.data_hash}</Text>
            <Text>Creator Hash: {asset.compression.creator_hash}</Text>
            <Text>Asset Hash: {asset.compression.asset_hash}</Text>
            <Text>Tree: {asset.compression.tree}</Text>
            <Text>Seq: {asset.compression.seq}</Text>
            <Text>Leaf ID: {asset.compression.leaf_id}</Text>
            <Text>Group Key: {asset.grouping[0].group_key}</Text>
            <Text>Group Value: {asset.grouping[0].group_value}</Text>
            <Text>Owner: {asset.ownership.owner}</Text>
            <Text>
              Image:
              <Image
                src={asset.content.files[0].uri}
                alt=""
                width={100}
                height={100}
              />
            </Text>
          </Box>
        ))
      ) : (
        <Text>No assets found.</Text>
      )}
    </Flex>
  )
}

export default DisplayCnft
