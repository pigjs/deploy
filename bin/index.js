#!/usr/bin/env node

const yParser = require('yargs-parser');

const args = yParser(process.argv.slice(2));

if (args.v || args.version) {
    console.log(require('../../package.json').version);
    process.exit(0);
} else if (args.h || args.help) {
    console.log('Usage: deploy <command> [options]');
    console.log();
    console.log('Options:');
    console.log('   -v, --version          output the version number');
    console.log('   -h, --help             output usage information');
    console.log();
    console.log('Commands:');
    console.log('   deploy      deploy Project');
    console.log('   revert   version rollback');
    process.exit(0);
} else {
    const { _: param = [], config } = args;
    let command;
    // 需要支持 1.x 版本
    if (param.length === 0) {
        command = 'deploy';
    } else if (param.includes('revert')) {
        command = 'revert';
    }
    const commands = require('../lib/index').default;
    commands({ command, customPath: config });
}
