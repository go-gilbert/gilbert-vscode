import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class GilbertTasksProvider implements vscode.TreeDataProvider<Task> {
  private _onDidChangeTreeData: vscode.EventEmitter<Task | undefined> = new vscode.EventEmitter<Task | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Task | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Task): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Task): Thenable<Task[]> {
    vscode.window.showInformationMessage('Loaded');
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      // return Promise.resolve([]);
    }

    const values = [new Task('build', 0), new Task('cover', 0)];
    return Promise.resolve(values);
    // if (element) {
    // 	return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
    // } else {
    // 	const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    // 	if (this.pathExists(packageJsonPath)) {
    // 		return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
    // 	} else {
    // 		vscode.window.showInformationMessage('Workspace has no package.json');
    // 		return Promise.resolve([]);
    // 	}
    // }

  }
}


export class Task extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}`;
  }

  get description(): string {
    return this.label;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'cogs.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'cogs.svg')
  };

  contextValue = 'task';

}