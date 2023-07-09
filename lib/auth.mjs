import { encryption, utilitas } from 'utilitas';
import { recoverAddressBySignatureAndHash, signData } from './crypto.mjs';

// const x = await lib.erc721.balanceOf(
//     '0x3948d5408fed94e335b2ed7d9923b2dedd814520',
//     '0xa004fdf9d29638f7d016e2e28e877306faa80307'
// );
// console.log(x);

// add, mth, args, opts
// const y = await lib.erc721.callPreparedMethod('0x3948d5408fed94e335b2ed7d9923b2dedd814520', 'tokenURI', ['0']);
// console.log(y);

const buildDate = (btih, nftadd) => {
    // check btih and nftadd are valid
    return { btih, nftadd };
};

const signRequest = (btih, nftadd, privateKey) => {
    const data = buildDate(btih, nftadd);
    const signature = signData(data, privateKey);
    return { data, signature, token: [btih, nftadd, signature.signature].join('-') };
};

const verifyRequest = async (token) => {
    const [btih, nftadd, signature] = utilitas.ensureString(token).split('-');
    const data = buildDate(btih, nftadd);
    const hash = encryption.digestObject(data)
    const userAddress = recoverAddressBySignatureAndHash(signature, hash);
    console.log(userAddress);
};

export {
    signRequest,
    verifyRequest,
};
