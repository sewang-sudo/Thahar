use anchor_lang::prelude::*;
use crate::state::{InsurancePolicy, PolicyStatus, ProgramTreasury};
use crate::error::ThaharError;

#[derive(Accounts)]
pub struct PayPremium<'info> {
    #[account(
        mut,
        seeds = [b"policy", farmer.key().as_ref()],
        bump = policy.bump,
        has_one = farmer
    )]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, ProgramTreasury>,

    #[account(mut)]
    pub farmer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PayPremium>, amount: u64) -> Result<()> {
    require!(amount > 0, ThaharError::PremiumTooLow);
    require!(
        ctx.accounts.policy.status == PolicyStatus::Active,
        ThaharError::PolicyNotActive
    );

    // Anchor v1: manual lamport transfer instead of CPI
    let farmer_info   = ctx.accounts.farmer.to_account_info();
    let treasury_info = ctx.accounts.treasury.to_account_info();

    **farmer_info.try_borrow_mut_lamports()? = farmer_info
        .lamports()
        .checked_sub(amount)
        .ok_or(ThaharError::ArithmeticOverflow)?;

    **treasury_info.try_borrow_mut_lamports()? = treasury_info
        .lamports()
        .checked_add(amount)
        .ok_or(ThaharError::ArithmeticOverflow)?;

    let policy = &mut ctx.accounts.policy;
    policy.premium_paid = policy.premium_paid
        .checked_add(amount)
        .ok_or(ThaharError::ArithmeticOverflow)?;

    msg!("Premium paid: {} lamports. Total paid: {}", amount, policy.premium_paid);
    Ok(())
}
