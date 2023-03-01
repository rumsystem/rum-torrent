import { utilitas } from 'utilitas';

const natSuccess = ' (NAT-UPNP Success)';
const renderSplit = ' : ';
const ignore = new Set([
    'blockedPeers', 'dhtNatUpnp', 'downloaded', 'hotswaps', 'infoHash', 'peers',
    'queuedPeers', 'runningTime', 'speed', 'status', 'timeRemaining',
    'torrentNatUpnp', 'torrents', 'uploaded',
]);

let _maxKeyLength = 0;

const renderKeyValue = (o) => {
    for (let k in o) {
        if (ignore.has(k)) { continue; }
        _maxKeyLength = Math.max(_maxKeyLength, k.length);
        const avl = process.stdout.columns - _maxKeyLength - renderSplit.length;
        const v = utilitas.ensureArray(o[k]);
        for (let i in v) {
            const [sV, more, rV] = [utilitas.ensureString(v[i]), ~~i > 2, []];
            if (more) { rV.push(`*   ${v.length - 3} more item(s)...`); } else {
                const pV = sV.split('');
                while (pV.length) { rV.push(pV.splice(0, avl).join('')); }
            }
            rV.map((dV, dI) => console.log([
                (~~i || ~~dI ? '' : k).padEnd(_maxKeyLength, ' '), dV
            ].join(renderSplit)));
            if (more) { break; }
        }
    }
};

const render = (status) => {
    console.clear();
    utilitas.fullLengthLog('RUM-PT Node Information');
    renderKeyValue({
        ...status,
        dhtPort: `${status.dhtPort}${status.dhtNatUpnp ? natSuccess : ''}`,
        torrentPort: `${status.torrentPort}${status.torrentNatUpnp ? natSuccess : ''}`,
    });
    status.torrents.map((r, k) => {
        utilitas.fullLengthLog(`Torrent Job: ${k + 1} [${r.status}]`);
        renderKeyValue({
            name: r.name,
            throughput: `speed: ${r.speed}, rx: ${r.downloaded}, tx: ${r.uploaded}`,
            time: `running: ${r.runningTime}, remaining: ${r.timeRemaining}`,
            network: `peers: ${r.peers}, queued: ${r.queuedPeers}, blocked: ${r.blockedPeers}, hotswaps: ${r.hotswaps}`,
            ...r,
        });
    });
    utilitas.fullLengthLog();
};

export {
    render,
};
