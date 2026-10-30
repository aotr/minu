/* Build with Vite+ (Rolldown). Zero runtime dependencies, four Vite builds:
   minified UMD + ESM, then unminified UMD, per variant. */
const fs = require('fs');
const zlib = require('zlib');

const BUDGET = 4096; // gzip bytes for minified UMD
const ESM_BUDGET = 4608; // gzip bytes for the unminified ESM build

const variants = [
    {
        entry: 'src/minu.js',
        name: 'minu',
        minUmd: 'minu.min.js',
        esm: 'minu.esm.mjs',
        umd: 'minu.js',
    },
    {
        entry: 'src/minu-secure.js',
        name: 'minu',
        minUmd: 'minu.secure.min.js',
        esm: 'minu.secure.esm.mjs',
        umd: 'minu.secure.js',
        external: ['dompurify'],
        globals: { dompurify: 'DOMPurify' },
    },
];

async function build() {
    const { build: viteBuild } = await import('vite-plus');

    if (fs.existsSync('dist')) fs.rmSync('dist', { recursive: true });
    fs.mkdirSync('dist');

    const run = (variant, minify, formats, fileName) => viteBuild({
        configFile: false,
        logLevel: 'warn',
        publicDir: false,
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            reportCompressedSize: false,
            target: 'es2018',
            minify,
            lib: {
                entry: variant.entry,
                name: variant.name,
                formats,
                fileName: (format) => fileName(format),
            },
            rollupOptions: {
                external: variant.external,
                output: {
                    exports: 'default',
                    globals: variant.globals,
                },
            },
        },
    });

    for (const variant of variants) {
        await run(variant, true, ['umd', 'es'], (format) => format === 'es' ? variant.esm : variant.minUmd);
        await run(variant, false, ['umd'], () => variant.umd);
    }

    console.log('\n--- Output sizes ---');
    let overBudget = false;

    fs.readdirSync('dist').sort().forEach((file) => {
        const contents = fs.readFileSync(`dist/${file}`);
        const kb = (contents.length / 1024).toFixed(2);
        const gzip = zlib.gzipSync(contents).length;
        const isMin = file.endsWith('.min.js');
        const isEsm = file.endsWith('.mjs');
        const limit = isMin ? BUDGET : ESM_BUDGET;
        const shipped = isMin || isEsm;
        const flag = shipped && gzip > limit ? '  OVER BUDGET' : '';
        console.log(`  ${file.padEnd(25)} ${kb.padStart(6)} KB  ${String(gzip).padStart(5)} B gzip${flag}`);
        if (shipped && gzip > limit) overBudget = true;
    });

    if (overBudget) {
        console.error(`\nSize budget exceeded (${BUDGET} B min / ${ESM_BUDGET} B esm gzip). Shrink the feature or raise the budget deliberately.`);
        process.exit(1);
    }

    console.log('\nBuild complete!');
}

build().catch((error) => {
    console.error(error);
    process.exit(1);
});
