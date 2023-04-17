use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token::Mint,
};
use mpl_bubblegum::{
    cpi::{
        accounts::{CreateTree, MintToCollectionV1},
        create_tree, mint_to_collection_v1,
    },
    program::Bubblegum,
    state::metaplex_adapter::{
        Collection, Creator, MetadataArgs, TokenProgramVersion, TokenStandard,
    },
};
use spl_account_compression::{program::SplAccountCompression, Noop};

declare_id!("Hr6cWwxbAyB9CRbJ7wV4WrphzkY1oyQB5ix1uPJFHqtA");

pub const SEED: &str = "AUTH";

#[program]
pub mod anchor_compressed_nft {

    use super::*;

    pub fn anchor_create_tree(
        ctx: Context<AnchorCreateTree>,
        max_depth: u32,
        max_buffer_size: u32,
    ) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[SEED.as_bytes(), &[*ctx.bumps.get("pda").unwrap()]]];

        create_tree(
            CpiContext::new_with_signer(
                ctx.accounts.bubblegum_program.to_account_info().clone(),
                CreateTree {
                    tree_authority: ctx.accounts.tree_authority.to_account_info().clone(),
                    merkle_tree: ctx.accounts.merkle_tree.to_account_info().clone(),
                    payer: ctx.accounts.payer.to_account_info().clone(),
                    tree_creator: ctx.accounts.pda.to_account_info().clone(),
                    log_wrapper: ctx.accounts.log_wrapper.to_account_info().clone(),
                    compression_program: ctx.accounts.compression_program.to_account_info().clone(),
                    system_program: ctx.accounts.system_program.to_account_info().clone(),
                },
                signer_seeds,
            ),
            max_depth,
            max_buffer_size,
            Option::from(false),
        )?;
        Ok(())
    }

    pub fn mint_compressed_nft(ctx: Context<MintCompressedNft>) -> Result<()> {
        let signer_seeds: &[&[&[u8]]] = &[&[SEED.as_bytes(), &[*ctx.bumps.get("pda").unwrap()]]];

        let metadata_account = &ctx.accounts.collection_metadata;

        let metadata = MetadataArgs {
            name: metadata_account.data.name.clone().to_string(),
            symbol: metadata_account.data.symbol.clone().to_string(),
            uri: metadata_account.data.uri.clone().to_string(),
            collection: Some(Collection {
                key: ctx.accounts.collection_mint.key(),
                verified: false,
            }),
            primary_sale_happened: true,
            is_mutable: true,
            edition_nonce: None,
            token_standard: Some(TokenStandard::NonFungible),
            uses: None,
            token_program_version: TokenProgramVersion::Original,
            creators: vec![Creator {
                address: ctx.accounts.pda.key(),
                verified: true,
                share: 100,
            }],
            seller_fee_basis_points: 0,
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.bubblegum_program.to_account_info().clone(),
            MintToCollectionV1 {
                tree_authority: ctx.accounts.tree_authority.to_account_info().clone(),
                leaf_owner: ctx.accounts.payer.to_account_info().clone(),
                leaf_delegate: ctx.accounts.payer.to_account_info(),
                merkle_tree: ctx.accounts.merkle_tree.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                tree_delegate: ctx.accounts.pda.to_account_info(), // not sure what this is
                collection_authority: ctx.accounts.pda.to_account_info(),
                collection_authority_record_pda: ctx.accounts.bubblegum_program.to_account_info(),
                collection_mint: ctx.accounts.collection_mint.to_account_info(),
                collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
                edition_account: ctx.accounts.edition_account.to_account_info(),
                bubblegum_signer: ctx.accounts.bubblegum_signer.to_account_info(),
                log_wrapper: ctx.accounts.log_wrapper.to_account_info(),
                compression_program: ctx.accounts.compression_program.to_account_info(),
                token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
            signer_seeds,
        );

        mint_to_collection_v1(cpi_ctx, metadata)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct AnchorCreateTree<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:
    #[account(
        seeds = [SEED.as_bytes()],
        bump,
    )]
    pub pda: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [merkle_tree.key().as_ref()],
        bump,
        seeds::program = bubblegum_program.key()
    )]
    pub tree_authority: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,
    pub log_wrapper: Program<'info, Noop>,
    pub system_program: Program<'info, System>,
    pub bubblegum_program: Program<'info, Bubblegum>,
    pub compression_program: Program<'info, SplAccountCompression>,
}

#[derive(Accounts)]
pub struct MintCompressedNft<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK:
    #[account(
        seeds = [SEED.as_bytes()],
        bump,
    )]
    pub pda: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        mut,
        seeds = [merkle_tree.key().as_ref()],
        bump,
        seeds::program = bubblegum_program.key()
    )]
    pub tree_authority: UncheckedAccount<'info>,

    /// CHECK:
    #[account(mut)]
    pub merkle_tree: UncheckedAccount<'info>,

    /// CHECK:
    #[account(
        seeds = ["collection_cpi".as_bytes()],
        seeds::program = bubblegum_program.key(),
        bump,
    )]
    pub bubblegum_signer: UncheckedAccount<'info>,

    pub log_wrapper: Program<'info, Noop>,
    pub compression_program: Program<'info, SplAccountCompression>,
    pub bubblegum_program: Program<'info, Bubblegum>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,

    pub collection_mint: Account<'info, Mint>,
    #[account(mut)]
    pub collection_metadata: Account<'info, MetadataAccount>,
    /// CHECK:
    pub edition_account: UncheckedAccount<'info>,
}
