import ora from 'ora';

/** 有交互日志 */
export function spinnerLog(text?: string) {
    return ora(text);
}

/** 日志 */
export function log(text: string) {
    console.log(text);
}

/** 操作耗时 */
export async function timeDirector(next: () => Promise<void>) {
    const startTime = new Date();
    await next();
    const endTime = new Date();
    spinnerLog().succeed(`开始时间：${startTime.toLocaleString()}`);
    spinnerLog().succeed(`结束时间：${endTime.toLocaleString()}`);
    const time = Math.round((endTime.getTime() - startTime.getTime()) / 1e3);
    spinnerLog().succeed(`总耗时：${time}s`);
}
