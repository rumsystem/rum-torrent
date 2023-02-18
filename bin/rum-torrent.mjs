#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { torrent } from '../index.mjs';
import { utilitas } from 'utilitas';

const log = content => utilitas.log(content, import.meta.url);

// https://kgrz.io/node-has-native-arg-parsing.html
const { values: args } = parseArgs({
    options: {
        seed: {
            type: 'string',
            short: 's',
            default: '',
        }
    }
});

try {
    assert(args.seed, 'Please provide a file to seed or torrent-info(.torrent or magnet link) to download.', 400);
} catch (e) { log(e); process.exit(1); }

await torrent.init();
await torrent.seed(args.seed);
