import { projectBuild } from './build';
import { deployMultiple } from './deploy';

import type { DeployConfig } from '../../types';

export default async function (config: DeployConfig) {
    const { script } = config;
    await projectBuild(script);
    await deployMultiple(config);
}
