import type { ServerConfig } from '../../types';
import { SshServer } from '../../utils/sshServer';

/** 获取数组中相同的值 */
function getSameValue(...args: any[]) {
    const count = {};
    args.forEach((item) => {
        item.forEach((it) => {
            if (count[it]) {
                count[it] = count[it] + 1;
            } else {
                count[it] = 1;
            }
        });
    });
    const len = args.length;
    const sameValue = [];
    Object.keys(count).forEach((item) => {
        if (count[item] === len) {
            sameValue.push(item);
        }
    });
    return sameValue;
}

/** 获取服务器项目的版本 */
export async function getRemoteVersion(config: ServerConfig[]) {
    const configPromise = config.map((item) => {
        return new Promise(async (resolve) => {
            const { webDir, webVersion, ...givenConfig } = item;
            const { sourceDir } = webVersion;
            const sshServer = new SshServer();
            await sshServer.connectSSH(givenConfig);
            const data = await sshServer.runCommand({ command: 'ls', cwd: sourceDir });
            sshServer.dispose();
            resolve(data);
        });
    });
    const res = await Promise.all(configPromise);

    const data = res
        .map((item: string) => {
            return item.split('\n');
        })
        .filter((item) => item);
    return getSameValue(...data);
}
