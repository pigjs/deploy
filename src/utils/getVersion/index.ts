import dayjs from 'dayjs';

import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);

/** 获取版本号 */
export function getVersion(version?: any) {
    if (version) {
        return dayjs(version).format('YYYY-MM-DD_HH:mm:ss');
    }
    return dayjs().format('YYYY-MM-DD_HH:mm:ss');
}

/** 根据版本号解析时间 */
export function parseVersion(version: string) {
    return version.replace('_', ' ');
}
