import { encryption } from 'utilitas';

const defaultToken = encryption.uniqueString();

const announce = [
    'http://prs-bp2.press.one:8965/announce',
    // 'http://localhost:8965/announce',
];

const localAnnounce = announce.map(url => `${url}/${defaultToken}`);

const get = {
    announce,
    defaultToken,
    localAnnounce,
};

export default get;
