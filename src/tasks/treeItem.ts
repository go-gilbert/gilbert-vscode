import * as vscode from 'vscode';
import * as path from 'path';

export enum TreeItemType {
  Task = "task",
  Group = "group"
}

export class ManifestData {
  fullPath: string;

  constructor(public root: string, public location: string, public workspace: vscode.WorkspaceFolder) {
    this.fullPath = path.join(root, location);
  }

  get directory() {
    return path.dirname(this.fullPath);
  }

  get baseName(): string {
    return path.basename(path.dirname(this.fullPath));
  }

  get url() {
    return vscode.Uri.parse(`file://${this.fullPath}`);
  }
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly type: TreeItemType,
    public readonly manifest: ManifestData,
    public readonly label: string
  ) {
    super(label, type === TreeItemType.Group ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
  }

  get contextValue() {
    return this.type;
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

  get command() {
    if (this.isGroup) {
      return;
    }

    return {
      title: this.label,
      command: 'gilbertTasks.runTask',
      arguments: [
        this.label,
        this.manifest
      ],
    };
  }

  get iconPath() {
    const imgName = this.isGroup ? 'group' : 'cogs';

    return {
      light: path.join(__filename, '..', '..', '..', 'resources', 'light', `${imgName}.svg`),
      dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', `${imgName}.svg`)
    };
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
