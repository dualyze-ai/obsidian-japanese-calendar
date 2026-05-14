import { App, TFile } from 'obsidian';
import { HolidayManager } from './HolidayManager';

export interface DailyNoteSettings {
	dailyNoteFolder: string;
	dailyNoteFormat: string;
	templatePath: string;
	showRokuyo: boolean;
	enableAutoInsert: boolean;
	insertFormat: string;
}

export class DailyNoteManager {
	private holidays = new HolidayManager();

	constructor(private app: App, private settings: DailyNoteSettings) {}

	noteExists(date: Date): boolean {
		return !!this.app.vault.getAbstractFileByPath(this.filePath(date));
	}

	async openOrCreate(date: Date): Promise<void> {
		const path = this.filePath(date);
		const existing = this.app.vault.getAbstractFileByPath(path);

		if (existing instanceof TFile) {
			await this.app.workspace.getLeaf(false).openFile(existing);
			return;
		}

		const folder = this.settings.dailyNoteFolder;
		if (folder && !this.app.vault.getAbstractFileByPath(folder)) {
			await this.app.vault.createFolder(folder);
		}

		const content = await this.buildContent(date);
		const file = await this.app.vault.create(path, content);
		await this.app.workspace.getLeaf(false).openFile(file);
	}

	// 既に開かれているDailyNoteに祝日calloutを挿入する
	async tryInsertHoliday(file: TFile, holidayName: string): Promise<void> {
		if (!this.settings.enableAutoInsert) return;

		const content = await this.app.vault.read(file);
		const marker = `{name}`.replace('{name}', holidayName);
		if (content.includes(marker)) return;

		const callout = this.settings.insertFormat.replace('{name}', holidayName);
		await this.app.vault.modify(file, callout + '\n\n' + content);
	}

	filePath(date: Date): string {
		const fileName = window.moment(date).format(this.settings.dailyNoteFormat);
		const folder = this.settings.dailyNoteFolder;
		return folder ? `${folder}/${fileName}.md` : `${fileName}.md`;
	}

	private async buildContent(date: Date): Promise<string> {
		const m = window.moment(date);
		const dateStr = m.format(this.settings.dailyNoteFormat);
		const holiday = this.holidays.getHolidayName(date);
		const rokuyo = this.settings.showRokuyo ? this.holidays.getRokuyo(date) : null;

		if (this.settings.templatePath) {
			const tmplFile = this.app.vault.getAbstractFileByPath(this.settings.templatePath);
			if (tmplFile instanceof TFile) {
				const tmpl = await this.app.vault.read(tmplFile);
				return this.applyTemplate(tmpl, date, holiday, rokuyo);
			}
		}

		let header = `# ${dateStr}`;
		if (holiday) header += `（${holiday}）`;
		if (rokuyo) header += `\n> ${rokuyo}`;

		return `${header}\n\n## 予定\n\n## メモ\n\n## タスク\n- [ ] \n`;
	}

	private applyTemplate(
		tmpl: string,
		date: Date,
		holiday: string | null,
		rokuyo: string | null
	): string {
		const m = window.moment(date);
		return tmpl
			.replace(/{{date}}/g, m.format(this.settings.dailyNoteFormat))
			.replace(/{{date:YYYY}}/g, m.format('YYYY'))
			.replace(/{{date:MM}}/g, m.format('MM'))
			.replace(/{{date:DD}}/g, m.format('DD'))
			.replace(/{{holiday}}/g, holiday ?? '')
			.replace(/{{rokuyo}}/g, rokuyo ?? '')
			.replace(/{{wareki}}/g, this.wareki(date.getFullYear()));
	}

	private wareki(year: number): string {
		if (year >= 2019) return `令和${year - 2018}年`;
		if (year >= 1989) return `平成${year - 1988}年`;
		return `${year}年`;
	}
}
