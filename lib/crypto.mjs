// API Compatibility: https://github.com/Press-One/bistrot/blob/master/lib/crypto.mjs

import { encryption, utilitas } from 'utilitas';
import elliptic from 'elliptic';
import keythereum from 'keythereum-pure-js';

const _NEED = ['bistrot'];
const ec = new (elliptic).ec('secp256k1');
const _assertAddress = (add, nm) => assertAddress(add, `Invalid ${nm}-address.`);
const assertAsset = address => _assertAddress(address, 'Asset');

const leftpadZero = (dex) => {
    let hex = (+dex).toString(16).toUpperCase();
    if (hex.length % 2 > 0) { hex = '0' + hex; }
    return hex;
};

const sign = (string, privateKey) => {
    privateKey = utilitas.ensureString(privateKey);
    const signature = ec.sign(string, privateKey, 'hex', { canonical: true });
    return signature.r.toString(16, 32)
        + signature.s.toString(16, 32)
        + leftpadZero(signature.recoveryParam.toString());
};

const signData = (data, privateKey) => {
    const [a, h] = [encryption.defaultAlgorithm, encryption.digestObject(data)];
    return { hash_algorithm: a, hash: h, signature: sign(h, privateKey) };
};

const assertAddress = (address, error, code = 400) => {
    assert(/^(0x)?[a-fA-F0-9]{40}$/gm.test(address), error || (
        address ? `Invalid address: ${address}.` : 'Address is required.'
    ), code);
    return address;
};

const recoverAddressBySignatureAndHash = async (sig, msgHash) => (
    await utilitas.need('bistrot')
).crypto.recoverAddressBySignatureAndHash(sig, msgHash);

export {
    _NEED,
    assertAddress,
    assertAsset,
    recoverAddressBySignatureAndHash,
    signData,
};
