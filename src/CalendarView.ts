import { ItemView, WorkspaceLeaf, moment } from 'obsidian';
import { HolidayManager } from './HolidayManager';
import { DailyNoteManager } from './DailyNoteManager';
import { toWareki, getDayLabel } from './utils';
import type JapaneseCalendarPlugin from './main';

type Moment = ReturnType<typeof moment>;

export const VIEW_TYPE = 'japanese-calendar';

export class CalendarView extends ItemView {
	private current: Moment;
	private holidays: HolidayManager;
	private notes: DailyNoteManager;

	constructor(leaf: WorkspaceLeaf, private plugin: JapaneseCalendarPlugin) {
		super(leaf);
		this.current = moment();
		this.holidays = new HolidayManager();
		this.notes = new DailyNoteManager(this.app, this.plugin.settings);
	}

	getViewType() { return VIEW_TYPE; }
	// eslint-disable-next-line obsidianmd/ui/sentence-case
	getDisplayText() { return 'Japanese Calendar'; }
	getIcon() { return 'calendar-days'; }

	async onOpen() {
		this.render();
	}

	async onClose() {}

	render() {
		const root = this.containerEl.children[1] as HTMLElement;
		root.empty();
		root.addClass('japan-holidays-calendar');

		this.renderHeader(root);
		this.renderDowRow(root);
		this.renderDays(root);
		this.renderLegend(root);
	}

	private renderHeader(root: HTMLElement) {
		const header = root.createDiv({ cls: 'jhc-header' });

		const titleBlock = header.createDiv({ cls: 'jhc-title' });
		const year = this.current.year();
		const month = this.current.month() + 1;

		if (this.plugin.settings.showWareki) {
			titleBlock.createDiv({ cls: 'jhc-wareki', text: toWareki(year) });
		}
		titleBlock.createDiv({ cls: 'jhc-month', text: `${year}年${month}月` });

		const nav = header.createDiv({ cls: 'jhc-nav' });
		nav.createEl('button', { text: '‹' }).onclick = () => {
			this.current.subtract(1, 'month');
			this.render();
		};
		nav.createEl('button', { text: '今日', cls: 'jhc-today-btn' }).onclick = () => {
			this.current = moment();
			this.render();
		};
		nav.createEl('button', { text: '›' }).onclick = () => {
			this.current.add(1, 'month');
			this.render();
		};
	}

	private renderDowRow(root: HTMLElement) {
		const row = root.createDiv({ cls: 'jhc-dow-grid' });
		const start = this.plugin.settings.weekStart;

		for (let i = 0; i < 7; i++) {
			const idx = (start + i) % 7;
			const cls = ['jhc-dow', idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''].join(' ').trim();
			row.createDiv({ cls, text: getDayLabel(idx) });
		}
	}

	private renderDays(root: HTMLElement) {
		const grid = root.createDiv({ cls: 'jhc-days-grid' });
		const today = moment();
		const start = this.plugin.settings.weekStart;

		const firstDay = this.current.clone().startOf('month');
		const lastDay = this.current.clone().endOf('month');

		let offset = (firstDay.day() - start + 7) % 7;

		for (let i = offset - 1; i >= 0; i--) {
			const d = firstDay.clone().subtract(i + 1, 'day');
			this.renderCell(grid, d.toDate(), true, today);
		}

		for (const d = firstDay.clone(); d.isSameOrBefore(lastDay); d.add(1, 'day')) {
			this.renderCell(grid, d.toDate(), false, today);
		}

		const totalCells = offset + lastDay.date();
		const remaining = (7 - (totalCells % 7)) % 7;
		for (let i = 1; i <= remaining; i++) {
			const d = lastDay.clone().add(i, 'day');
			this.renderCell(grid, d.toDate(), true, today);
		}
	}

	private renderCell(grid: HTMLElement, date: Date, otherMonth: boolean, today: Moment) {
		const m = moment(date);
		const dow = date.getDay();
		const holidayName = this.holidays.getHolidayName(date);
		const isToday = m.isSame(today, 'day');

		const classes = ['jhc-day'];
		if (isToday) classes.push('today');
		if (otherMonth) classes.push('other-month');
		if (dow === 0 || (holidayName && !otherMonth)) classes.push('sunday');
		if (dow === 6) classes.push('saturday');
		if (holidayName && !otherMonth) classes.push('holiday');

		const cell = grid.createDiv({ cls: classes.join(' ') });

		cell.createDiv({ cls: 'jhc-day-num', text: String(date.getDate()) });

		if (!otherMonth) {
			if (holidayName && this.plugin.settings.showHolidayName) {
				cell.createDiv({ cls: 'jhc-holiday-name', text: holidayName });
			}

			if (this.plugin.settings.showRokuyo) {
				const rokuyo = this.holidays.getRokuyo(date);
				cell.createDiv({ cls: `jhc-rokuyo jhc-rokuyo-${rokuyo}`, text: rokuyo });
			}

			if (this.notes.noteExists(date)) {
				cell.createDiv({ cls: 'jhc-dot' });
			}

			cell.onclick = async () => {
				await this.notes.openOrCreate(date);
				this.render();
			};
		}
	}

	private renderLegend(root: HTMLElement) {
		const legend = root.createDiv({ cls: 'jhc-legend' });

		const items: Array<{ cls: string; label: string }> = [
			{ cls: 'accent', label: '今日' },
			{ cls: 'holiday', label: '祝日' },
			{ cls: 'saturday', label: '土曜' },
		];

		for (const item of items) {
			const el = legend.createDiv({ cls: 'jhc-legend-item' });
			el.createDiv({ cls: `jhc-legend-dot ${item.cls}` });
			el.createSpan({ text: item.label });
		}
	}

	refresh() {
		this.notes = new DailyNoteManager(this.app, this.plugin.settings);
		this.render();
	}
}
