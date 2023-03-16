import { validate } from 'schema-utils';
import type { UserConfig } from '../../types';

const serverConfig = {
    type: 'object',
    properties: {
        host: {
            type: 'string',
            description: '服务器地址'
        },
        port: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ],
            description: '端口'
        },
        username: {
            type: 'string',
            description: '服务器用户名'
        },
        password: {
            type: 'string',
            description: '服务器密钥'
        },
        privateKey: {
            type: 'string',
            description: '服务器密钥地址'
        },
        passphrase: {
            type: 'string',
            description: '密钥密码'
        },
        webDir: {
            type: 'string',
            description: '服务器上部署的地址'
        },
        webVersion: {
            type: 'object',
            properties: {
                sourceDir: {
                    type: 'string',
                    description: '版本存放地址'
                },
                maxLimit: {
                    type: 'number',
                    description: '最大存放几个版本'
                }
            },
            description: '项目版本管理'
        }
    },
    required: ['host', 'username', 'webDir'],
    additionalProperties: false
};

const schema = {
    type: 'object',
    properties: {
        serverConfig: {
            anyOf: [
                {
                    type: 'array',
                    items: serverConfig
                },
                serverConfig
            ],
            description: '服务器配置'
        },
        distPath: {
            type: 'string',
            description: '本地打包文件目录'
        },
        script: {
            type: 'string',
            description: '打包命令'
        },
        delDistFile: {
            type: 'boolean',
            description: '部署完成之后，是否删除打包文件'
        },
        plugins: {
            type: 'object'
        }
    },
    required: ['serverConfig', 'distPath', 'script'],
    additionalProperties: false
};

/** 校验配置参数 */
export function validateConfig(config: UserConfig) {
    // @ts-ignore
    validate(schema, config, { name: '@pigjs/deploy' });
}
