// Mock implementation of Obsidian API for testing

export class Plugin {
	app: App;
	manifest: PluginManifest;

	constructor(app: App, manifest: PluginManifest) {
		this.app = app;
		this.manifest = manifest;
	}

	onload(): void | Promise<void> {
		// Override in tests
	}

	onunload(): void {
		// Override in tests
	}

	addCommand(command: Command): Command {
		return command;
	}

	addRibbonIcon(icon: string, title: string, callback: () => void): HTMLElement {
		const element = document.createElement('div');
		element.onclick = callback;
		return element;
	}

	addSettingTab(settingTab: PluginSettingTab): void {
		// Mock implementation
	}
}

export class TFile {
	name: string;
	path: string;
	basename: string;
	extension: string;
	stat: { ctime: number; mtime: number; size: number };

	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() || '';
		this.basename = this.name.split('.')[0] || '';
		this.extension = this.name.split('.').pop() || '';
		this.stat = {
			ctime: Date.now(),
			mtime: Date.now(),
			size: 0
		};
	}
}

export class TFolder {
	name: string;
	path: string;
	children: (TFile | TFolder)[];

	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() || '';
		this.children = [];
	}
}

export class Vault {
	adapter: any;

	async create(path: string, data: string): Promise<TFile> {
		return new TFile(path);
	}

	async createFolder(path: string): Promise<TFolder> {
		return new TFolder(path);
	}

	async exists(path: string): Promise<boolean> {
		return false;
	}

	async read(file: TFile): Promise<string> {
		return '';
	}

	async modify(file: TFile, data: string): Promise<void> {
		// Mock implementation
	}

	getAbstractFileByPath(path: string): TFile | TFolder | null {
		return null;
	}

	getFolderByPath(path: string): TFolder | null {
		return null;
	}

	getFiles(): TFile[] {
		return [];
	}

	getAllLoadedFiles(): (TFile | TFolder)[] {
		return [];
	}
}

export class App {
	vault: Vault;
	workspace: Workspace;

	constructor() {
		this.vault = new Vault();
		this.workspace = new Workspace();
	}
}

export class Workspace {
	getActiveFile(): TFile | null {
		return null;
	}

	getActiveViewOfType<T>(type: any): T | null {
		return null;
	}
}

export class FuzzySuggestModal<T> {
	app: App;
	inputEl: HTMLInputElement;
	
	constructor(app: App) {
		this.app = app;
		this.inputEl = document.createElement('input');
	}

	open(): void {
		// Mock implementation
	}

	close(): void {
		// Mock implementation
	}

	getItems(): T[] {
		return [];
	}

	getItemText(item: T): string {
		return String(item);
	}

	onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void {
		// Override in implementation
	}
}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: HTMLElement;

	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = document.createElement('div');
	}

	display(): void {
		// Override in implementation
	}

	hide(): void {
		// Override in implementation  
	}
}

export interface PluginManifest {
	id: string;
	name: string;
	version: string;
	minAppVersion: string;
	description: string;
	author: string;
	authorUrl?: string;
	isDesktopOnly?: boolean;
}

export interface Command {
	id: string;
	name: string;
	callback?: () => void;
	checkCallback?: (checking: boolean) => boolean | void;
	hotkeys?: Hotkey[];
}

export interface Hotkey {
	modifiers: Modifier[];
	key: string;
}

export type Modifier = 'Mod' | 'Ctrl' | 'Meta' | 'Shift' | 'Alt';