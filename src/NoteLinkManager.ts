import { TFile } from 'obsidian';
import type JapaneseCalendarPlugin from './main';

export class NoteLinkManager {
	private data: Record<string, string[]>;

	constructor(private plugin: JapaneseCalendarPlugin) {
		this.data = plugin.settings.noteLinks;
	}

	/** ローカル日付キーを生成 (YYYY-MM-DD, UTC変換しない) */
	dateKey(year: number, month: number, day: number): string {
		const y = String(year).padStart(4, '0');
		const m = String(month + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	/** Dateオブジェクトから日付キーを生成 */
	dateKeyFromDate(date: Date): string {
		return this.dateKey(date.getFullYear(), date.getMonth(), date.getDate());
	}

	/** 日付キーに紐づくリンクを取得 */
	getLinks(dateKey: string): string[] {
		return this.data[dateKey] ?? [];
	}

	/** リンクを追加（重複排除） */
	async addLink(dateKey: string, path: string): Promise<void> {
		if (!this.data[dateKey]) {
			this.data[dateKey] = [];
		}
		const arr = this.data[dateKey];
		if (arr && !arr.includes(path)) {
			arr.push(path);
			await this.plugin.saveSettings();
		}
	}

	/** リンクを解除。空配列になったらキーを削除 */
	async removeLink(dateKey: string, path: string): Promise<void> {
		const arr = this.data[dateKey];
		if (!arr) return;
		const idx = arr.indexOf(path);
		if (idx !== -1) {
			arr.splice(idx, 1);
			if (arr.length === 0) {
				delete this.data[dateKey];
			}
			await this.plugin.saveSettings();
		}
	}

	/** パスからTFileを解決（存在しなければnull） */
	resolveFile(path: string): TFile | null {
		const file = this.plugin.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile ? file : null;
	}

	/** ノートのリネーム時に保存済みパスを更新 */
	async updatePath(oldPath: string, newPath: string): Promise<void> {
		let changed = false;
		for (const key of Object.keys(this.data)) {
			const arr = this.data[key];
			if (!arr) continue;
			for (let i = 0; i < arr.length; i++) {
				if (arr[i] === oldPath) {
					arr[i] = newPath;
					changed = true;
				}
			}
		}
		if (changed) {
			await this.plugin.saveSettings();
		}
	}

	/** ノート削除時に保存済みリンクから除去 */
	async removePath(path: string): Promise<void> {
		let changed = false;
		for (const key of Object.keys(this.data)) {
			const arr = this.data[key];
			if (!arr) continue;
			const idx = arr.indexOf(path);
			if (idx !== -1) {
				arr.splice(idx, 1);
				if (arr.length === 0) {
					delete this.data[key];
				}
				changed = true;
			}
		}
		if (changed) {
			await this.plugin.saveSettings();
		}
	}

	/** Vault内の全Markdownファイルを取得（FuzzySuggestModal用） */
	getAllMarkdownFiles(): TFile[] {
		return this.plugin.app.vault.getMarkdownFiles();
	}

	/** フォルダrename時に配下のパスを更新 */
	async updateFolderPath(oldFolder: string, newFolder: string): Promise<void> {
		let changed = false;
		for (const key of Object.keys(this.data)) {
			const arr = this.data[key];
			if (!arr) continue;
			for (let i = 0; i < arr.length; i++) {
				const path = arr[i];
				if (path && path.startsWith(oldFolder + '/')) {
					arr[i] = newFolder + path.slice(oldFolder.length);
					changed = true;
				}
			}
		}
		if (changed) {
			await this.plugin.saveSettings();
		}
	}

	/** 保存データをクリーンアップ（不正な日付キーや存在しないノートパスの除去） */
	async cleanup(): Promise<void> {
		const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
		let changed = false;
		for (const key of Object.keys(this.data)) {
			if (!dateKeyPattern.test(key)) {
				delete this.data[key];
				changed = true;
				continue;
			}
			const arr = this.data[key];
			if (!arr || arr.length === 0) {
				delete this.data[key];
				changed = true;
				continue;
			}
			const filtered: string[] = [];
			for (const p of arr) {
				if (p && !filtered.includes(p)) {
					filtered.push(p);
				}
			}
			if (filtered.length !== arr.length) {
				this.data[key] = filtered;
				changed = true;
			}
		}
		if (changed) {
			await this.plugin.saveSettings();
		}
	}
}
