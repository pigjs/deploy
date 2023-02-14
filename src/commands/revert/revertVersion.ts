import type { ServerConfig } from '../../types';
import { SshServer } from '../../utils/sshServer';

/** 版本回滚 */
export async function revertVersion(config: ServerConfig[], version: string) {
    const configPromise = config.map((item) => {
        return new Promise(async (resolve) => {
            const { webDir, webVersion, ...givenConfig } = item;
            const { sourceDir } = webVersion;
            const targetDir = `${sourceDir}/${version}`;
            const sshServer = new SshServer();
            await sshServer.connectSSH(givenConfig);
            const data = await sshServer.softLink(targetDir, webDir);
            sshServer.dispose();
            resolve(data);
        });
    });
    await Promise.all(configPromise);
}
