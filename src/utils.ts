import * as util from 'util';
const exec = util.promisify(require('child_process').exec);

const LS_PREFIX = '- ';

export async function inspectTasks(dir: string): Promise<string[]> {
    let result: { stdout?: string, stdin?: string } = {};
    try {
        result = await exec('gilbert ls', {
            cwd: dir,
        });

        if (!result.stdout) {
            return [];
        }

        return formatTasksList(result.stdout);
    } catch (err) {
        throw new Error(result.stdout || err.message);
    }
}

function formatTasksList(out: string): string[] {
    // TODO: refactor
    return out.split('\n')
        .map(s => s.trim())
        .filter(s => s.startsWith(LS_PREFIX))
        .map(s => s.replace(LS_PREFIX, ''));
}