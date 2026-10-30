/* Build with Vite+ (Rolldown). Zero runtime dependencies, four Vite builds:
   minified UMD + ESM, then unminified UMD, per variant. */
const fs = require('fs');
const zlib = require('zlib');

const BUDGET = 4096; // gzip bytes for minified UMD
const SECURE_BUDGET = 4352; // secure UMD carries the DOMPurify allowlist
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

const examples = [
    ['basic', 'Basic auto-load', 'Fetch an HTML fragment on load'],
    ['form', 'Form + states', 'POST, loader, indicator, disable'],
    ['tabs', 'Tabs', 'One shared target'],
    ['search', 'Search', 'Debounce and minu-select'],
    ['polling', 'Polling', 'every 2s and visibility pause'],
    ['lazy', 'Lazy reveal', 'IntersectionObserver'],
    ['swap', 'Swap modes', 'All eight swap behaviors'],
    ['oob', 'OOB updates', 'One response, three regions'],
    ['headers', 'Headers', 'Trigger, redirect, refresh'],
    ['events', 'Events', 'Lifecycle and cancel'],
    ['json', 'JSON boundary', 'Attributes vs responses'],
    ['live', 'Live SSE', 'Server push'],
];

const countTests = () => fs.readdirSync('test')
    .filter((file) => file.endsWith('.test.js'))
    .reduce((total, file) => {
        const source = fs.readFileSync(`test/${file}`, 'utf8');
        return total + (source.match(/\btest\(/g) || []).length;
    }, 0);

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
    let gzipSize = 0;

    fs.readdirSync('dist').sort().forEach((file) => {
        const contents = fs.readFileSync(`dist/${file}`);
        const kb = (contents.length / 1024).toFixed(2);
        const gzip = zlib.gzipSync(contents).length;
        if (file === 'minu.min.js') gzipSize = gzip;
        const isMin = file.endsWith('.min.js');
        const isEsm = file.endsWith('.mjs');
        const limit = isMin
            ? (file.startsWith('minu.secure.') ? SECURE_BUDGET : BUDGET)
            : ESM_BUDGET;
        const shipped = isMin || isEsm;
        const flag = shipped && gzip > limit ? '  OVER BUDGET' : '';
        console.log(`  ${file.padEnd(25)} ${kb.padStart(6)} KB  ${String(gzip).padStart(5)} B gzip${flag}`);
        if (shipped && gzip > limit) overBudget = true;
    });

    if (overBudget) {
        console.error(`\nSize budget exceeded (${BUDGET} B min / ${SECURE_BUDGET} B secure min / ${ESM_BUDGET} B esm gzip). Shrink the feature or raise the budget deliberately.`);
        process.exit(1);
    }

    const pkg = require('./package.json');
    const release = {
        version: pkg.version,
        gzip: gzipSize,
        gzipLabel: `${(gzipSize / 1024).toFixed(1)} KB`,
        tests: countTests(),
        examples: examples.map(([slug, title, description]) => ({ slug, title, description })),
    };
    fs.writeFileSync('release.json', `${JSON.stringify(release, null, 2)}\n`);
    console.log(`\n  release.json               ${release.version} · ${release.gzipLabel} · ${release.tests} tests`);

    console.log('\nBuild complete!');
}

build().catch((error) => {
    console.error(error);
    process.exit(1);
});
