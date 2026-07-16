const esbuild = require('esbuild');
const fs = require('fs');

const shared = {
    bundle: false,
    target: 'es2018',
    logLevel: 'info',
};

const builds = [
    // minu.js — UMD
    {
        ...shared,
        entryPoints: ['src/minu.js'],
        outfile: 'dist/minu.js',
        format: 'iife',
        minify: false,
        globalName: 'minu',
    },
    // minu.min.js — UMD minified
    {
        ...shared,
        entryPoints: ['src/minu.js'],
        outfile: 'dist/minu.min.js',
        format: 'iife',
        minify: true,
        globalName: 'minu',
    },
    // minu.esm.js — ES module
    {
        ...shared,
        entryPoints: ['src/minu.js'],
        outfile: 'dist/minu.esm.js',
        format: 'esm',
        minify: true,
    },
    // minu-secure.js — UMD
    {
        ...shared,
        entryPoints: ['src/minu-secure.js'],
        outfile: 'dist/minu.secure.js',
        format: 'iife',
        minify: false,
        globalName: 'minu',
    },
    // minu-secure.min.js — UMD minified
    {
        ...shared,
        entryPoints: ['src/minu-secure.js'],
        outfile: 'dist/minu.secure.min.js',
        format: 'iife',
        minify: true,
        globalName: 'minu',
    },
    // minu-secure.esm.js — ES module
    {
        ...shared,
        entryPoints: ['src/minu-secure.js'],
        outfile: 'dist/minu.secure.esm.js',
        format: 'esm',
        minify: true,
    },
];

async function build() {
    // Ensure dist/ exists
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    console.log('Building minu...\n');

    for (const config of builds) {
        await esbuild.build(config);
    }

    // Report sizes
    console.log('\n--- Output sizes ---');
    const files = fs.readdirSync('dist');
    files.forEach(file => {
        const stat = fs.statSync(`dist/${file}`);
        const kb = (stat.size / 1024).toFixed(2);
        console.log(`  ${file.padEnd(25)} ${kb} KB`);
    });

    console.log('\nBuild complete!');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
