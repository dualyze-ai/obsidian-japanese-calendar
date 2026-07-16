import { App, PluginSettingTab, Setting, SettingDefinitionItem } from 'obsidian';
import type JapaneseCalendarPlugin from './main';
import type { CalendarDisplayMode } from './CalendarView';
import type { PluginSettings } from './main';
import { getStr } from './utils';

export class JapaneseCalendarSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: JapaneseCalendarPlugin) {
		super(app, plugin);
	}

	// Obsidian 1.13.0+: 宣言的Settings API（設定検索に対応）
	// 1.13.0未満のフォールバックとして display() も維持する
	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'デイリーノートの保存フォルダ',
				desc: '例：daily notes',
				control: { type: 'text', key: 'dailyNoteFolder', placeholder: 'Daily notes' },
			},
			{
				name: 'ファイル名フォーマット',
				desc: '日付フォーマット（例: `YYYY-MM-DD`）',
				control: { type: 'text', key: 'dailyNoteFormat' },
			},
			{
				name: 'テンプレートファイルのパス',
				desc: '空欄の場合はデフォルトテンプレートを使用',
				control: { type: 'text', key: 'templatePath', placeholder: 'Templates/daily.md' },
			},
			{
				type: 'group',
				heading: '表示設定',
				items: [
					{ name: '和暦を表示する', desc: 'ヘッダーに「令和〇年」を表示します', control: { type: 'toggle', key: 'showWareki' } },
					{ name: '祝日名を表示する', desc: '祝日のセルに祝日名を表示します', control: { type: 'toggle', key: 'showHolidayName' } },
					{ name: '六曜を表示する', desc: '大安・仏滅などを各セルに表示します', control: { type: 'toggle', key: 'showRokuyo' } },
					{ name: '吉凶日を表示する', desc: '天赦日・一粒万倍日・不成就日をカレンダーに表示します', control: { type: 'toggle', key: 'showKichijitsu' } },
					{ name: '　天赦日', control: { type: 'toggle', key: 'showTenshanichi' } },
					{ name: '　一粒万倍日', control: { type: 'toggle', key: 'showIchiryuManbai' } },
					{ name: '　不成就日', control: { type: 'toggle', key: 'showFujoju' } },
					{ name: 'ホバーで詳細を表示する', desc: '日付にマウスを乗せると祝日・六曜・吉凶日をポップアップ表示します', control: { type: 'toggle', key: 'showTooltip' } },
					{
						name: '表示モード',
						desc: '1ヶ月、2ヶ月、6ヶ月、1年から選択します',
						control: {
							type: 'dropdown',
							key: 'displayMode',
							options: {
								month: getStr('modeMonth'),
								'two-month': getStr('modeTwoMonth'),
								'six-month': getStr('modeSixMonth'),
								year: getStr('modeYear'),
							},
						},
					},
					{
						name: '週の開始曜日',
						control: {
							type: 'dropdown',
							key: 'weekStart',
							options: { '0': '日曜日', '1': '月曜日' },
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'デイリーノート連携',
				items: [
					{ name: '祝日を自動挿入する', desc: '祝日のデイリーノートを開いたときに祝日名を挿入します', control: { type: 'toggle', key: 'enableAutoInsert' } },
					{ name: '挿入テキストのフォーマット', desc: '{name} が祝日名に置換されます', control: { type: 'text', key: 'insertFormat', placeholder: '> [!note] 祝日\n> {name}' } },
					{ name: 'ステータスバーに祝日数を表示する', control: { type: 'toggle', key: 'showStatusBar' } },
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		if (key === 'weekStart') return String(this.plugin.settings.weekStart);
		return this.plugin.settings[key as keyof PluginSettings];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings as unknown as Record<string, unknown>;
		if (key === 'weekStart') {
			settings.weekStart = value === '1' ? 1 : 0;
		} else {
			settings[key] = value;
		}
		await this.plugin.saveSettings();
	}

	/** @deprecated Obsidian 1.13.0未満向けのフォールバック */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('デイリーノートの保存フォルダ')
			.setDesc('例：daily notes')
			.addText(t => t
				.setPlaceholder('Daily notes')
				.setValue(this.plugin.settings.dailyNoteFolder)
				.onChange(async v => {
					this.plugin.settings.dailyNoteFolder = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('ファイル名フォーマット')
			.setDesc('日付フォーマット（例: `YYYY-MM-DD`）')
			.addText(t => t
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
			.setName('吉凶日を表示する')
			.setDesc('天赦日・一粒万倍日・不成就日をカレンダーに表示します')
			.addToggle(t => t
				.setValue(this.plugin.settings.showKichijitsu)
				.onChange(async v => {
					this.plugin.settings.showKichijitsu = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('　天赦日')
			.addToggle(t => t
				.setValue(this.plugin.settings.showTenshanichi)
				.onChange(async v => {
					this.plugin.settings.showTenshanichi = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('　一粒万倍日')
			.addToggle(t => t
				.setValue(this.plugin.settings.showIchiryuManbai)
				.onChange(async v => {
					this.plugin.settings.showIchiryuManbai = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('　不成就日')
			.addToggle(t => t
				.setValue(this.plugin.settings.showFujoju)
				.onChange(async v => {
					this.plugin.settings.showFujoju = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('ホバーで詳細を表示する')
			.setDesc('日付にマウスを乗せると祝日・六曜・吉凶日をポップアップ表示します')
			.addToggle(t => t
				.setValue(this.plugin.settings.showTooltip)
				.onChange(async v => {
					this.plugin.settings.showTooltip = v;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('表示モード')
			.setDesc('1ヶ月、2ヶ月、6ヶ月、1年から選択します')
			.addDropdown(d => d
				.addOption('month', getStr('modeMonth'))
				.addOption('two-month', getStr('modeTwoMonth'))
				.addOption('six-month', getStr('modeSixMonth'))
				.addOption('year', getStr('modeYear'))
				.setValue(this.plugin.settings.displayMode)
				.onChange(async v => {
					this.plugin.settings.displayMode = v as CalendarDisplayMode;
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
