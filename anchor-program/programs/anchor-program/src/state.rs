use anchor_lang::prelude::*;

#[account]
pub struct TicketAccount {
    pub owner: Pubkey,
    pub activity_id: String,
    pub activity_name: String,
    pub event_date: i64,
    pub price_sol: u64,
    pub is_for_sale: bool,
    pub resale_price: u64,
    pub bump: u8,
}

impl TicketAccount {
    pub const LEN: usize = 8  // discriminator
        + 32                   // owner pubkey
        + 4 + 36               // activity_id (UUID string)
        + 4 + 100              // activity_name
        + 8                    // event_date
        + 8                    // price_sol
        + 1                    // is_for_sale
        + 8                    // resale_price
        + 1;                   // bump
}
