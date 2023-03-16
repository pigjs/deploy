import { spinnerLog } from '../logs';
import { getUserConfig } from './getUserConfig';
import { validateConfig } from './validateConfig';

import type { DeployConfig, UserConfig } from '../../types';

/** 处理默认值 */
function mergeDefaultConfig(config: UserConfig) {
    const { serverConfig: _serverConfig, ...otherConfig } = config;
    const serverConfig = Array.isArray(_serverConfig) ? _serverConfig : [_serverConfig];
    const resetServerConfig = serverConfig.map((item) => {
        const cloneItem = {
            ...item
        };
        const { privateKey, webDir, webVersion } = item;
        if (webVersion) {
            const { sourceDir, maxLimit = 5 } = webVersion;
            // 去除路径最后的 / 防止软链接出错
            cloneItem.webDir = webDir.replace(/\/$/g, '');
            cloneItem.webVersion = {
                ...webVersion,
                sourceDir: sourceDir.replace(/\/$/g, ''),
                maxLimit
            };
        }
        if (privateKey && privateKey.indexOf('~') === 0) {
            const HOME_PATH = process.env.HOME || process.env.USERPROFILE;
            if (!HOME_PATH) {
                throw new Error(`未找到 privateKey: ${privateKey}`);
            }
            const key = privateKey.replace('~', HOME_PATH);
            return {
                ...cloneItem,
                privateKey: key
            };
        }
        return cloneItem;
    });
    return {
        ...otherConfig,
        serverConfig: resetServerConfig
    };
}

type Options = DeployConfig & {
    /** 是否需要读取配置文件 */
    readConfigFile?: boolean;
};

/** 获取配置 */
export async function getConfig(options: Options) {
    const { cwd, customPath, readConfigFile, ...otherOptions } = options;
    let userConfig: UserConfig;
    if (readConfigFile) {
        const spinner = spinnerLog('正在读取配置文件...').start();
        try {
            userConfig = getUserConfig({ cwd, customPath });
        } catch (err) {
            spinner.fail('配置文件读取失败');
            throw new Error(err);
        }
        spinner.succeed('配置文件读取成功');
    }
    const config = {
        ...userConfig,
        ...otherOptions
    };

    // 校验参数
    validateConfig(config);
    const resetConfig = mergeDefaultConfig(config);
    return {
        ...resetConfig,
        cwd
    };
}
