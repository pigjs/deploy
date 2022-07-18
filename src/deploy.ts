import {validate} from 'schema-utils'
import ora from 'ora'
import merge from 'lodash.merge'
import {exec} from 'child_process'
import {NodeSSH} from 'node-ssh'
import type {NodeSSH as NodeSSHProps} from 'node-ssh/lib/typings'
import {basename} from 'path'
import rimraf from 'rimraf'

import schema from './utils/schema'
import defaultConfig from './utils/default-config'

import {YOpts} from './types'

class Deploy {

    appPath:string
    ssh:NodeSSHProps
    options:Omit<YOpts, 'config' | 'cwd'>
    failed:any[] = [] // 上传失败队列
    retryCount:number = 3 // 失败重试次数

    constructor(opts:YOpts){
        const {cwd,...options} = opts

        this.appPath = cwd
        this.ssh = new NodeSSH()
        this.options = options
    }

    async run(){

        const startTime = new Date

        await this.validateOptions()
        await this.getConfig()
        await this.runBuild()
        await this.connectSSH()
        await this.uploadServer()
        await this.uploadDone()

        const endTime = new Date

        this.doneMessage(startTime,endTime)
    }

    // 校验参数
    async validateOptions(){
        const restSchema:any = schema
        await validate(restSchema,this.options,{name:'ye-deploy'})
    }

    // 获取配置信息
    async getConfig() {
        const config:YOpts = merge(defaultConfig,this.options)
        if(config.privateKey && config.privateKey.indexOf('~') == 0){
            const HOME_PATH = process.env.HOME || process.env.USERPROFILE
            if(!HOME_PATH){
                throw new Error(`未找到 privateKey：${config.privateKey}`);
            }
            const privateKey = config.privateKey.replace('~', HOME_PATH)
            this.options = {
                ...config,
                privateKey
            }
        }else {
            this.options = config
        }
    }

    // 项目打包
    async runBuild() {
        const spinner = ora('项目打包中...').start()
        try {
            await new Promise((resolve,reject)=>{
                exec(this.options.script,(err)=>{
                    if(err){
                        reject(err)
                    }else {
                        resolve(true)
                    }
                })
            })
            spinner.succeed('项目打包成功')
        }catch(err){
            spinner.fail('项目打包失败,请检查项目配置，重新部署！')
            console.log(err);
            process.exit()
        }
    }

    // 连接服务器
    async connectSSH() {
        const spinner = ora('正在连接服务器...').start()
        try {
            await this.ssh.connect(this.options)
            spinner.succeed('服务器连接成功')
        }catch(err){
            spinner.fail('服务器连接失败!')
            console.log(err);
            process.exit()
        }
    }

    // 上传到服务器
    async uploadServer() {
        await this.clearOldFile()

        try {
            await this.ssh.putDirectory(this.options.distPath,this.options.webDir,{
                recursive:true,
                concurrency:10,
                validate:(itemPath)=>{
                    // 强制禁止 node_modules这些文件上传
                    const baseName = basename(itemPath)
                    const prohibitFiles = ['node_modules']
                    if(prohibitFiles.includes(baseName)){
                        return false
                    }
                    if(this.options.useUploadValidate){
                        return this.options.useUploadValidate(itemPath)
                    }
                    return true
                },
                tick:(localPath,remotePath,error)=>{
                    if(error){
                        console.log('上传失败',localPath)
                        this.failed.push({localPath,remotePath})
                    }else {
                        console.log('上传成功',localPath);
                    }
                }
            })
            this.uploadServerAgain()
        }catch(err){
            ora().fail('部署失败!')
            throw new Error(err)
        }

    }

    // 上传失败重试
    async uploadServerAgain(){
        // 存在上传失败的文件
        if(this.failed.length > 0){
            // 重试多次后还是失败的
            if(this.retryCount <= 0){
                console.log('上传到服务器失败，请检查原因!')
                console.log('上传失败的文件:',this.failed);
                process.exit()
            }
            this.retryCount--
            const failed = this.failed.map(file=>{
                return new Promise(async (resolve)=>{
                    try {
                        await this.ssh.putFile(file.localPath,file.remotePath)
                        console.log('上传成功',file.localPath);
                        resolve(file.localPath)
                    }catch(err){
                        console.log('上传失败',file.localPath);
                        this.failed.push(file)
                        resolve(file.localPath)
                    }
                })
            })
            // 置空失败队列
            this.failed = []
            await Promise.all(failed)
            // 重新上传后还有失败的
            if(this.failed.length > 0){
                await this.uploadServerAgain()
            }
        }
    }

    // 上传完成
    async uploadDone(){
        // 上传完成后允许用户自定义一些操作
        if(this.options.useUploadDone){
            await this.options.useUploadDone(this.runCommand.bind(this))
        }
        // 断开连接
        this.ssh.dispose()
        if(this.options.delDistFile){
            rimraf.sync(this.options.distPath)
        }
    }

    // 清空线上目标目录的旧文件
    async clearOldFile() {
        let status = true
        try {
            await this.runCommand({command:`find ${this.options.webDir}`,cwd:'/',log:false})
        }catch(err){
            // 报错说明当前服务器上没有这个目录不需要处理
            status = false
        }
        if(status){
            const commands = ['ls', 'rm -rf *']
            await Promise.all(commands.map(async (it) => {
                return await this.runCommand({command:it,log:false})
            }))
        }
    }

    // command 命令操作
    async runCommand({command,cwd,log=true}:{ command:string,cwd?:string,log?:boolean}){
        return new Promise(async (resolve,reject)=>{
            await this.ssh.execCommand(command, { cwd: cwd || this.options.webDir,
                onStdout:(chunk)=>{
                    if(log){
                        console.log(chunk.toString('utf8'))
                    }
                },
                onStderr:(chunk)=>{
                    const errText = chunk.toString('utf8')
                    if(log){
                        console.log(errText)
                    }
                    reject(errText)
                }
            })
            resolve(true)
        })
    }

    async doneMessage(startTime:Date,endTime:Date){

        ora().succeed(`开始时间：${startTime.toLocaleString()}`)
        ora().succeed(`结束时间：${endTime.toLocaleString()}`)
        const time = Math.round((endTime.getTime() - startTime.getTime()) / 1e3)
        ora().succeed(`总耗时：${time}s`)

        ora().succeed('部署成功!')
        console.log(`项目部署地址: ${this.options.webDir}`)
    }
}

export default Deploy










