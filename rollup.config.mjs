import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

/** @type {import('rollup').RollupOptions} */
export default {
    input: 'index.mjs',
    output: {
        file: 'dist/index.cjs',
        inlineDynamicImports: true,
        format: 'cjs',
    },
    external: [
        '@waylaidwanderer/chatgpt-api',
        'node-gyp-build',
        'utp-native',
    ],
    plugins: [
        commonjs(),
        nodeResolve({ preferBuiltins: true }),
        json(),
        {
            name: 'bundle-content-replacement',
            writeBundle: async () => {
                const filePath = join(process.cwd(), 'dist/index.cjs');
                let output = (await readFile(filePath)).toString();
                // node_modules/xml2js/lib/xml2js.js:47
                output = output.replace(
                    "ValidationError.name = 'ValidationError';",
                    "",
                );
                // node_modules/xml2js/lib/xml2js.js:61
                output = output.replace(
                    "Parser.name = 'Parser';",
                    "",
                );
                // node_modules/cross-fetch-ponyfill/browser.js:10
                output = output.replace(
                    "self.fetch || (() => { throw new Error('global fetch is not available!') });",
                    "global.fetch || (() => { throw new Error('global fetch is not available!') });",
                );
                // node_modules/uint8-util/browser.js:51
                output = output.replace(
                    "const scope = typeof window !== 'undefined' ? window : self;",
                    "const scope = typeof window !== 'undefined' ? window : globalThis;",
                );
                await writeFile(filePath, output);
            },
        },
    ],
};
