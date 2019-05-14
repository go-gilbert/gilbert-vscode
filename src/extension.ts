// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { GilbertTasksProvider } from './tasks';
import { register } from './vskit';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  if (!vscode.workspace.workspaceFolders) {
    console.log('gilbert: no workspace folders found');
    return;
  }

  const tasksListProvider = new GilbertTasksProvider(vscode.workspace.workspaceFolders);
  register(context, tasksListProvider);
  tasksListProvider.showPanel = true;
}

// this method is called when your extension is deactivated
export function deactivate() { }
