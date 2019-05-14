import * as vscode from 'vscode';
import * as util from 'util';

import { inspectTasks } from './utils';
import { TreeItem, TreeItemType, ManifestData } from './treeItem';
import { TreeDataProvider, Command, ContextProperty } from '../vskit';

const glob = util.promisify(require('glob'));
const SUPPORTED_SCHEME = 'file';

// see: https://code.visualstudio.com/api/extension-guides/tree-view

@TreeDataProvider('gilbertTasks')
export class GilbertTasksProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  @ContextProperty('hasGilbertManifest') showPanel = false;

  constructor(private dirs: vscode.WorkspaceFolder[]) {
  }

  @Command('refresh')
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  @Command('editManifest')
  edit(element: TreeItem) {
    vscode.commands.executeCommand('vscode.open', element.manifest.url);
  }

  @Command('runTask')
  runTask(name: string, ctx: ManifestData) {
    console.log(`STUB: runTask(${name}, ${ctx.directory})`);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.dirs) {
      vscode.window.showInformationMessage('No manifest in empty workspace');
      this.showPanel = false;
      return [];
    }

    if (!element) {
      const items = await this.manifests;
      if (items.length > 0) {
        // show panel if any results are present
        this.showPanel = true;
      }

      if (items.length === 1) {
        // Expand item if it's orphan
        items[0].collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      }

      return items;
    }

    try {
      vscode.window.setStatusBarMessage(`Loading tasks list from '${element.manifest.fullPath}'...`);
      const tasks = await inspectTasks(element.dir);
      vscode.window.setStatusBarMessage('Done');
      return tasks.map(t => element.createChild(t));
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to get tasks list: ${err.message}`);
      return [];
    }
  }

  get manifests(): Promise<TreeItem[]> {
    return (async() => {
      console.debug(`gilbert: looking for manifests...`);
      vscode.window.setStatusBarMessage('Searching for Gilbert files...');
      const out: TreeItem[] = [];

      const dirs = this.dirs
        .filter(d => d.uri.scheme === SUPPORTED_SCHEME)
        .map(d => d.uri.fsPath);

      for (let dir of dirs) {
        try {
          const foundItems = await findManifests(dir);
          out.push(...foundItems);
          if (foundItems.length > 0) {
            console.debug(`gilbert: item: `, foundItems);
          }
        } catch (ex) {
          console.error(`gilbert: glob error, ${ex.message} (in '${dir}')`);
          vscode.window.showErrorMessage(`Failed to find manifest in '${dir}'`);
        }
      }

      vscode.window.setStatusBarMessage('');
      return out;
    })();
  }
}

async function findManifests(dir: string): Promise<TreeItem[]> {
  console.debug(`gilbert: looking for 'gilbert.yaml' in '${dir}'...`);
  const files = await glob('**/gilbert.yaml', {cwd: dir});
  return files.map((f: string) => {
    const data = new ManifestData(dir, f);
    console.debug(`gilbert: found '${data.fullPath}'`);
    return new TreeItem(TreeItemType.Group, data, data.baseName);
  });
}
