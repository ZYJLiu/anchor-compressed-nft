import { Flex, useDisclosure, Button } from "@chakra-ui/react"
import QrModal from "../../components/QrCodeCnftMint"

const CnftMint = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Flex justifyContent="center">
      <Button onClick={onOpen}>Mint CNFT</Button>
      {isOpen && <QrModal onClose={onClose} />}
    </Flex>
  )
}

export default CnftMint
