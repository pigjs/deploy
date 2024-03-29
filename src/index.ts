import deploy from './commands/deploy';
import revert from './commands/revert';
import { getConfig } from './utils/getConfig';
import { timeDirector } from './utils/logs';

import type { DeployConfig } from './types';

const commands = ['revert', 'deploy'] as const;

export interface Commands extends DeployConfig {
    /** 命令 */
    command: typeof commands[number];
    /** 是否需要读取配置文件 */
    readConfigFile?: boolean;
}

export default async function (options: Commands) {
    const { command, ...otherOptions } = options;

    if (!commands.includes(command)) {
        console.log('命令不存在');
        process.exit(0);
    } else {
        const config = await getConfig(otherOptions);

        if (command === 'revert') {
            timeDirector(() => revert(config));
        }
        if (command === 'deploy') {
            timeDirector(() => deploy(config));
        }
    }
}
