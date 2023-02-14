import { spinnerLog } from '../../utils/logs';
import { getRemoteVersion } from './getRemoteVersion';
import { revertVersion } from './revertVersion';
import { selectVersion } from './selectVersion';

import type { DeployConfig } from '../../types';

export default async function revert(config: DeployConfig) {
    const { serverConfig } = config;
    const [item] = serverConfig;
    const { webVersion } = item;
    if (!webVersion?.sourceDir) {
        spinnerLog().fail('当前配置不支持版本回滚!');
        process.exit(0);
    } else {
        const spinner = spinnerLog('正在获取远程服务器项目版本...').start();
        const versions = await getRemoteVersion(serverConfig);
        if (versions.length === 0) {
            spinner.fail('服务器上没有可回滚的版本!');
            return;
        }
        spinner.succeed('获取远程服务器项目版本成功');
        const version = await selectVersion(versions);
        if (version === 'cancel') {
            spinnerLog().succeed('已取消');
            process.exit(0);
        }
        const spinnerTwo = spinnerLog('正在进行版本回滚...').start();
        await revertVersion(serverConfig, version);
        spinnerTwo.succeed('版本回滚完成');
    }
}
