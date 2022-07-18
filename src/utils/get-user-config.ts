import {isAbsolute,resolve} from 'path'
import {existsSync} from 'fs'

import getExistFile from './get-exist-file'

const CONFIG_FILES = [
    '.ye-deploy.js'
]

interface YOpts {
    cwd:string,
    customPath?:string
}

export default function getUserConfig(opts:YOpts){
    const {cwd,customPath} = opts

    let finalPath = ''

    if(customPath){
        finalPath = isAbsolute(customPath)?customPath:resolve(cwd,customPath)
        if(!existsSync(finalPath)){
            throw new Error(`找不到配置文件：${customPath}`)
        }
    }

    const configFile = finalPath || getExistFile({cwd,files:CONFIG_FILES})
    if(!configFile){
        throw new Error('找不到配置文件')
    }

    const userConfig = require(configFile)

    return userConfig
}