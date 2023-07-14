import { encryption, utilitas } from 'utilitas';

import {
    assertAddress,
    recoverAddressBySignatureAndHash,
    signData,
} from './crypto.mjs';

const _NEED = ['bistrot'];

const buildData = (btih, nftadd) => {
    assert(btih, 'Invalid btih.', 400);
    assert(assertAddress(nftadd), 'Invalid nftadd.', 400);
    return { btih, nftadd };
};

const signRequest = (btih, nftadd, privateKey) => {
    const data = buildData(btih, nftadd);
    const signature = signData(data, privateKey);
    return {
        data, signature, token: [btih, nftadd, signature.signature].join('-'),
    };
};

const verifyRequest = async (token) => {
    const libErc721 = (await utilitas.need('bistrot')).erc721;
    const [btih, nftadd, signature] = utilitas.ensureString(token).split('-');
    const data = buildData(btih, nftadd);
    const hash = encryption.digestObject(data)
    const userAddress = await recoverAddressBySignatureAndHash(signature, hash);
    const balance = await libErc721.balanceOf(nftadd, userAddress);
    assert(balance > 0, 'No NFT token match the btih.', 403);
    return { token, btih, nftadd, signature, data, hash, userAddress, balance };
};

export {
    _NEED,
    signRequest,
    verifyRequest,
};
