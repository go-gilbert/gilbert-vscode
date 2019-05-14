// https://code.visualstudio.com/api/extension-guides/task-provider
// https://github.com/microsoft/vscode-extension-samples/tree/master/task-provider-sample

import * as vscode from 'vscode';

export class Task {
  constructor(public name: string, public dir: string) {}

  get hash() {
    return this.dir + ':' + this.name;
  }

  get command() {
    return `gilbert run ${this.name}`;
  }
}

export class Runner {
  state = new Map<string, boolean>();

  isRunning(task: Task): boolean {
    return this.state.has(task.hash);
  }

  async run(task: Task) {
    if (this.isRunning(task)) {
      vscode.window.showInformationMessage(`Task '${task.name}' is already running`);
    }

    const kind = {
      type: 'gilbert',
      task: task.name,
    };

    // vscode.window.withProgress()
    const x = new vscode.Task(kind, task.name, 'gilbert', new vscode.ShellExecution(task.command, {cwd: task.dir}));
    try {
      await vscode.tasks.executeTask(x);
    } catch (ex) {
      console.error('run failed: ' + ex.message);
    } finally {
      this.state.delete(task.hash);
    }
  }
}
