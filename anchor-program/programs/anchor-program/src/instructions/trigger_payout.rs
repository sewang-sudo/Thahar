use anchor_lang::prelude::*;
use crate::state::{InsurancePolicy, PolicyStatus, OracleData, ProgramTreasury};
use crate::error::ThaharError;

#[derive(Accounts)]
pub struct TriggerPayout<'info> {
    #[account(
        mut,
        seeds = [b"policy", farmer.key().as_ref()],
        bump = policy.bump,
        has_one = farmer
    )]
    pub policy: Account<'info, InsurancePolicy>,

    #[account(
        seeds = [b"oracle", oracle.region_id.as_bytes()],
        bump = oracle.bump
    )]
    pub oracle: Account<'info, OracleData>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, ProgramTreasury>,

    /// CHECK: verified by policy.farmer constraint above
    #[account(mut, address = policy.farmer)]
    pub farmer: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TriggerPayout>) -> Result<()> {
    let policy = &ctx.accounts.policy;
    let oracle  = &ctx.accounts.oracle;

    require!(
        policy.status == PolicyStatus::Active,
        ThaharError::PolicyNotActive
    );

    let now = Clock::get()?.unix_timestamp;
    require!(
        now - oracle.last_updated < 86400,
        ThaharError::OracleDataStale
    );

    require!(
        oracle.rainfall_mm < policy.trigger_threshold,
        ThaharError::ThresholdNotBreached
    );

    let payout        = policy.coverage_amount;
    let treasury_info = ctx.accounts.treasury.to_account_info();
    let farmer_info   = ctx.accounts.farmer.to_account_info();

    **treasury_info.try_borrow_mut_lamports()? = treasury_info
        .lamports()
        .checked_sub(payout)
        .ok_or(ThaharError::ArithmeticOverflow)?;

    **farmer_info.try_borrow_mut_lamports()? = farmer_info
        .lamports()
        .checked_add(payout)
        .ok_or(ThaharError::ArithmeticOverflow)?;

    let policy      = &mut ctx.accounts.policy;
    policy.status   = PolicyStatus::PaidOut;

    msg!("Payout triggered! {} lamports to farmer {:?}", payout, policy.farmer);
    Ok(())
}
