import { Plugin, TFile, TFolder } from 'obsidian';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/ja';
import { CalendarView, VIEW_TYPE, CalendarDisplayMode } from './CalendarView';
import { DailyNoteManager } from './DailyNoteManager';
import { HolidayManager } from './HolidayManager';
import { JapaneseCalendarSettingTab } from './SettingTab';
import { detectLocale, getStr } from './utils';
import { NoteLinkManager } from './NoteLinkManager';

dayjs.extend(customParseFormat);

export interface PluginSettings {
	dailyNoteFolder: string;
	dailyNoteFormat: string;
	templatePath: string;
	showWareki: boolean;
	showHolidayName: boolean;
	showRokuyo: boolean;
	showKichijitsu: boolean;
	showTenshanichi: boolean;
	showIchiryuManbai: boolean;
	showFujoju: boolean;
	showTooltip: boolean;
	weekStart: 0 | 1;
	enableAutoInsert: boolean;
	insertFormat: string;
	showStatusBar: boolean;
	calendarTheme: 'light' | 'dark';
	displayMode: CalendarDisplayMode;
	noteLinks: Record<string, string[]>;
}

const DEFAULT_SETTINGS: PluginSettings = {
	dailyNoteFolder: 'Daily Notes',
	dailyNoteFormat: 'YYYY-MM-DD',
	templatePath: '',
	showWareki: true,
	showHolidayName: true,
	showRokuyo: false,
	showKichijitsu: true,
	showTenshanichi: true,
	showIchiryuManbai: true,
	showFujoju: true,
	showTooltip: true,
	weekStart: 0,
	enableAutoInsert: true,
	insertFormat: '> [!note] 祝日\n> {name}',
	showStatusBar: true,
	calendarTheme: 'light',
	displayMode: 'month',
	noteLinks: {},
};

export default class JapaneseCalendarPlugin extends Plugin {
	settings: PluginSettings;
	private statusBarItem: HTMLElement | null = null;
	noteLinkManager: NoteLinkManager;

	async onload() {
		dayjs.locale(detectLocale());

		await this.loadSettings();
		this.noteLinkManager = new NoteLinkManager(this);

		this.registerView(VIEW_TYPE, leaf => new CalendarView(leaf, this));

		this.addRibbonIcon('calendar-days', 'Japanese calendar', () => this.openCalendar());

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
				void mgr.openOrCreate(new Date());
			},
		});

		this.addCommand({
			id: 'show-month-view',
			name: getStr('commandShowMonth'),
			callback: async () => {
				this.settings.displayMode = 'month';
				await this.saveSettings();
				await this.openCalendar();
			},
		});

		this.addCommand({
			id: 'show-two-month-view',
			name: getStr('commandShowTwoMonth'),
			callback: async () => {
				this.settings.displayMode = 'two-month';
				await this.saveSettings();
				await this.openCalendar();
			},
		});

		this.addCommand({
			id: 'show-six-month-view',
			name: getStr('commandShowSixMonth'),
			callback: async () => {
				this.settings.displayMode = 'six-month';
				await this.saveSettings();
				await this.openCalendar();
			},
		});

		this.addCommand({
			id: 'show-year-view',
			name: getStr('commandShowYear'),
			callback: async () => {
				this.settings.displayMode = 'year';
				await this.saveSettings();
				await this.openCalendar();
			},
		});

		this.addCommand({
			id: 'go-to-today',
			name: getStr('today'),
			callback: async () => {
				await this.openCalendar();
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
				for (const leaf of leaves) {
					(leaf.view as CalendarView).goToToday();
				}
			},
		});

		if (this.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			void this.updateStatusBar();
		}

		this.registerEvent(
			this.app.workspace.on('file-open', file => {
				if (file) void this.onFileOpen(file);
			})
		);

		// ノートrename時のリンクパス更新
		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (file instanceof TFile && file.extension === 'md') {
					void this.noteLinkManager.updatePath(oldPath, file.path);
				} else if (file instanceof TFolder) {
					void this.noteLinkManager.updateFolderPath(oldPath, file.path);
				}
			})
		);

		// ノートdelete時のリンク除去
		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					void this.noteLinkManager.removePath(file.path);
				}
			})
		);

		this.addSettingTab(new JapaneseCalendarSettingTab(this.app, this));
	}

	onunload() {}

	async openCalendar() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
		const existing = leaves[0];
		if (existing) {
			await this.app.workspace.revealLeaf(existing);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false);
		if (!leaf) return;
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		await this.app.workspace.revealLeaf(leaf);
	}

	private async onFileOpen(file: TFile) {
		if (!this.settings.enableAutoInsert) return;

		const mgr = new DailyNoteManager(this.app, this.settings);
		const holidays = new HolidayManager();

		const nameNoExt = file.basename;
		const parsed = dayjs(nameNoExt, this.settings.dailyNoteFormat, true);
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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as PluginSettings;
		// noteLinksの安全な初期化
		if (typeof this.settings.noteLinks !== 'object' || this.settings.noteLinks === null) {
			this.settings.noteLinks = {};
		}
		// displayModeの安全なフォールバック
		if (!['month', 'two-month', 'six-month', 'year'].includes(this.settings.displayMode)) {
			this.settings.displayMode = 'month';
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// 設定変更時にカレンダーを再描画
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			(leaf.view as CalendarView).refresh();
		}
	}
}
