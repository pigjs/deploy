import { existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';

import type { UserConfig } from '../../types';
import { getExistFile } from '../getExistFile';

const CONFIG_FILES = ['.hera-deploy.js'];

/** 获取用户配置 */
export function getUserConfig(opts: { cwd: string; customPath?: string }) {
    const { cwd, customPath } = opts;

    let finalPath = '';

    if (customPath) {
        finalPath = isAbsolute(customPath) ? customPath : resolve(cwd, customPath);
        if (!existsSync(finalPath)) {
            throw new Error(`找不到配置文件：${customPath}`);
        }
    }

    const configFile = finalPath || getExistFile({ cwd, files: CONFIG_FILES });
    if (!configFile) {
        throw new Error('找不到配置文件');
    }

    const userConfig = require(configFile);

    return userConfig as UserConfig;
}
