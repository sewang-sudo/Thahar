use anchor_lang::prelude::*;

#[error_code]
pub enum TicketError {
    #[msg("You are not the owner of this ticket")]
    NotOwner,
    #[msg("Ticket is already listed for sale")]
    AlreadyListed,
    #[msg("Ticket is not listed for sale")]
    NotForSale,
    #[msg("You cannot buy your own ticket")]
    CannotBuyOwn,
}
