#!/usr/bin/env node

const yParser = require('yargs-parser')
const ora = require('ora')

const args = yParser(process.argv.slice(2))

if(args.v || args.version){
    console.log(require('../package.json').version)
    process.exit(0)
}

const options = {
    cwd:process.cwd(),
    ...args
}

delete options._

try {
    require('../lib/build').default(options)
}catch(err){
    ora().fail('部署失败!')
    throw new Error(err)
}