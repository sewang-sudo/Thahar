use anchor_lang::prelude::*;

declare_id!("8Q3bQZA37hRwJ84DcrcVMp7k4LrGLjdoBGsgF6N9iEEp");

pub mod state;
pub mod error;
use state::*;
use error::*;

#[program]
pub mod nft_tickets {
    use super::*;

    pub fn mint_ticket(
        ctx: Context<MintTicket>,
        activity_id: String,
        activity_name: String,
        event_date: i64,
        price_sol: u64,
    ) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        ticket.owner = ctx.accounts.tourist.key();
        ticket.activity_id = activity_id;
        ticket.activity_name = activity_name;
        ticket.event_date = event_date;
        ticket.price_sol = price_sol;
        ticket.is_for_sale = false;
        ticket.resale_price = 0;
        ticket.bump = ctx.bumps.ticket;
        msg!("Ticket minted for {}", ticket.activity_name);
        Ok(())
    }

    pub fn list_for_resale(
        ctx: Context<ListForResale>,
        resale_price: u64,
    ) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        require!(ticket.owner == ctx.accounts.owner.key(), TicketError::NotOwner);
        require!(!ticket.is_for_sale, TicketError::AlreadyListed);
        ticket.is_for_sale = true;
        ticket.resale_price = resale_price;
        msg!("Ticket listed for resale at {} lamports", resale_price);
        Ok(())
    }

    pub fn buy_ticket(ctx: Context<BuyTicket>) -> Result<()> {
        let ticket = &mut ctx.accounts.ticket;
        require!(ticket.is_for_sale, TicketError::NotForSale);
        require!(ticket.owner != ctx.accounts.buyer.key(), TicketError::CannotBuyOwn);
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.seller.key(),
            ticket.resale_price,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.seller.to_account_info(),
            ],
        )?;
        ticket.owner = ctx.accounts.buyer.key();
        ticket.is_for_sale = false;
        ticket.resale_price = 0;
        msg!("Ticket sold to {}", ctx.accounts.buyer.key());
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(activity_id: String)]
pub struct MintTicket<'info> {
    #[account(
        init,
        payer = tourist,
        space = TicketAccount::LEN,
        seeds = [b"ticket", tourist.key().as_ref(), activity_id.as_bytes()],
        bump
    )]
    pub ticket: Account<'info, TicketAccount>,
    #[account(mut)]
    pub tourist: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListForResale<'info> {
    #[account(mut, has_one = owner)]
    pub ticket: Account<'info, TicketAccount>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub ticket: Account<'info, TicketAccount>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub seller: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
