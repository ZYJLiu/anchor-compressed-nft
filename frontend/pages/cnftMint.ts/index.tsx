import { Flex, useDisclosure, Button, VStack } from "@chakra-ui/react"
import QrModal from "../../components/QrCodeCnftMint"
import MintCnft from "../../components/MintCnft"
const CnftMint = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <VStack justifyContent="center">
      <Button onClick={onOpen}>Solana Pay Mint</Button>
      <MintCnft />
      {isOpen && <QrModal onClose={onClose} />}
    </VStack>
  )
}

export default CnftMint
