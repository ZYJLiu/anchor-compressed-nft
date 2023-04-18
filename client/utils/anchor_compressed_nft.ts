export type AnchorCompressedNft = {
  version: "0.1.0";
  name: "anchor_compressed_nft";
  instructions: [
    {
      name: "anchorCreateTree";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "pda";
          isMut: false;
          isSigner: false;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "maxDepth";
          type: "u32";
        },
        {
          name: "maxBufferSize";
          type: "u32";
        },
      ];
    },
    {
      name: "mintCompressedNft";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "pda";
          isMut: false;
          isSigner: false;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "bubblegumSigner";
          isMut: false;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "collectionMetadata";
          isMut: true;
          isSigner: false;
        },
        {
          name: "editionAccount";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [];
    },
    {
      name: "burnCompressedNft";
      accounts: [
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "leafOwner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "leafDelegate";
          isMut: true;
          isSigner: true;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        },
      ];
    },
    {
      name: "transferCompressedNft";
      accounts: [
        {
          name: "leafOwner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "leafDelegate";
          isMut: true;
          isSigner: true;
        },
        {
          name: "treeAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "merkleTree";
          isMut: true;
          isSigner: false;
        },
        {
          name: "newLeafOwner";
          isMut: true;
          isSigner: false;
        },
        {
          name: "logWrapper";
          isMut: false;
          isSigner: false;
        },
        {
          name: "compressionProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "bubblegumProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
      ];
      args: [
        {
          name: "root";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "dataHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "creatorHash";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "nonce";
          type: "u64";
        },
        {
          name: "index";
          type: "u32";
        },
      ];
    },
  ];
};

export const IDL: AnchorCompressedNft = {
  version: "0.1.0",
  name: "anchor_compressed_nft",
  instructions: [
    {
      name: "anchorCreateTree",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "pda",
          isMut: false,
          isSigner: false,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "maxDepth",
          type: "u32",
        },
        {
          name: "maxBufferSize",
          type: "u32",
        },
      ],
    },
    {
      name: "mintCompressedNft",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "pda",
          isMut: false,
          isSigner: false,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "bubblegumSigner",
          isMut: false,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "collectionMetadata",
          isMut: true,
          isSigner: false,
        },
        {
          name: "editionAccount",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "burnCompressedNft",
      accounts: [
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "leafOwner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "leafDelegate",
          isMut: true,
          isSigner: true,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "dataHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "creatorHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "nonce",
          type: "u64",
        },
        {
          name: "index",
          type: "u32",
        },
      ],
    },
    {
      name: "transferCompressedNft",
      accounts: [
        {
          name: "leafOwner",
          isMut: true,
          isSigner: true,
        },
        {
          name: "leafDelegate",
          isMut: true,
          isSigner: true,
        },
        {
          name: "treeAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "merkleTree",
          isMut: true,
          isSigner: false,
        },
        {
          name: "newLeafOwner",
          isMut: true,
          isSigner: false,
        },
        {
          name: "logWrapper",
          isMut: false,
          isSigner: false,
        },
        {
          name: "compressionProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "bubblegumProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "root",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "dataHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "creatorHash",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "nonce",
          type: "u64",
        },
        {
          name: "index",
          type: "u32",
        },
      ],
    },
  ],
};
