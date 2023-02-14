export interface ServerConfig {
    /** 服务器地址 */
    host: string;
    /** 端口 */
    port: number;
    /** 服务器用户名 */
    username: string;
    /** 服务器密钥 */
    password?: string;
    /** 服务器密钥地址 */
    privateKey?: string;
    /** 密钥密码 */
    passphrase?: string;
    /** 服务器上部署的地址 */
    webDir: string;
    /** 项目版本管理 */
    webVersion?: {
        /** 版本存放地址 */
        sourceDir: string;
        /** 最大存放几个版本 默认 5个 */
        maxLimit?: number;
        /** 自定义设置版本号 */
        customVersion?: () => string;
    };
}

export interface DeployConfig {
    /** 服务器配置 */
    serverConfig: ServerConfig[];
    /** 打包命令 */
    script: string;
    /** 本地打包文件目录 */
    distPath: string;
    /** 上传过程中 过滤某些文件 */
    useUploadValidate?: (itemPath: string) => boolean;
    /** 上传完成后允许用户自定义一些操作 */
    useUploadDone?: (command) => Promise<void> | void;
    /** 运行目录 */
    cwd?: string;
    /** 用户自定义配置文件地址 */
    customPath?: string;
    /** 部署完成之后，是否删除打包文件 */
    delDistFile?: boolean;
}

export type UserConfig = Omit<DeployConfig, 'cwd' | 'config' | 'serverConfig'> & {
    serverConfig: ServerConfig | ServerConfig[];
};
