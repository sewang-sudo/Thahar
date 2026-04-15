use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PolicyType {
    Crop,
    Disaster,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PolicyStatus {
    Active,
    PaidOut,
    Expired,
}

#[account]
pub struct InsurancePolicy {
    pub farmer:            Pubkey,
    pub policy_type:       PolicyType,
    pub status:            PolicyStatus,
    pub premium_paid:      u64,
    pub coverage_amount:   u64,
    pub trigger_threshold: i64,
    pub region_id:         String,
    pub created_at:        i64,
    pub bump:              u8,
}

impl InsurancePolicy {
    pub const LEN: usize = 8
        + 32   // farmer
        + 2    // policy_type
        + 2    // status
        + 8    // premium_paid
        + 8    // coverage_amount
        + 8    // trigger_threshold
        + (4 + 32) // region_id
        + 8    // created_at
        + 1;   // bump
}

#[account]
pub struct OracleData {
    pub authority:      Pubkey,
    pub region_id:      String,
    pub rainfall_mm:    i64,
    pub flood_level_cm: i64,
    pub last_updated:   i64,
    pub bump:           u8,
}

impl OracleData {
    pub const LEN: usize = 8
        + 32       // authority
        + (4 + 32) // region_id
        + 8        // rainfall_mm
        + 8        // flood_level_cm
        + 8        // last_updated
        + 1;       // bump
}

#[account]
pub struct ProgramTreasury {
    pub authority: Pubkey,
    pub bump:      u8,
}

impl ProgramTreasury {
    pub const LEN: usize = 8 + 32 + 1;
}