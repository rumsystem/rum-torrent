import { announce } from './config.mjs';
import { encryption, utilitas } from 'utilitas';

import {
    assertAddress,
    recoverAddressBySignatureAndHash,
    signData,
} from './crypto.mjs';

const _NEED = ['bistrot'];
const placeholder = '{{RUM_PT_TOKEN}}';
const defaultToken = encryption.uniqueString();
const getMagnetURIByBtih = btih => `magnet:?xt=urn:btih:${assertBtih(btih)}`;
const getBtihByMagnetURI = uri => uri.replace(/^magnet:\?xt=urn:btih:([0-9a-z]*).*$/ig, '$1');

const assertBtih = (btih) => {
    assert(btih, 'Invalid btih.', 400);
    return btih;
};

const buildData = (btih, nftadd) => {
    assertBtih(btih);
    assertAddress(nftadd, 'Invalid nftadd.', 400);
    return { btih, nftadd };
};

const publish = async (btih, privateKey, options) => {
    const libBistrot = await utilitas.need('bistrot');
    const symbol = options?.symbol || `RUMPT-${btih}`;
    const magnet = getMagnetURIByBtih(assertBtih(btih));
    const baseTokenURI = `${magnet}&ti=`;
    const address = libBistrot.crypto.privateKeyToAddress(privateKey);
    const tr = (
        options?.trackers ? utilitas.ensureArray(options?.trackers) : announce
    ).map(t => `tr=${encodeURIComponent(`${t}/${placeholder}`)}`).join('&');
    const rspDeploy = await libBistrot.erc721.deploy(
        symbol, privateKey, { baseTokenURI }
    );
    await libBistrot.erc721.mint(rspDeploy._address, address, privateKey);
    return {
        chainApi: utilitas.ensureArray((await libBistrot.config()).chainApi),
        btih, nftadd: rspDeploy._address, symbol: symbol, baseTokenURI,
        magnet: `${magnet}&na=${rspDeploy._address}&${tr}`,
    };
};

const signRequest = (btih, nftadd, privateKey) => {
    const data = buildData(btih, nftadd);
    const signature = signData(data, privateKey);
    return { data, signature, token: [nftadd, signature.signature].join('-') };
};

const getAnnounce = (ancList, options) => {
    announce.map(url => ancList.push(`${url}/${defaultToken}`));
    let token = options?.token;
    for (let i in ancList) {
        if (!ancList[i].includes(placeholder)) { continue; }
        assert(token || (
            options?.btih && options?.nftadd && options?.privateKey
        ), 'No token or suitable parameters to sign the request.', 401);
        token || (token = signRequest(
            options.btih, options.nftadd, options.privateKey
        ).token);
        ancList[i] = ancList[i].replace(placeholder, token);
    }
    return ancList;
};

const verifyRequest = async (infoHash, token) => {
    const libErc721 = (await utilitas.need('bistrot')).erc721;
    const [nftadd, signature] = utilitas.ensureString(token).split('-');
    const tokenURI = await libErc721.getTokenURI(nftadd);
    const btih = getBtihByMagnetURI(tokenURI);
    const data = buildData(btih, nftadd);
    const hash = encryption.digestObject(data)
    const userAddress = await recoverAddressBySignatureAndHash(signature, hash);
    const balance = await libErc721.balanceOf(nftadd, userAddress);
    assert(btih === infoHash && balance > 0, 'No NFT token match the btih.', 403);
    return { token, btih, nftadd, signature, data, hash, userAddress, balance };
};

export {
    _NEED,
    defaultToken,
    getAnnounce,
    placeholder,
    publish,
    signRequest,
    verifyRequest,
};
