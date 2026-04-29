import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function generateDappKeypair(){
    const keypair = nacl.box.keyPair();
    return{
        publicKey: bs58.encode(keypair.publicKey),
        secretKey: keypair.secretKey,
    }
}

export function buildConnectURL(dappPublicKey, redirectURL){
    const params = new URLSearchParams({
        app_url: 'https://thahar.vercel.app',
        dapp_encryption_public_key: dappPublicKey,
        redirect_link: redirectURL,
        cluster: 'devnet',
    });
    return `https://phantom.app/ul/v1/connect?${params.toString()}`;
}

export function buildSignURL(dappPublicKey, redirectURL, transaction){
    const params = new URLSearchParams({
        dapp_encryption_public_key: dappPublicKey,
        redirect_link: redirectURL,
        payload: transaction,
    })
    return `https://phantom.app/ul/v1/signTransaction?${params.toString()}`;
}

export function decryptPayload(data, nonce, phantomPublicKey, secretKey){
    const decodeData = bs58.decode(data);
    const decodeNonce = bs58.decode(nonce);
    const decodePhantomPublicKey = bs58.decode(phantomPublicKey);

    const decrypted = nacl.box.open(decodeData, decodeNonce, decodePhantomPublicKey, secretKey);

    return JSON.parse(Buffer.from(decrypted).toString('utf8'));
}