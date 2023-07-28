import { NodeSSH } from 'node-ssh';
import { basename } from 'path';
import { log, spinnerLog } from '../logs';

import type { Config, NodeSSH as NodeSSHType } from 'node-ssh/lib/typings';

export class SshServer {
    public ssh: NodeSSHType = new NodeSSH();

    /** 连接服务器 */
    public async connectSSH(config: Config, getText?: (text: string) => string) {
        const logText = getText ? getText : (text) => text;
        const spinner = spinnerLog(logText('正在连接服务器...')).start();

        try {
            await this.ssh.connect(config);
            spinner.succeed(logText('服务器连接成功'));
        } catch (error) {
            spinner.fail(logText('服务器连接失败'));
            throw new Error('服务器连接失败');
        }
    }

    /** command 命令操作 */
    public async runCommand({ command, cwd, logger }: { command: string; cwd: string; logger?: boolean }) {
        return await this.ssh.execCommand(command, {
            cwd,
            onStdout: (chunk: Buffer) => {
                if (logger) {
                    log(chunk.toString('utf-8'));
                }
            },
            onStderr(chunk: Buffer) {
                const errText = chunk.toString('utf8');
                if (logger) {
                    log(errText);
                }
                throw new Error(errText);
            }
        });
    }

    /** 软链接 */
    async softLink(targetFile: string, sourceFile: string) {
        await this.runCommand({ command: `ln -snf ${targetFile} ${sourceFile}`, cwd: targetFile });
        const data = await this.runCommand({ command: 'ls', cwd: sourceFile });
        const name = basename(targetFile);
        // 软链接没有生效
        if (data.stdout.indexOf(name) !== -1) {
            // 删除项目
            await this.runCommand({ command: `rm -rf ${sourceFile}`, cwd: targetFile });
            // 重新挂载
            await this.runCommand({ command: `ln -snf ${targetFile} ${sourceFile}`, cwd: targetFile });
        }
    }

    /** 断开连接 */
    public dispose() {
        this.ssh.dispose();
        this.ssh = null;
    }
}
