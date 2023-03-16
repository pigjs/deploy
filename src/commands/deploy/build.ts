import { exec } from 'child_process';
import { spinnerLog } from '../../utils/logs';

/** stdout 或 stderr 允许的最大字节数，超出则关闭子进程  https://www.nodeapp.cn/child_process.html#child_process_child_process_exec_command_options_callback */
const maxBuffer = process.env.MAXBUFFER || 1024 * 1024 * 2;

/** 项目打包 */
export async function projectBuild(script: string) {
    const spinner = spinnerLog('项目打包中...').start();
    try {
        await new Promise((resolve, reject) => {
            // @ts-ignore
            exec(script, { maxBuffer }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
        spinner.succeed('项目打包成功');
    } catch (err) {
        spinner.fail('项目打包失败,请检查项目配置，重新部署！');
        console.log(err);
        process.exit(0);
    }
}
