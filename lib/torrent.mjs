// Reference:
// https://webtorrent.io/docs
// https://github.com/webtorrent/webtorrent-cli/blob/master/bin/cmd.js

import { arr2base, arr2hex, text2arr } from 'uint8-util';
import { default as cbfCreateTorrent } from 'create-torrent';
import { default as parseTorrent, toMagnetURI } from 'parse-torrent';
import { announce } from './config.mjs';
import { Duration } from 'luxon';
import { end as natEnd, map as natMap } from './natUpnp.mjs';
import { getAnnounce } from './auth.mjs';
import { getPortPromise } from 'portfinder';
import { promisify } from 'util';
import { storage, utilitas } from 'utilitas';
import peerid from 'bittorrent-peerid';
import prettierBytes from 'prettier-bytes';
import randombytes from 'randombytes';
import webTorrent from 'webtorrent';

const [createdBy, comment, pathname] = ['RUM-PT', 'RUM Private Torrent', '/rum-pt'];
const [TORRENT_ENCODING, suffix] = [{ encoding: 'NULL' }, 'torrent'];
const duration = seconds => Duration.fromObject({ seconds }).toHuman();
const getDuration = options => duration(getRuntime(options));
const getUpnpDesc = (peerId, type) => [createdBy, peerId, type].join(':');
const getRuntime = start => Math.floor(start ? (Date.now() - start) / 1000 : 0);
const handleError = err => { log(err.message || err); process.exit(1); };
const handleWarning = err => log(`Warning: ${err.message || err}`);
const log = content => utilitas.log(content, import.meta.url);
const pmfCreateTorrent = promisify(cbfCreateTorrent);
// @TODO by @Leaskh: A bug related to webtorrent, this api will remove all jobs.
// const remove = (torrentId, opts) => _client && _client.remove(torrentId, opts);

let _client, _timer, _callback, VERSION_STR;

const parseTorrentFromFile = async file => await parseTorrent(
    await storage.readFile(file, TORRENT_ENCODING)
);

// https://github.com/webtorrent/create-torrent
// OPTIONS:
// {
//   name: String,             // name of the torrent (default = basename of `path`, or 1st file's name)
//   comment: String,          // free-form textual comments of the author
//   createdBy: String,        // name and version of program used to create torrent
//   creationDate: Date        // creation time in UNIX epoch format (default = now)
//   filterJunkFiles: Boolean, // remove hidden and other junk files? (default = true)
//   private: Boolean,         // is this a private .torrent? (default = false)
//   pieceLength: Number,      // force a custom piece length (number of bytes)
//   announceList: [[String]], // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
//   urlList: [String],        // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
//   info: Object,             // add non-standard info dict entries, e.g. info.source, a convention for cross-seeding
//   onProgress: Function      // called with the number of bytes hashed and estimated total size after every piece
// }
const createTorrent = async (content, options) => {
    options?.announce && assert(
        Array.isArray(options.announce?.[0]), 'Invalid tracker list.', 400
    );
    const torrent = await pmfCreateTorrent(content, {
        announceList: options?.announce || [announce],
        createdBy, private: true, comment, ...options || {}
    });
    const details = await parseTorrent(torrent);
    const magnet = toMagnetURI(details);
    return { torrent, details, magnet };
};

const createTorrentFile = async (content, options) => {
    let { torrent, details } = (options?.torrent && options?.details)
        ? { torrent: options.torrent, details: options.details }
        : await createTorrent(content, options);
    return await storage.writeTempFile(
        torrent, { filename: details.infoHash, suffix }
    );
};

const createPeerId = async () => {
    // Version number in Azureus-style. Generated from major and minor semver version.
    // For example: '0.16.1' -> '0016', '1.2.5' -> '0102'...
    VERSION_STR || (VERSION_STR = (await utilitas.which()).version
        .replace(/\d*./g, v => `0${v % 100}`.slice(-2)).slice(0, 4));
    // Version prefix string (used in peer ID). WebTorrent uses the Azureus-style
    // encoding: '-', two characters for client id ('WW'), four ascii digits for version
    // number, '-', followed by random numbers.
    // For example: '-RM0102-'...
    const VERSION_PREFIX = `-RM${VERSION_STR}-`;
    return arr2hex(text2arr(`${VERSION_PREFIX}${arr2base(randombytes(9))}`));
};

