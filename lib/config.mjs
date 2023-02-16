import { randomString } from './encryption.mjs';

const defaultToken = randomString();

const announce = [
    `https://prs-bp2.press.one/announce/${token}`,
];

const get = {
    announce,
};

export default get;
