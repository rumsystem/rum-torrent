import { encryption } from 'utilitas';

const defaultToken = encryption.uniqueString();
const [hostname, httpPort, udpPort] = ['0.0.0.0', 8965, 8966];

const announce = [
    'http://prs-bp2.press.one:8965/announce',
    // 'http://localhost:8965/announce',
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
