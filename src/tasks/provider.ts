// https://code.visualstudio.com/api/extension-guides/task-provider
// https://github.com/microsoft/vscode-extension-samples/tree/master/task-provider-sample

import * as vscode from 'vscode';
import { ManifestData } from './treeItem';

export class Runner {
  async run(name: string, man: ManifestData) {

    const kind = {
      type: 'gilbert1',
      task: name,
    };

    // vscode.window.withProgress()
    const cmd = `gilbert run ${name}`;
    const task = new vscode.Task(kind, man.workspace, name, 'gilbert', new vscode.ShellExecution(cmd, {cwd: man.directory}));
    try {
      await vscode.tasks.executeTask(task);
    } catch (ex) {
      console.error('run failed: ' + ex.message);
    }
  }
}
