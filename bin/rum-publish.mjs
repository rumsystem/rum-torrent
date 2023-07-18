#!/usr/bin/env node

import { torrent } from '../index.mjs';
import { utilitas } from 'utilitas';

const log = content => utilitas.log(content, import.meta.url);

const args = await (async (options) => {
    const { parseArgs } = await import('node:util');
    if (parseArgs) { // https://kgrz.io/node-has-native-arg-parsing.html
        const { values } = parseArgs({
            options: {
                file: { type: 'string', short: 'f', default: '' },
                key: { type: 'string', short: 'k', default: '' },
            },
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
    assert(args.file, 'Please provide a file or torrent-info(.torrent or magnet link) to publish.', 400);
} catch (e) { log(e); process.exit(1); }

const result = await torrent.publish(args.file, args.key);
console.log(result);
process.exit(0);
