import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import { JenkinsConnection } from './jenkinsConnection';
import { filepath } from './utils';

export class ConnectionsTree {
    private readonly _treeView: vscode.TreeView<ConnectionsTreeItem>;
    private readonly _treeViewDataProvider: ConnectionsTreeProvider;

    public constructor() {
        this._treeViewDataProvider = new ConnectionsTreeProvider();
        this._treeView = vscode.window.createTreeView('connectionsTree', { treeDataProvider: this._treeViewDataProvider, canSelectMany: false });
        this._treeView.onDidChangeVisibility((e: vscode.TreeViewVisibilityChangeEvent) => {
            if (e.visible) { this.refresh(); }
        });

        ext.context.subscriptions.push(vscode.commands.registerCommand('extension.jenkins-jack.tree.connections.settings', async () => {
            await vscode.commands.executeCommand('workbench.action.openSettingsJson');
        }));

        ext.context.subscriptions.push(vscode.commands.registerCommand('extension.jenkins-jack.tree.connections.refresh', () => {
            this.refresh();
            ext.pipelineTree.refresh();
            ext.jobTree.refresh();
            ext.nodeTree.refresh();
            ext.queueTree.refresh();
        }));
    }

    public refresh() {
        this._treeView.title = `Jenkins Connections (${ext.connectionsManager.host.connection.name})`;
        this._treeViewDataProvider.refresh();
    }
}

export class ConnectionsTreeProvider implements vscode.TreeDataProvider<ConnectionsTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<ConnectionsTreeItem | undefined> = new vscode.EventEmitter<ConnectionsTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<ConnectionsTreeItem | undefined> = this._onDidChangeTreeData.event;

	public constructor() {
        this.updateSettings();
    }

    private updateSettings() {
    }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: ConnectionsTreeItem): ConnectionsTreeItem {
		return element;
	}

	getChildren(element?: ConnectionsTreeItem): Thenable<ConnectionsTreeItem[]> {
        return new Promise(async resolve => {
            let config = vscode.workspace.getConfiguration('jenkins-jack.jenkins');
            let list =  [];
            for (let c of config.connections) {
                list.push(new ConnectionsTreeItem(c.name, JenkinsConnection.fromJSON(c)));
            }
            resolve(list);
        });
    }
}

export class ConnectionsTreeItem extends vscode.TreeItem {
	constructor(
        public readonly label: string,
        public readonly connection: JenkinsConnection
	) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.contextValue = connection.active ? 'connectionsTreeItemActive' : 'connectionsTreeItemInactive';

        let iconPrefix = connection.active ? 'active' : 'inactive';
        this.iconPath = {
            light: filepath('images', `${iconPrefix}-light.svg`),
            dark: filepath('images', `${iconPrefix}-dark.svg`),
        };
    }

    // @ts-ignore
	get tooltip(): string {
        return '';
	}

    // @ts-ignore
	get description(): string {
        let description = this.connection.uri;
        description += null != this.connection.folderFilter && '' != this.connection.folderFilter ?
            ` (${this.connection.folderFilter})` :
            '';
        description += ` (${this.connection.username})`;
		return description;
    }
}
