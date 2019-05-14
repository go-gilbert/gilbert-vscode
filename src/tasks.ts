import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import { inspectTasks } from './utils';
import { TreeDataProvider, Command, ContextProperty } from './vskit';

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

  @Command('refreshEntry')
  refresh(): void {
    vscode.window.showInformationMessage('Refresh test');
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    vscode.window.showInformationMessage('Loaded');
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
    // const data: ManifestData = {
    //   location: f,
    //   root: dir,
    //   fullPath: path.join(dir, f),
    // };

    console.debug(`gilbert: found '${data.fullPath}'`);
    return new TreeItem(TreeItemType.Group, data, data.baseName);
  });
}

enum TreeItemType {
  Task = "task",
  Group = "group"
}

class ManifestData {
  fullPath: string;

  constructor(public root: string, public location: string) {
    this.fullPath = path.join(root, location);
  }
  
  get baseName(): string {
    return path.basename(path.dirname(this.fullPath));
  }
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly type: TreeItemType,
    public readonly manifest: ManifestData,
    public readonly label: string,
    public readonly command?: vscode.Command
  ) {
    super(label, TreeItemType.Group ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
  }

  get isGroup() {
    return this.type === TreeItemType.Group;
  }

  get description(): string | boolean {
    return this.isGroup ? this.manifest.location : false;
  }

  get dir() {
    return path.dirname(this.manifest.fullPath);
  }

  get tooltip() {
    if (this.isGroup) {
      return this.manifest.fullPath;
    }
  }

  get iconPath() {
    const imgName = this.isGroup ? 'group' : 'cogs';

    return {
      light: path.join(__filename, '..', '..', 'resources', 'light', `${imgName}.svg`),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', `${imgName}.svg`)
    };
  }

  get contextValue() {
    return this.isGroup ? 'folder' : 'task';
  }

  get tasks(): Promise<TreeItem[]> {
    if (this.isGroup) {
      return Promise.resolve([]);
    }

    return (async () => {
      return [];
    })();
  }

  createChild(taskName: string): TreeItem {
    return new TreeItem(TreeItemType.Task, this.manifest, taskName);
  }
}

// export class Task extends TreeItem {

//   constructor(
//     public readonly label: string,
//     public readonly collapsibleState: vscode.TreeItemCollapsibleState,
//     public readonly command?: vscode.Command
//   ) {
//     super(TreeItemType, Group, label, collapsibleState);
//   }

//   get tooltip(): string {
//     return `${this.label}`;
//   }

//   get description(): string {
//     return this.label;
//   }

//   iconPath = {
//     light: path.join(__filename, '..', '..', 'resources', 'light', 'cogs.svg'),
//     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'cogs.svg')
//   };

//   contextValue = 'task';

// }