import { encryption } from 'utilitas';

const defaultToken = encryption.uniqueString();
const [hostname, httpPort, udpPort] = ['0.0.0.0', 8965, 8966];

const announce = [
    'https://prs-bp2.press.one/announce',
    // 'http://127.0.0.1:8965/announce',
];

const localAnnounce = announce.map(url => `${url}/${defaultToken}`);

export {
    announce,
    defaultToken,
    hostname,
    httpPort,
    localAnnounce,
    udpPort,
};
