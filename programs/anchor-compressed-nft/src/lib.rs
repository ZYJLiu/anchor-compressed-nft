use anchor_lang::prelude::*;
use mpl_bubblegum::{
    cpi::{accounts::CreateTree, create_tree},
    program::Bubblegum,
};
use spl_account_compression::{program::SplAccountCompression, Noop};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod anchor_compressed_nft {
    use super::*;

    pub fn anchor_create_tree(
        ctx: Context<AnchorCreateTree>,
        max_depth: u32,
        max_buffer_size: u32,
    ) -> Result<()> {
        create_tree(
            CpiContext::new(
                ctx.accounts.bubblegum_program.to_account_info().clone(),
                CreateTree {
                    tree_authority: ctx.accounts.tree_authority.to_account_info().clone(),
                    merkle_tree: ctx.accounts.merkle_tree.to_account_info().clone(),
                    payer: ctx.accounts.payer.to_account_info().clone(),
                    tree_creator: ctx.accounts.payer.to_account_info().clone(),
                    log_wrapper: ctx.accounts.log_wrapper.to_account_info().clone(),
                    compression_program: ctx.accounts.compression_program.to_account_info().clone(),
                    system_program: ctx.accounts.system_program.to_account_info().clone(),
                },
            ),
            max_depth,
            max_buffer_size,
            None,
        )?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct AnchorCreateTree<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

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
