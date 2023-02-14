import dayjs from 'dayjs';
import { basename } from 'path';
import type { DeployConfig, ServerConfig } from '../../types';
import { getVersion } from '../../utils/getVersion';
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
        const { sourceDir } = webVersion;
        this.targetDir = version ? `${sourceDir}/${version}` : webDir;
    }
    public async run() {
        const { serverConfig, version } = this.deployConfig;
        const { webVersion, webDir, ...config } = serverConfig;
        await this.connectSSH(config);
        await this.uploadServer();
        // 需要版本管理的使用软链接
        if (version) {
            await this.softLink(this.targetDir, webDir);
        }
        await this.delRedundantVersion();
        await this.uploadDone();
    }
    /** 上传到服务器 */
    private async uploadServer() {
        const { distPath, useUploadValidate } = this.deployConfig;
        const spinner = spinnerLog('文件上传中...').start();
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
                    if (typeof useUploadValidate === 'function') {
                        return useUploadValidate(itemPath);
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
            spinner.succeed('文件上传成功');
        } catch (error) {
            spinner.fail('文件上传服务器异常');
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
                spinner.fail('文件上传到服务器失败');
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
                const day = item.replace('_', ' ');
                return dayjs(day);
            });
            const minVersion = dayjs(dayjs.min(listDay)).format('YYYY-MM-DD_HH:mm:ss');

            // 删除旧版本
            await this.runCommand({ command: `rm -rf ${sourceDir}/${minVersion}` });
        }
    };
    /** 上传完成 */
    private async uploadDone() {
        const { useUploadDone } = this.deployConfig;
        // 上传完成后允许用户自定义一些操作
        if (useUploadDone) {
            await useUploadDone(this.runCommand.bind(this));
        }
        // 断开连接
        this.dispose();
        spinnerLog('部署完成').succeed();
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
}
