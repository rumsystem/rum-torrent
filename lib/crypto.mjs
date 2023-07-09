// API Compatibility: https://github.com/Press-One/bistrot/blob/master/lib/crypto.mjs

import { encryption, utilitas } from 'utilitas';
import elliptic from 'elliptic';
import ethUtil from 'ethereumjs-util';
import secp256k1 from 'secp256k1';

const ec = new (elliptic).ec('secp256k1');

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

const recoverAddressBySignatureAndHash = (sig, msgHash) => {
    const mB = utilitas.hexDecode(msgHash, true);
    const sB = utilitas.hexDecode(sig.slice(0, 128), true);
    const ecdsaPubKey = secp256k1.ecdsaRecover(sB, Number(sig.slice(128)), mB);
    const pubKey = secp256k1.publicKeyConvert(ecdsaPubKey, false).slice(1);
    return utilitas.hexEncode(ethUtil.pubToAddress(Buffer.from(pubKey)), true);
};

export {
    signData,
    recoverAddressBySignatureAndHash,
};
