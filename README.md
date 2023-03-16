## @pigjs/deploy

@pigjs/deploy 是一个非常轻量级前端部署工具

-   支持前端项目快速部署
-   支持多台服务器部署
-   支持版本管理
-   采用软链接的形式，可以实现无感发布和秒级回滚

## 安装

```js
npm i @pigjs/deploy -g
// 也可以安装到项目中
npm i @pigjs/deploy -save
```

## 使用

```ts
// 服务器配置
interface ServerConfig {
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
    };
}

// .deployrc.js 配置文件
interface DeployConfig {
    /** 服务器配置 */
    serverConfig: ServerConfig[];
    /** 打包命令 */
    script: string;
    /** 本地打包文件目录 */
    distPath: string;
    /** 运行目录 */
    cwd?: string;
    /** 用户自定义配置文件地址 */
    customPath?: string;
    /** 部署完成之后，是否删除打包文件 */
    delDistFile?: boolean;
    plugins?: {
        /** 上传过程中 过滤某些文件 */
        uploadValidate?: (itemPath: string) => boolean;
        /** 上传完成后允许用户自定义一些操作 */
        useUploadDone?: (command) => Promise<void> | void;
    };
}

const commands = ['revert', 'deploy'] as const;

// 自定义命令调用
interface Commands extends DeployConfig {
    /** 命令 */
    command: typeof commands[number];
    /** 是否需要读取配置文件 */
    readConfigFile?: boolean;
}
```

```json
// package.json
{
    "script": {
        "deploy": "pig-deploy deploy --config ./config/deploy",
        "deploy:revert": "pig-deploy revert --config ./config/deploy"
    }
}
```

你也可以在项目根目录下创建 .deployrc.js 文件 或者在 package.json 中 --config 指定配置文件

### 自定义调用

如果你不是在终端中直接调用 deploy 的，想集成到插件中的，你可以使用自定义调用

```ts
import deploy,{Commands} from '@pigjs/deploy'

const commands:Commands {
    // 配置信息
}

deploy(commands)

```

### 版本回滚

```shell
pig-deploy revert --config=配置文件地址
```

### 部署

```shell
pig-deploy deploy --config=配置文件地址
```
