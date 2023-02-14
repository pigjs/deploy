import { validate } from 'schema-utils';
import type { UserConfig } from '../../types';

const schema = {
    type: 'object',
    properties: {
        host: {
            type: 'string'
        },
        port: {
            anyOf: [
                {
                    type: 'string'
                },
                {
                    type: 'number'
                }
            ]
        },
        username: {
            type: 'string'
        },
        password: {
            type: 'string'
        },
        privateKey: {
            type: 'string'
        },
        passphrase: {
            type: 'string'
        },
        distPath: {
            type: 'string'
        },
        webDir: {
            type: 'string'
        },
        script: {
            type: 'string'
        },
        delDistFile: {
            type: 'boolean'
        },
        config: {
            type: 'string'
        }
    },
    additionalProperties: false
};

/** 校验配置参数 */
export function validateConfig(config: UserConfig) {
    // @ts-ignore
    validate(schema, config, { name: 'hera-deploy' });
}
