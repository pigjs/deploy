import { existsSync } from 'fs';
import { join } from 'path';

type Options = {
    cwd: string;
    files: string[];
    returnRelative?: boolean;
};

/** 获取files中存在的文件  */
export function getExistFile({ cwd, files, returnRelative }: Options) {
    for (const file of files) {
        const absFilePath = join(cwd, file);
        if (existsSync(absFilePath)) {
            return returnRelative ? file : absFilePath;
        }
    }
}
