import inquirer from 'inquirer';

const { prompt } = inquirer;

export async function selectVersion(versions: string[]) {
    const choices = versions.map((item) => {
        return {
            value: item,
            name: item
        };
    });
    const config = {
        name: 'version',
        message: '请选择你需要回滚的版本',
        require: true,
        type: 'list',
        choices
    };
    const { version } = await prompt(config);
    return version as string;
}
