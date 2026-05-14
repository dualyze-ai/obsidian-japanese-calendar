import { Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { CalendarView, VIEW_TYPE } from './CalendarView';
import { DailyNoteManager } from './DailyNoteManager';
import { HolidayManager } from './HolidayManager';
import { JapaneseCalendarSettingTab } from './SettingTab';

export interface PluginSettings {
	dailyNoteFolder: string;
	dailyNoteFormat: string;
	templatePath: string;
	showWareki: boolean;
	showHolidayName: boolean;
	showRokuyo: boolean;
	weekStart: 0 | 1;
	enableAutoInsert: boolean;
	insertFormat: string;
	showStatusBar: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
	dailyNoteFolder: 'Daily Notes',
	dailyNoteFormat: 'YYYY-MM-DD',
	templatePath: '',
	showWareki: true,
	showHolidayName: true,
	showRokuyo: false,
	weekStart: 0,
	enableAutoInsert: true,
	insertFormat: '> [!note] 祝日\n> {name}',
	showStatusBar: true,
};

export default class JapaneseCalendarPlugin extends Plugin {
	settings: PluginSettings;
	private statusBarItem: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE, leaf => new CalendarView(leaf, this));

		this.addRibbonIcon('calendar', 'Japanese Calendar', () => this.openCalendar());

		this.addCommand({
			id: 'open-calendar',
			name: 'カレンダーを開く',
			callback: () => this.openCalendar(),
		});

		this.addCommand({
			id: 'open-today-note',
			name: '今日のデイリーノートを開く',
			callback: () => {
				const mgr = new DailyNoteManager(this.app, this.settings);
				mgr.openOrCreate(new Date());
			},
		});

		if (this.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			this.updateStatusBar();
		}

		this.registerEvent(
			this.app.workspace.on('file-open', file => {
				if (file) this.onFileOpen(file);
			})
		);

		this.addSettingTab(new JapaneseCalendarSettingTab(this.app, this));
	}

	async onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE);
	}

	async openCalendar() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
		const existing = leaves[0];
		if (existing) {
			this.app.workspace.revealLeaf(existing);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private async onFileOpen(file: TFile) {
		if (!this.settings.enableAutoInsert) return;

		const mgr = new DailyNoteManager(this.app, this.settings);
		const holidays = new HolidayManager();

		// ファイル名がdailyNoteFormatにマッチするか確認
		const expected = mgr.filePath(new Date(window.moment().format('YYYY-MM-DD')));
		const nameNoExt = file.basename;
		const parsed = window.moment(nameNoExt, this.settings.dailyNoteFormat, true);
		if (!parsed.isValid()) return;

		const holidayName = holidays.getHolidayName(parsed.toDate());
		if (!holidayName) return;

		await mgr.tryInsertHoliday(file, holidayName);
	}

	private async updateStatusBar() {
		if (!this.statusBarItem) return;
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth();
		const holidays = new HolidayManager();

		// 今月の祝日数を数える
		let count = 0;
		const days = new Date(year, month + 1, 0).getDate();
		for (let d = 1; d <= days; d++) {
			if (holidays.getHolidayName(new Date(year, month, d))) count++;
		}
		this.statusBarItem.setText(`祝日 ${count}日/月`);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 設定変更時にカレンダーを再描画
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			(leaf.view as CalendarView).refresh();
		}
	}
}
