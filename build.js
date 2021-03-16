'use strict';

const fs = require('fs');
const shell = require('shelljs');
const chalk = require('chalk');
const config = require('./package-dist');

const PACKAGE = `ngx-ui-scroll`;
const NPM_DIR = `dist`;
const ESM2015_DIR = `${NPM_DIR}/esm2015`;
const ESM5_DIR = `${NPM_DIR}/esm5`;
const FESM2015_DIR = `${NPM_DIR}/fesm2015`;
const FESM5_DIR = `${NPM_DIR}/fesm5`;
const BUNDLES_DIR = `${NPM_DIR}/bundles`;
const OUT_DIR = `${NPM_DIR}/package`;
const OUT_DIR_ESM5 = `${NPM_DIR}/package/esm5`;
const OUT_DIR_ESM5_ABS = `${__dirname}/${OUT_DIR_ESM5}`;

// Package version 
shell.echo(`Setup package version`);
const versionContent = `export default {
  name: '${config.name}',
  version: '${config.version}'
};`;
const versionFilePath = './src/ui-scroll.version.ts';
shell.touch(versionFilePath);
shell.echo(versionContent).to(versionFilePath);
shell.echo(chalk.green(`${config.name} v${config.version}`));

shell.echo(`Start building...`);

shell.rm(`-Rf`, `${NPM_DIR}/*`);
shell.mkdir(`-p`, `./${ESM2015_DIR}`);
shell.mkdir(`-p`, `./${ESM5_DIR}`);
shell.mkdir(`-p`, `./${FESM2015_DIR}`);
shell.mkdir(`-p`, `./${FESM5_DIR}`);
shell.mkdir(`-p`, `./${BUNDLES_DIR}`);
shell.mkdir(`-p`, `./${OUT_DIR}`);

/* ESLint */
shell.echo(`Start ESLint`);
shell.exec(`eslint . --ext .ts`);
shell.echo(chalk.green(`ESLint completed`));

shell.cp(`-Rf`, [`src`, `*.ts`, `*.json`], `${OUT_DIR}`);

/* AoT compilation */
shell.echo(`Start AoT compilation`);
if (shell.exec(`ngc -p ${OUT_DIR}/tsconfig-build.json`).code !== 0) {
  shell.echo(chalk.red(`Error: AoT compilation failed`));
  shell.exit(1);
}
shell.echo(chalk.green(`AoT compilation completed`));

shell.echo(`Copy ES2015 for package`);
shell.cp(`-Rf`, [`${NPM_DIR}/src/`, `${NPM_DIR}/*.js`, `${NPM_DIR}/*.js.map`], `${ESM2015_DIR}`);

/* BUNDLING PACKAGE */
shell.echo(`Start bundling`);
shell.echo(`Rollup package`);
if (shell.exec(`rollup -c rollup.es.config.js -i ${NPM_DIR}/${PACKAGE}.js -o ${FESM2015_DIR}/${PACKAGE}.js`).code !== 0) {
  shell.echo(chalk.red(`Error: Rollup package failed`));
  shell.exit(1);
}

shell.echo(`Produce ESM5/FESM5 versions`);
shell.exec(`ngc -p ${OUT_DIR}/tsconfig-build.json --target es5 -d false --outDir "${OUT_DIR_ESM5_ABS}" --sourceMap`);
shell.cp(`-Rf`, [`${OUT_DIR_ESM5}/src/`, `${OUT_DIR_ESM5}/*.js`, `${OUT_DIR_ESM5}/*.js.map`], `${ESM5_DIR}`);
if (shell.exec(`rollup -c rollup.es.config.js -i ${OUT_DIR_ESM5}/${PACKAGE}.js -o ${FESM5_DIR}/${PACKAGE}.js`).code !== 0) {
  shell.echo(chalk.red(`Error: FESM5 version failed`));
  shell.exit(1);
}

shell.echo(`Run Rollup conversion on package`);
if (shell.exec(`rollup -c rollup.config.js -i ${FESM5_DIR}/${PACKAGE}.js -o ${BUNDLES_DIR}/${PACKAGE}.umd.js`).code !== 0) {
  shell.echo(chalk.red(`Error: Rollup conversion failed`));
  shell.exit(1);
}

shell.echo(`Minifying`);
shell.cd(`${BUNDLES_DIR}`);
if (shell.exec(`uglifyjs ${PACKAGE}.umd.js -c --comments -o ${PACKAGE}.umd.min.js --source-map "includeSources=true,content='${PACKAGE}.umd.js.map',filename='${PACKAGE}.umd.min.js.map'"`).code !== 0) {
  shell.echo(chalk.red(`Error: Minifying failed`));
  shell.exit(1);
}
shell.cd(`..`);
shell.cd(`..`);

shell.echo(chalk.green(`Bundling completed`));

shell.rm(`-Rf`, `${NPM_DIR}/package`);
shell.rm(`-Rf`, `${NPM_DIR}/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/*.js.map`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js`);
shell.rm(`-Rf`, `${NPM_DIR}/src/**/*.js.map`);
shell.rm(`-Rf`, `${ESM2015_DIR}/src/**/*.d.ts`);

shell.cp(`-Rf`, [`package-dist.json`, `LICENSE`, `README.md`], `${NPM_DIR}`);
fs.rename('./dist/package-dist.json', './dist/package.json', (err) => {
  if (err) {
    shell.echo(chalk.red(`Error: Renaming package-dist.json to package.json failed`));
  }
});

shell.echo(chalk.green(`End building`));
