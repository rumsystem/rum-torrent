#!/usr/bin/env node

import { tracker } from '../index.mjs';

const args = await (async (options) => {
    const { parseArgs } = await import('node:util');
    if (parseArgs) { // https://kgrz.io/node-has-native-arg-parsing.html
        const { values } = parseArgs({
            options: {
                domain: { type: 'string', short: 'd', default: '' },
                ssl: { type: 'boolean', short: 's', default: false },
            },
            ...options || {},
        });
        return values;
    }
    let args = {}; // simple fallback for node version < 19 // buggy for boolean
    process.argv.map(arg => {
        const item = arg.replace(/^\-*([^=]*)=(.*)$/ig, '$1<,>$2').split('<,>');
        item.length > 1 && (args[item[0]] = item[1]);
    });
    return args;
})();

await tracker.init({ ssl: args.ssl, domain: args.domain });