const getStreamingAddress = (subPath) =>
    `http://localhost:${_client._server.server.address().port}${pathname}`
    + (subPath ? `/${subPath}` : '');

const getClient = async (options) => {
    if (!_client) {
        const peerId = options?.peerId || await createPeerId();
        _client = new webTorrent({
            // maxConns: Number,                   // Max number of connections per torrent (default=55)
            // nodeId: String | Buffer,            // DHT protocol node ID (default=randomly generated)
            // tracker: Boolean | Object,          // Enable trackers (default=true), or options object for Tracker
            // dht: Boolean | Object,              // Enable DHT (default=true), or options object for DHT
            // lsd: Boolean,                       // Enable BEP14 local service discovery (default=true)
            // webSeeds: Boolean,                  // Enable BEP19 web seeds (default=true)
            // utp: Boolean,                       // Enable BEP29 uTorrent transport protocol (default=true)
            peerId,                                // String | Buffer, Wire protocol peer ID (default=randomly generated)
            dhtPort: options?.dhtPort,
            torrentPort: options?.torrentPort,
            blocklist: options?.blocklist,         // Array | String, List of IP's to block
            downloadLimit: options?.downloadLimit, // Number, Max download speed (bytes/sec) over all torrents (default=-1)
            uploadLimit: options?.uploadLimit,     // Number, Max upload speed (bytes/sec) over all torrents (default=-1)
        });
        _client.on('error', handleError);
        _client.createServer({ pathname });
        _client._server.server.listen(options?.httpPort || await getPortPromise());
        _client._server.server.on('error', handleError);
        _client._server.server.once('listening', () => log(
            `Streaming service is up: ${getStreamingAddress()}.`
        ));
        for (let map of [{
            private: _client.torrentPort, protocol: 'TCP',
            description: getUpnpDesc(peerId, 'TORRENT'),
        }, {
            private: _client.dhtPort, protocol: 'UDP',
            description: getUpnpDesc(peerId, 'DHT'),
        }]) {
            await natMap({
                ...map, callback: status => (
                    _client._natUpnp || (_client._natUpnp = {})
                )[map.description.split(':').pop()] = status,
            });
        }
    }
    return _client;
};

const init = async (options) => {
    await getClient(options);
    _callback = options?.callback;
    _timer = setInterval(() => (_callback || log)(
        summarize(options)
    ), 1000).unref(); // https://httptoolkit.com/blog/unblocking-node-with-unref/
};

const end = async () => {
    _timer && clearInterval(_timer);
    if (!_client) { return; }
    _client._server.server.close();
    _client.destroy();
    await natEnd();
};

const summarize = (options) => {
    let externalIp, dhtNatUpnp, torrentNatUpnp;
    for (let key in _client._natUpnp || {}) {
        if (!_client._natUpnp[key]?.response?.success) { continue; }
        externalIp = _client._natUpnp[key].externalIp;
        switch (key) {
            case 'DHT':
                dhtNatUpnp = _client._natUpnp[key].options.public; break;
            case 'TORRENT':
                torrentNatUpnp = _client._natUpnp[key].options.public; break;
        }
    }
    return {
        peerId: _client.peerId,
        nodeId: _client.nodeId,
        client: peerid(_client.peerId),
        externalIp,
        dhtPort: _client.dhtPort,
        dhtNatUpnp,
        torrentPort: _client.torrentPort || null,
        torrentNatUpnp,
        httpPort: _client._server.server.address().port,
        torrents: _client.torrents.map(torrent => {
            return {
                status: torrent.done ? 'SEEDING' : 'DOWNLOADING',
                name: torrent.name,
                infoHash: torrent?.infoHash || null,
                torrent: torrent?.memory?.torrent || null,
                magnet: torrent.magnetURI,
                speed: `${prettierBytes(torrent?.downloadSpeed || 0)}/s`,
                path: torrent?.memory?.path || null,
                downloaded: `${prettierBytes(torrent?.downloaded || 0)} / ${prettierBytes(torrent?.length || 0)}`,
                uploaded: prettierBytes(torrent?.uploaded || 0),
                runningTime: getDuration(torrent?.memory?.startTime),
                timeRemaining: torrent.timeRemaining ? duration(torrent.timeRemaining / 1000) : 'N/A',
                trackers: torrent.announce,
                peers: `${torrent.wires.filter(wire => !wire.peerChoking).length} / ${torrent.numPeers}`,
                queuedPeers: torrent._numQueued,
                blockedPeers: torrent?.memory?.blockedPeers || 0,
                hotswaps: torrent?.memory?.hotswaps || 0,
                files: torrent.files.map(file => getStreamingAddress(
                    `${torrent.infoHash}/${encodeURIComponent(file.path)}`
                )),
                wires: torrent.wires.map(wire => {
                    let [progress, tags] = ['?', []];
                    if (torrent.length) {
                        let bits = 0;
                        const piececount = Math.ceil(
                            torrent.length / torrent.pieceLength
                        );
                        for (let i = 0; i < piececount; i++) {
                            wire.peerPieces.get(i) && bits++;
                        }
                        progress = bits === piececount
                            ? 'S' : `${Math.floor(100 * bits / piececount)}%`;
                    }
                    wire.requests.length > 0 && tags.push(`${wire.requests.length} reqs`);
                    wire.peerChoking && tags.push('choked');
                    return [
                        progress.padEnd(3),
                        (wire.remoteAddress
                            ? `${wire.remoteAddress}:${wire.remotePort}`
                            : 'Unknown').padEnd(25),
                        prettierBytes(wire.downloaded).padEnd(10),
                        (prettierBytes(wire.downloadSpeed()) + '/s').padEnd(12),
                        (prettierBytes(wire.uploadSpeed()) + '/s').padEnd(12),
                        tags.join(', ').padEnd(15),
                        ...options?.verbose ? [
                            wire.requests.map(req => req.piece).join(' ').padEnd(10)
                        ] : [],
                    ].join(' ');
                }),
            }
        }),
    };
};

