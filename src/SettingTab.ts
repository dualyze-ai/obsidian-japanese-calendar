import { App, PluginSettingTab, Setting } from 'obsidian';
import type JapaneseCalendarPlugin from './main';

export class JapaneseCalendarSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: JapaneseCalendarPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('デイリーノートの保存フォルダ')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('例：Daily Notes')
			.addText(t => t
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				.setPlaceholder('Daily Notes')
				.setValue(this.plugin.settings.dailyNoteFolder)
				.onChange(async v => {
					this.plugin.settings.dailyNoteFolder = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('ファイル名フォーマット')
			// eslint-disable-next-line obsidianmd/ui/sentence-case
			.setDesc('moment.js フォーマット。例：YYYY-MM-DD')
			.addText(t => t
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.dailyNoteFormat)
				.onChange(async v => {
					this.plugin.settings.dailyNoteFormat = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('テンプレートファイルのパス')
			.setDesc('空欄の場合はデフォルトテンプレートを使用')
			.addText(t => t
				.setPlaceholder('Templates/daily.md')
				.setValue(this.plugin.settings.templatePath)
				.onChange(async v => {
					this.plugin.settings.templatePath = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName('表示設定').setHeading();

		new Setting(containerEl)
			.setName('和暦を表示する')
			.setDesc('ヘッダーに「令和〇年」を表示します')
			.addToggle(t => t
				.setValue(this.plugin.settings.showWareki)
				.onChange(async v => {
					this.plugin.settings.showWareki = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('祝日名を表示する')
			.setDesc('祝日のセルに祝日名を表示します')
			.addToggle(t => t
				.setValue(this.plugin.settings.showHolidayName)
				.onChange(async v => {
					this.plugin.settings.showHolidayName = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('六曜を表示する')
			.setDesc('大安・仏滅などを各セルに表示します')
			.addToggle(t => t
				.setValue(this.plugin.settings.showRokuyo)
				.onChange(async v => {
					this.plugin.settings.showRokuyo = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('週の開始曜日')
			.addDropdown(d => d
				.addOption('0', '日曜日')
				.addOption('1', '月曜日')
				.setValue(String(this.plugin.settings.weekStart))
				.onChange(async v => {
					this.plugin.settings.weekStart = parseInt(v) as 0 | 1;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl).setName('デイリーノート連携').setHeading();

		new Setting(containerEl)
			.setName('祝日を自動挿入する')
			.setDesc('祝日のデイリーノートを開いたときに祝日名を挿入します')
			.addToggle(t => t
				.setValue(this.plugin.settings.enableAutoInsert)
				.onChange(async v => {
					this.plugin.settings.enableAutoInsert = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('挿入テキストのフォーマット')
			.setDesc('{name} が祝日名に置換されます')
			.addText(t => t
				.setPlaceholder('> [!note] 祝日\n> {name}')
				.setValue(this.plugin.settings.insertFormat)
				.onChange(async v => {
					this.plugin.settings.insertFormat = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('ステータスバーに祝日数を表示する')
			.addToggle(t => t
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async v => {
					this.plugin.settings.showStatusBar = v;
					await this.plugin.saveSettings();
				}));
	}
}
