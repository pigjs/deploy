import rimraf from 'rimraf';
import { projectBuild } from './build';
import { deployMultiple } from './deploy';

import type { DeployConfig } from '../../types';

export default async function (config: DeployConfig) {
    const { script, delDistFile, distPath } = config;
    await projectBuild(script);
    await deployMultiple(config);
    if (delDistFile) {
        rimraf.sync(distPath);
    }
}
