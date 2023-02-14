import { exec } from 'child_process';
import { spinnerLog } from '../../utils/logs';

/** 项目打包 */
export async function projectBuild(script: string) {
    const spinner = spinnerLog('项目打包中...').start();
    try {
        await new Promise((resolve, reject) => {
            exec(script, (err) => {
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
