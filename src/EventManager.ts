import { TFile } from 'obsidian';
import type { CalendarEvent } from './main';
import type JapaneseCalendarPlugin from './main';

export class EventManager {
	private events: Record<string, CalendarEvent>;

	constructor(private plugin: JapaneseCalendarPlugin) {
		this.events = plugin.settings.events;
	}

	/** 日付キーを正規化 */
	dateKey(year: number, month: number, day: number): string {
		const y = String(year).padStart(4, '0');
		const m = String(month + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	dateKeyFromDate(date: Date): string {
		return this.dateKey(date.getFullYear(), date.getMonth(), date.getDate());
	}

	/** 日付のイベントを取得 */
	getEvent(dateKey: string): CalendarEvent | null {
		return this.events[dateKey] ?? null;
	}

	/** イベント保存（新規 or 更新） */
	async saveEvent(dateKey: string, title: string, note?: string): Promise<void> {
		if (!title.trim()) return;
		this.events[dateKey] = { date: dateKey, title: title.trim(), note: note?.trim() || undefined };
		await this.plugin.saveSettings();
	}

	/** イベント削除 */
	async deleteEvent(dateKey: string): Promise<void> {
		delete this.events[dateKey];
		await this.plugin.saveSettings();
	}

	/** 日付にイベントが存在するか */
	hasEvent(dateKey: string): boolean {
		return dateKey in this.events;
	}

	/** ノートrename時にパスを更新 */
	async updateNotePath(oldPath: string, newPath: string): Promise<void> {
		let changed = false;
		for (const key of Object.keys(this.events)) {
			const ev = this.events[key];
			if (ev && ev.note === oldPath) {
				ev.note = newPath;
				changed = true;
			}
		}
		if (changed) await this.plugin.saveSettings();
	}

	/** ノートdelete時にリンクを除去 */
	async removeNotePath(path: string): Promise<void> {
		let changed = false;
		for (const key of Object.keys(this.events)) {
			const ev = this.events[key];
			if (ev && ev.note === path) {
				delete ev.note;
				changed = true;
			}
		}
		if (changed) await this.plugin.saveSettings();
	}
}
