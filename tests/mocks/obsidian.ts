// Mock for obsidian module
export class TFile {
	constructor(public path: string) {}
	get basename() {
		return this.path.replace(/\.md$/, '').split('/').pop() || this.path;
	}
	get extension() {
		return 'md';
	}
}

export class TFolder {
	constructor(public path: string) {}
}

export class Plugin {
	app: any;
	constructor() {
		this.app = {};
	}
}

export class PluginSettingTab {
	constructor(public app: any, public plugin: any) {}
}

export class Setting {
	constructor(containerEl: HTMLElement) {}
}

export function getLanguage(): string {
	return 'ja';
}
