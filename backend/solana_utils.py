"""
Solana utility helpers.
Currently returns mock values for dev/demo.
To go live: replace each function body with real
httpx calls to Solana Devnet RPC + your Anchor program.
"""
import hashlib
import secrets
import datetime


def mock_mint_nft(wallet_address: str, metadata: dict) -> dict:
    """
    Simulates minting an NFT ticket on Solana Devnet.
    Returns fake mint address + tx hash for demo purposes.
    Replace with real Anchor CPI call before mainnet.
    """
    seed = f"{wallet_address}{metadata.get('activity_id')}{secrets.token_hex(8)}"
    mint_address = "Fake" + hashlib.sha256(seed.encode()).hexdigest()[:40]
    tx_hash = "5x" + secrets.token_hex(43)
    return {"mint_address": mint_address, "tx_hash": tx_hash}


def mock_list_for_resale(mint_address: str, asking_price_sol: float) -> dict:
    """Simulates locking NFT into on-chain escrow PDA."""
    escrow = "Escrow" + secrets.token_hex(19)
    return {"escrow_address": escrow}


def mock_buy_ticket(escrow_address: str, buyer_wallet: str) -> dict:
    """Simulates NFT transfer from escrow to buyer + SOL to seller."""
    tx_hash = "Buy" + secrets.token_hex(42)
    return {"tx_hash": tx_hash}


def mock_rent_esim(esim_iccid: str, wallet_address: str) -> dict:
    """Simulates locking deposit in escrow + delivering QR code."""
    escrow = "EsimEscrow" + secrets.token_hex(16)
    # In production: call NTC/Ncell eSIM provisioning API here
    qr_url = f"https://mock-esim-qr.example.com/{esim_iccid[:8]}/{secrets.token_hex(4)}"
    return {"escrow_address": escrow, "qr_code_url": qr_url}


def mock_return_esim(escrow_address: str, wallet_address: str) -> dict:
    """Simulates releasing deposit escrow back to user."""
    tx_hash = "Return" + secrets.token_hex(41)
    return {"tx_hash": tx_hash}


def verify_wallet_owns_nft(wallet_address: str, mint_address: str) -> bool:
    """
    On-chain ownership check.
    In production: call getTokenAccountsByOwner RPC method.
    For dev: always returns True.
    """
    return True