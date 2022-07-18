import Deploy from './deploy'
import getUserConfig from './utils/get-user-config'
import {YOpts} from './types'
import ora from 'ora'

export default function build(opts:YOpts){
    const spinner = ora('正在读取配置文件...').start()
    const {cwd,config,...options} = opts
    let userConfig
    try {
        userConfig = getUserConfig({cwd,customPath:config})
    }catch(err){
        spinner.fail('配置文件读取失败')
        console.log(err)
        process.exit()
    }
    const props = {
        cwd,
        ...userConfig,
        ...options
    }
    spinner.succeed('配置文件读取成功')
    const deploy = new Deploy(props)
    deploy.run()
}