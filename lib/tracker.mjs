import { defaultToken, verifyRequest } from './auth.mjs';
import { hostname, httpPort, udpPort } from './config.mjs';
import { Server } from 'bittorrent-tracker';
import { ssl, utilitas } from 'utilitas';
import peerid from 'bittorrent-peerid';

const getServer = () => _server;
const log = content => utilitas.log(content, import.meta.url);

let _server;

const init = async (options) => {
    if (options?.ssl) {
        assert(options?.domain, 'Domain is required for SSL.');
        options.ssl = await ssl.init(options.domain, { instant: true });
    }
    _server = new Server({
        udp: false,       // enable udp server? [default=true]
        http: true,       // enable http server? [default=true]
        ws: false,        // enable websocket server? [default=true]
        stats: true,      // enable web-based statistics? [default=true]
        trustProxy: true, // enable trusting x-forwarded-for header for remote IP [default=false]
        filter: async (infoHash, params, callback) => {
            // Blacklist/whitelist function for allowing/disallowing torrents. If this option is
            // omitted, all torrents are allowed. It is possible to interface with a database or
            // external system before deciding to allow/deny, because this function is async.
            //
            // It is possible to block by peer id (whitelisting torrent clients) or by secret
            // key (private trackers). Full access to the original HTTP/UDP request parameters
            // are available in `params`.
            //
            // If the callback is passed `null`, the torrent will be allowed.
            // If the callback is passed an `Error` object, the torrent will be disallowed
            // and the error's `message` property will be given as the reason.

            try {
                const token = utilitas.ensureString((new URL(
                    params.httpReq.url, 'http://placeholder'
                )).pathname.split('/')[2]);
                if (Function.isFunction(options?.auth)) {
                    await options.auth(infoHash, params);
                } else if (options?.auth && token === defaultToken) {
                } else if (options?.auth && token) {
                    await verifyRequest(infoHash, token);
                }
                console.log('OKKKKKKKKKKKK');
            } catch (error) { console.log(error); callback(error); }            // Blocked: new Error('disallowed');
            callback(null);                                                     // OK
        },
        ...options || {},
    });

    // Internal http, udp, and websocket servers exposed as public properties. {
    // _server.http
    // _server.udp
    // _server.ws
    // }
    _server.on('listening', () => {
        ['http', 'udp', 'udp6', 'ws'].map(p => {
            if (!_server[p]) { return; }
            const addr = _server[p].address();
            log(`Listening: ${p}://${addr.address}:${addr.port}`);
        });
    });

    _server.on('error', log);
    _server.on('warning', log);
    _server.on('start', eventStart);
    _server.on('complete', eventComplete);
    _server.on('update', eventUpdate);
    _server.on('stop', eventStop);
    _server.listen(
        { http: options?.httpPort || (options?.ssl ? 443 : 0) || httpPort, udp: options?.udpPort || udpPort },
        { http: options?.httpHost || hostname, udp: options?.udpHost || hostname },
        () => log(`Server is up!`)
    );
    log(`Storage provider: ${globalThis?.swarmHijack ? 'DBIO' : 'LRU'}.`);
    return _server;
};

const getStatus = async () => {
    assert(_server, 'Server is not initialized.', 500);

    const countPeers = (filter) => {
        let cnt = 0;
        for (let key in allPeers) {
            hasOwnProperty.call(allPeers, key) && filter(allPeers[key]) && cnt++;
        }
        return cnt;
    };

    const groupByClient = () => {
        const clients = {}
        for (const key in allPeers) {
            if (!hasOwnProperty.call(allPeers, key)) { continue; }
            const peer = allPeers[key];
            clients[peer.client.client] || (clients[peer.client.client] = {});
            const client = clients[peer.client.client]
            // If the client is not known show 8 chars from peerId as version
            const version = peer.client.version
                || Buffer.from(peer.peerId, 'hex').toString().substring(0, 8);
            client[version] || (client[version] = 0);
            client[version]++;
        }
        return clients;
    };

    let [activeTorrents, allPeers, infoHashes] = [0, {}, Object.keys(_server.torrents)];

    infoHashes.forEach(infoHash => {
        const peers = _server.torrents[infoHash].peers;
        const keys = peers.keys;
        (keys.length > 0) && activeTorrents++;
        keys.forEach(peerId => {
            // Don't mark the peer as most recently used for stats
            const peer = peers.peek(peerId)
            if (peer == null) { return } // peers.peek() can evict the peer
            if (!hasOwnProperty.call(allPeers, peerId)) {
                allPeers[peerId] = {
                    ipv4: false, ipv6: false, seeder: false, leecher: false,
                };
            }
            peer.ip.includes(':') ? (allPeers[peerId].ipv6 = true)
                : (allPeers[peerId].ipv4 = true);
            peer.complete ? (allPeers[peerId].seeder = true)
                : (allPeers[peerId].leecher = true);
            allPeers[peerId].peerId = peer.peerId;
            allPeers[peerId].client = peerid(peer.peerId);
        })
    });

    const isSeederOnly = peer => peer.seeder && peer.leecher === false;
    const isLeecherOnly = peer => peer.leecher && peer.seeder === false;
    const isSeederAndLeecher = peer => peer.seeder && peer.leecher;
    const isIPv4 = peer => peer.ipv4;
    const isIPv6 = peer => peer.ipv6;

    return {
        torrents: infoHashes.length,
        activeTorrents,
        peersAll: Object.keys(allPeers).length,
        peersSeederOnly: countPeers(isSeederOnly),
        peersLeecherOnly: countPeers(isLeecherOnly),
        peersSeederAndLeecher: countPeers(isSeederAndLeecher),
        peersIPv4: countPeers(isIPv4),
        peersIPv6: countPeers(isIPv6),
        clients: groupByClient(),
    };
};

const logEvent = async (name, address, event) => {
    log(`Client (${address}) event: ${name}`);
    const info = {
        numwant: event.numwant,
        uploaded: event.uploaded,
        downloaded: event.downloaded,
        left: event.left,
        event: event.event,
        compact: event.compact,
        info_hash: event.info_hash,
        peer_id: event.peer_id,
        port: event.port,
        type: event.type,
        action: event.action,
        ip: event.ip,
        addr: event.addr,
        headers: event.headers,
        utl: event.httpReq.socket.url,
    };
    log(JSON.stringify(info, null, 2));
};

const eventStart = async (address, event) => {
    logEvent('start', address, event);
};

const eventComplete = async (address, event) => {
    logEvent('complete', address, event);
};

const eventUpdate = async (address, event) => {
    logEvent('update', address, event);
};

const eventStop = async (address, event) => {
    logEvent('stop', address, event);
};

export {
    getServer,
    getStatus,
    init,
};