// https://github.com/webtorrent/webtorrent/blob/d31670e81c627bd10176e1dacaa01039c3a13e97/index.js#L236
// https://github.com/webtorrent/webtorrent/blob/d31670e81c627bd10176e1dacaa01039c3a13e97/index.js#L282
const seed = async (input, options) => {
    const fromMeta = /^magnet:|\.torrent$/ig.test(input);
    const client = await getClient(options);
    options = {
        path: fromMeta ? storage.getTempPath({ seed: input }) : input,
        announce: [], ...options || {},
    };
    let parsed;
    if (/^magnet:/ig.test(input)) {
        parsed = await parseTorrent(input);
    } else if (/\.torrent$/ig.test(input)) {
        parsed = await parseTorrentFromFile(input);
    } else {
        parsed = (await createTorrent(input)).details;
    }
    options.announce = [...new Set([
        ...parsed.announce,
        ...options.announce,
        ...getAnnounce(parsed.infoHash, options?.nftadd, options?.privateKey),
    ])];
    const torrent = fromMeta ? client.add(input, options)
        : await new Promise((resolve, reject) => {
            try { client.seed(input, options, resolve); }
            catch (err) { reject(err); }
        });
    const updateMetadata = () => log(
        `Fetching metadata from ${torrent.numPeers} peers...`
    );
    torrent.memory = {
        blockedPeers: 0, hotswaps: 0, path: options.path, startTime: Date.now(),
        torrent: fromMeta ? null : await createTorrentFile(input, {
            torrent: parsed.torrent, details: parsed.details,
        }),
    };
    torrent.on('hotswap', () => torrent.memory.hotswaps += 1);
    torrent.on('blockedPeer', () => torrent.memory.blockedPeers += 1);
    torrent.on('warning', handleWarning);
    torrent.on('infoHash', () => {
        options?.select && (torrent.so = options.select.toString());
        updateMetadata();
    });
    torrent.on('wire', updateMetadata);
    torrent.on('metadata', () => {
        torrent.removeListener('wire', updateMetadata);
        log('Verifying existing data...');
    });
    torrent.on('done', () => log(
        `Downloaded successfully from ${torrent.wires.reduce(
            (num, wire) => num + (wire.downloaded > 0), 0
        )}/${torrent.numPeers} peers in ${getDuration(torrent.memory.startTime)}.`
    ));
    torrent.once('ready', () => log(`Task ${torrent.name} is ready to stream.`));
    return torrent;
};

export {
    // remove,
    createTorrent,
    end,
    getClient,
    init,
    parseTorrent,
    parseTorrentFromFile,
    seed,
    toMagnetURI,
};
