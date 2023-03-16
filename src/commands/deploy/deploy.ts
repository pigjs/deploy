import dayjs from 'dayjs';
import { basename } from 'path';
import type { DeployConfig, ServerConfig } from '../../types';
import { getVersion, parseVersion } from '../../utils/getVersion';
import { spinnerLog } from '../../utils/logs';
import { SshServer } from '../../utils/sshServer';

export interface Config extends Omit<DeployConfig, 'serverConfig'> {
    /** 版本号 */
    version?: string;
    serverConfig: ServerConfig;
}

export type FailedType = {
    /** 本地路径 */
    localPath: string;
    /** 远程路径 */
    remotePath: string;
};

export type FileFailedType = {
    /** 上传失败队列 */
    failed: FailedType[];
    /** 重试次数 */
    retryCount: number;
};

export class Deploy extends SshServer {
    private deployConfig: Config;
    /** 文件上传失败列表 */
    private fileFailed: FileFailedType = {
        failed: [],
        retryCount: 3
    };
    /** 部署到服务器上的地址 */
    private targetDir: string;

    constructor(config: Config) {
        super();
        this.deployConfig = config;
        const { serverConfig, version } = config;
        const { webDir, webVersion } = serverConfig;
        const { sourceDir } = webVersion || {};
        this.targetDir = version ? `${sourceDir}/${version}` : webDir;
    }
    private getText(text: string) {
        const { serverConfig } = this.deployConfig;
        const { host } = serverConfig;
        return `${host}: ${text}`;
    }
    public async run() {
        const { serverConfig, version } = this.deployConfig;
        const { webVersion, webDir, ...config } = serverConfig;
        await this.connectSSH(config, this.getText.bind(this));
        if (!version) {
            await this.clearOldFile();
        }
        await this.uploadServer();
        // 版本管理
        if (version) {
            // 需要版本管理的使用软链接
            await this.softLink(this.targetDir, webDir);
            await this.delRedundantVersion();
        }
        await this.uploadDone();
    }
    /** 上传到服务器 */
    private async uploadServer() {
        const { distPath, plugins } = this.deployConfig;
        const spinner = spinnerLog(this.getText('文件上传中...')).start();
        try {
            await this.ssh.putDirectory(distPath, this.targetDir, {
                recursive: true,
                concurrency: 10,
                validate: (itemPath) => {
                    // 强制禁止 node_modules这些文件上传
                    const baseName = basename(itemPath);
                    const prohibitFiles = ['node_modules'];
                    if (prohibitFiles.includes(baseName)) {
                        return false;
                    }
                    if (typeof plugins?.uploadValidate === 'function') {
                        return plugins.uploadValidate(itemPath);
                    }
                    return true;
                },
                tick: (localPath, remotePath, error) => {
                    if (error) {
                        const { failed } = this.fileFailed;
                        this.fileFailed = {
                            ...this.fileFailed,
                            failed: [...failed, { localPath, remotePath }]
                        };
                    }
                }
            });
            await this.uploadServerAgain(spinner);
            spinner.succeed(this.getText('文件上传成功'));
        } catch (error) {
            spinner.fail(this.getText('文件上传服务器异常'));
            return Promise.reject(error);
        }
    }
    /** 上传失败重试 */
    private async uploadServerAgain(spinner: any) {
        const { failed, retryCount } = this.fileFailed;
        // 存在上传失败的文件
        if (failed.length > 0) {
            // 重试多次后还是失败的
            if (retryCount <= 0) {
                spinner.fail(this.getText('文件上传到服务器失败'));
                return;
            }
            this.fileFailed = {
                ...this.fileFailed,
                retryCount: retryCount - 1
            };
            const failedPromise = failed.map((file) => {
                const { localPath, remotePath } = file;
                return new Promise(async (resolve) => {
                    try {
                        await this.ssh.putFile(localPath, remotePath);
                        resolve(localPath);
                    } catch (err) {
                        const { failed } = this.fileFailed;
                        this.fileFailed = {
                            ...this.fileFailed,
                            failed: [...failed, { localPath, remotePath }]
                        };
                        resolve(localPath);
                    }
                });
            });
            // 置空失败队列
            this.fileFailed = {
                ...this.fileFailed,
                failed: []
            };
            await Promise.all(failedPromise);
            // 重新上传后还有失败的
            if (this.fileFailed.failed.length > 0) {
                await this.uploadServerAgain(spinner);
            }
        }
    }
    /** 删除多余的版本 */
    private delRedundantVersion = async () => {
        const { serverConfig } = this.deployConfig;
        const { webVersion } = serverConfig;
        const { maxLimit, sourceDir } = webVersion;

        const data = await this.runCommand({ command: 'ls', cwd: sourceDir });
        const list = data.split('\n');

        if (list.length > maxLimit) {
            const listDay = list.map((item) => {
                const day = parseVersion(item);
                return dayjs(day);
            });
            const minVersion = getVersion(dayjs(dayjs.min(listDay)));

            // 删除旧版本
            await this.runCommand({ command: `rm -rf ${sourceDir}/${minVersion}`, cwd: sourceDir });
        }
    };
    // 清空线上目标目录的旧文件
    async clearOldFile() {
        let status = true;
        try {
            await this.runCommand({ command: `find ${this.targetDir}`, cwd: '/' });
        } catch (err) {
            // 报错说明当前服务器上没有这个目录不需要处理
            status = false;
        }
        if (status) {
            // 删除旧版本
            await this.runCommand({ command: `rm -rf ${this.targetDir}`, cwd: '/' });
        }
    }
    /** 上传完成 */
    private async uploadDone() {
        const { plugins } = this.deployConfig;
        // 上传完成后允许用户自定义一些操作
        if (typeof plugins?.useUploadDone === 'function') {
            await plugins.useUploadDone(this.runCommand.bind(this));
        }
        // 断开连接
        this.dispose();
        spinnerLog().succeed(this.getText('部署完成'));
    }
}

/** 多个服务器部署 */
export async function deployMultiple(config: DeployConfig) {
    const { serverConfig } = config;
    const version = getVersion();
    const promiseList = serverConfig.map((item) => {
        return new Promise((resolve, reject) => {
            const { webVersion } = item;
            const deploy = new Deploy({
                ...config,
                serverConfig: item,
                version: webVersion ? version : undefined
            });
            deploy
                .run()
                .then(() => {
                    resolve(true);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
    await Promise.all(promiseList);
    spinnerLog().succeed(`当前版本号: ${version}`);
}
