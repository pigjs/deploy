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
        choices: [...choices, { name: '取消回滚', value: 'cancel' }]
    };
    const { version } = await prompt(config);
    const confirmConfig = {
        name: 'confirm',
        message: version !== 'cancel' ? `确定回滚到 ${version} 这个版本吗？` : '确定取消回滚吗？',
        require: true,
        type: 'list',
        choices: [
            { name: '确定', value: 'yes' },
            { name: '返回', value: 'back' }
        ]
    };
    const { confirm } = await prompt(confirmConfig);
    if (confirm === 'back') {
        return await selectVersion(versions);
    }
    return version as string;
}
