#!/usr/bin/env node

import { dashboard, torrent } from '../index.mjs';
import { utilitas } from 'utilitas';

const log = content => utilitas.log(content, import.meta.url);

const args = await (async (options) => {
    const { parseArgs } = await import('node:util');
    if (parseArgs) { // https://kgrz.io/node-has-native-arg-parsing.html
        const { values } = parseArgs({
            options: { seed: { type: 'string', short: 's', default: '' } },
            ...options || {},
        });
        return values;
    }
    let args = {}; // simple fallback for node version < 19
    process.argv.map(arg => {
        const item = arg.replace(/^\-*([^=]*)=(.*)$/ig, '$1<,>$2').split('<,>');
        item.length > 1 && (args[item[0]] = item[1]);
    });
    return args;
})();

try {
    assert(args.seed, 'Please provide a file to seed or torrent-info(.torrent or magnet link) to download.', 400);
} catch (e) { log(e); process.exit(1); }

await torrent.init({ callback: dashboard.render });
await torrent.seed(args.seed);
