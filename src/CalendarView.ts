import { ItemView, WorkspaceLeaf, Notice, setIcon, Menu, TFile, FuzzySuggestModal, Modal } from 'obsidian';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { HolidayManager } from './HolidayManager';
import { DailyNoteManager } from './DailyNoteManager';
import { toWareki, getDayLabel, getStr } from './utils';
import type JapaneseCalendarPlugin from './main';

dayjs.extend(isSameOrBefore);

export const VIEW_TYPE = 'japanese-calendar';

export type CalendarDisplayMode = 'month' | 'two-month' | 'six-month' | 'year';

const SVG_ICON_BASE_ATTR = {
	width: '16',
	height: '16',
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	'stroke-width': '2',
	'stroke-linecap': 'round',
	'stroke-linejoin': 'round',
};

export class CalendarView extends ItemView {
	private current: Dayjs;
	private holidays: HolidayManager;
	private notes: DailyNoteManager;
	noteLinkManager = this.plugin.noteLinkManager;
	eventManager = this.plugin.eventManager;

	constructor(leaf: WorkspaceLeaf, private plugin: JapaneseCalendarPlugin) {
		super(leaf);
		this.current = dayjs();
		this.holidays = new HolidayManager();
		this.notes = new DailyNoteManager(this.app, this.plugin.settings);
	}

	getViewType() { return VIEW_TYPE; }
	getDisplayText() { return 'Japanese calendar'; }
	getIcon() { return 'calendar-days'; }

	async onOpen() {
		this.render();
	}

	async onClose() {}

	goToToday() {
		this.current = dayjs();
		this.render();
	}

	render() {
		const root = this.containerEl.children[1] as HTMLElement;
		root.empty();
		root.addClass('japan-holidays-calendar');
		const isDark = this.plugin.settings.calendarTheme === 'dark';
		root.toggleClass('jhc-theme-dark', isDark);
		root.toggleClass('jhc-theme-light', !isDark);

		this.renderToolbar(root);

		const mode = this.plugin.settings.displayMode;
		switch (mode) {
			case 'two-month':
				this.renderTwoMonthView(root);
				break;
			case 'six-month':
				this.renderSixMonthView(root);
				break;
			case 'year':
				this.renderYearView(root);
				break;
			case 'month':
			default: {
				const tooltip = root.createDiv({ cls: 'jhc-tooltip' });
				this.renderMonthView(root, this.current, { tooltip, isPrimary: true });
				this.renderLegend(root);
				break;
			}
		}
	}

	// ─── Toolbar ─────────────────────────────────────────────

	private renderToolbar(root: HTMLElement) {
		const toolbar = root.createDiv({ cls: 'jhc-toolbar' });

		// Navigation group
		const nav = toolbar.createDiv({ cls: 'jhc-nav' });
		const prevBtn = nav.createEl('button', {
			text: '‹',
			attr: { 'aria-label': getStr('goToPrevious') },
		});
		prevBtn.onclick = () => this.navigatePrev();

		const todayBtn = nav.createEl('button', {
			text: getStr('today'),
			cls: 'jhc-today-btn',
			attr: { 'aria-label': getStr('goToToday') },
		});
		todayBtn.onclick = () => this.goToToday();

		const nextBtn = nav.createEl('button', {
			text: '›',
			attr: { 'aria-label': getStr('goToNext') },
		});
		nextBtn.onclick = () => this.navigateNext();

		// Title
		this.renderTitle(toolbar);

		// Display mode dropdown
		this.renderModeDropdown(toolbar);

		// Theme toggle
		this.renderThemeToggle(toolbar);
	}

	private renderTitle(toolbar: HTMLElement) {
		const titleBlock = toolbar.createDiv({ cls: 'jhc-title' });
		const mode = this.plugin.settings.displayMode;
		const year = this.current.year();

		if (this.plugin.settings.showWareki) {
			titleBlock.createDiv({ cls: 'jhc-wareki', text: toWareki(year) });
		}

		if (mode === 'year') {
			titleBlock.createDiv({ cls: 'jhc-month', text: `${year}年` });
		} else if (mode === 'two-month' || mode === 'six-month') {
			titleBlock.createDiv({ cls: 'jhc-month', text: `${year}年` });
		} else {
			const month = this.current.month() + 1;
			titleBlock.createDiv({ cls: 'jhc-month', text: `${year}年${month}月` });
		}
	}

	private renderModeDropdown(toolbar: HTMLElement) {
		const currentMode = this.plugin.settings.displayMode;
		const modes: Array<{ key: CalendarDisplayMode; label: string; icon: string }> = [
			{ key: 'month', label: getStr('modeMonth'), icon: 'calendar' },
			{ key: 'two-month', label: getStr('modeTwoMonth'), icon: 'copy' },
			{ key: 'six-month', label: getStr('modeSixMonth'), icon: 'grid' },
			{ key: 'year', label: getStr('modeYear'), icon: 'calendar-days' },
		];
		const current = modes.find(m => m.key === currentMode) ?? modes[0]!;

		// ピル型ボタン
		const pill = toolbar.createDiv({ cls: 'jhc-mode-pill' });
		const pillBtn = pill.createEl('button', {
			cls: 'jhc-mode-pill-btn',
			attr: { 'aria-label': '表示モード', 'aria-haspopup': 'true' },
		});
		this.renderModeIcon(pillBtn, current.key);
		pillBtn.createSpan({ text: current.label });
		const chevron = pillBtn.createSpan({ cls: 'jhc-mode-chevron' });
		setIcon(chevron, 'chevron-down');

		// ドロップダウンメニュー
		const menu = pill.createDiv({ cls: 'jhc-mode-menu' });

		for (const m of modes) {
			const item = menu.createDiv({
				cls: `jhc-mode-menu-item${m.key === currentMode ? ' is-selected' : ''}`,
				attr: { role: 'menuitem', tabindex: '0' },
			});

			// アイコン
			const iconEl = item.createSpan({ cls: 'jhc-mode-menu-icon' });
			this.renderModeIcon(iconEl, m.key);

			// ラベル
			item.createSpan({ cls: 'jhc-mode-menu-label', text: m.label });

			// チェック
			if (m.key === currentMode) {
				const checkEl = item.createSpan({ cls: 'jhc-mode-menu-check' });
				setIcon(checkEl, 'check');
			}

			item.onclick = async () => {
				if (m.key === currentMode) return;
				this.plugin.settings.displayMode = m.key;
				await this.plugin.saveSettings();
				this.removeModeMenu();
				this.render();
			};
			item.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					item.onclick?.(new MouseEvent('click'));
				}
			});
		}

		// 開閉
		pillBtn.onclick = (e) => {
			e.stopPropagation();
			const isOpen = menu.hasClass('is-open');
			this.removeModeMenu();
			if (!isOpen) {
				menu.addClass('is-open');
				// 外部クリックで閉じる
				const closeHandler = (ev: MouseEvent) => {
					if (!pill.contains(ev.target as Node)) {
						this.removeModeMenu();
						document.removeEventListener('click', closeHandler);
					}
				};
				window.setTimeout(() => document.addEventListener('click', closeHandler), 0);
			}
		};
	}

	private renderModeIcon(container: HTMLElement, mode: CalendarDisplayMode) {
		if (mode === 'six-month') {
			// Inline SVG: small 2x2 grid icon
			const svg = container.createSvg('svg', { attr: SVG_ICON_BASE_ATTR });
			const positions = [
				{ x: '3', y: '3' },
				{ x: '14', y: '3' },
				{ x: '3', y: '14' },
				{ x: '14', y: '14' },
			];
			for (const { x, y } of positions) {
				svg.createSvg('rect', { attr: { x, y, width: '7', height: '7', rx: '1' } });
			}
		} else if (mode === 'two-month') {
			// Inline SVG: two overlapping calendars
			const svg = container.createSvg('svg', { attr: SVG_ICON_BASE_ATTR });
			svg.createSvg('rect', { attr: { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' } });
			svg.createSvg('line', { attr: { x1: '16', y1: '2', x2: '16', y2: '6' } });
			svg.createSvg('line', { attr: { x1: '8', y1: '2', x2: '8', y2: '6' } });
			svg.createSvg('line', { attr: { x1: '3', y1: '10', x2: '21', y2: '10' } });
			// Second calendar (offset, semi-transparent)
			svg.createSvg('rect', { attr: { x: '6', y: '7', width: '18', height: '18', rx: '2', ry: '2', opacity: '0.4' } });
			svg.createSvg('line', { attr: { x1: '19', y1: '5', x2: '19', y2: '9', opacity: '0.4' } });
			svg.createSvg('line', { attr: { x1: '11', y1: '5', x2: '11', y2: '9', opacity: '0.4' } });
			svg.createSvg('line', { attr: { x1: '6', y1: '13', x2: '24', y2: '13', opacity: '0.4' } });
		} else {
			const iconName = mode === 'month' ? 'calendar' : 'calendar-days';
			setIcon(container, iconName);
		}
	}

	private removeModeMenu() {
		document.querySelectorAll('.jhc-mode-menu.is-open').forEach(el => el.removeClass('is-open'));
	}

	private renderThemeToggle(toolbar: HTMLElement) {
		const isDark = this.plugin.settings.calendarTheme === 'dark';
		const themeBtn = toolbar.createEl('button', {
			cls: `jhc-theme-toggle ${isDark ? 'is-dark' : 'is-light'}`,
			attr: { 'aria-label': isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え' },
		});
		setIcon(themeBtn, isDark ? 'moon' : 'sun');
		themeBtn.onclick = async () => {
			this.plugin.settings.calendarTheme = isDark ? 'light' : 'dark';
			await this.plugin.saveSettings();
		};
	}

	private navigatePrev() {
		const mode = this.plugin.settings.displayMode;
		if (mode === 'year') {
			this.current = this.current.subtract(1, 'year');
		} else {
			this.current = this.current.subtract(1, 'month');
		}
		this.render();
	}

	private navigateNext() {
		const mode = this.plugin.settings.displayMode;
		if (mode === 'year') {
			this.current = this.current.add(1, 'year');
		} else {
			this.current = this.current.add(1, 'month');
		}
		this.render();
	}

	// ─── Day-of-week row ──────────────────────────────────────

	private renderDowRow(container: HTMLElement) {
		const row = container.createDiv({ cls: 'jhc-dow-grid' });
		const start = this.plugin.settings.weekStart;

		for (let i = 0; i < 7; i++) {
			const idx = (start + i) % 7;
			const cls = ['jhc-dow', idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''].join(' ').trim();
			row.createDiv({ cls, text: getDayLabel(idx) });
		}
	}

	// ─── Month View ────────────────────────────────────────────

	private renderMonthView(root: HTMLElement, baseDate: Dayjs, opts: { tooltip?: HTMLElement; isPrimary?: boolean; compact?: boolean }) {
		const gridCls = ['jhc-days-grid'];
		if (!this.plugin.settings.showKichijitsu) gridCls.push('compact');
		if (opts.compact) gridCls.push('compact-view');
		const grid = root.createDiv({ cls: gridCls.join(' ') });
		const today = dayjs();
		const start = this.plugin.settings.weekStart;

		const firstDay = baseDate.startOf('month');
		const lastDay = baseDate.endOf('month');

		const offset = (firstDay.day() - start + 7) % 7;

		for (let i = offset - 1; i >= 0; i--) {
			const d = firstDay.subtract(i + 1, 'day');
			this.renderCell(grid, d.toDate(), true, today, opts.tooltip, opts.compact);
		}

		for (let d = firstDay; d.isSameOrBefore(lastDay); d = d.add(1, 'day')) {
			this.renderCell(grid, d.toDate(), false, today, opts.tooltip, opts.compact);
		}

		const totalCells = offset + lastDay.date();
		const remaining = (7 - (totalCells % 7)) % 7;
		for (let i = 1; i <= remaining; i++) {
			const d = lastDay.add(i, 'day');
			this.renderCell(grid, d.toDate(), true, today, opts.tooltip, opts.compact);
		}
	}

	private renderCell(grid: HTMLElement, date: Date, otherMonth: boolean, today: Dayjs, tooltip?: HTMLElement, compact?: boolean) {
		const m = dayjs(date);
		const dow = date.getDay();
		const holidayName = this.holidays.getHolidayName(date);
		const isToday = m.isSame(today, 'day');
		const dateKey = this.noteLinkManager.dateKeyFromDate(date);
		const links = this.noteLinkManager.getLinks(dateKey);

		const classes = ['jhc-day'];
		if (isToday) classes.push('today');
		if (otherMonth) classes.push('other-month');
		if (dow === 0 || (holidayName && !otherMonth)) classes.push('sunday');
		if (dow === 6) classes.push('saturday');
		if (holidayName && !otherMonth) classes.push('holiday');
		if (links.length > 0) classes.push('has-note-link');
		if (compact) classes.push('compact');

		const cell = grid.createDiv({ cls: classes.join(' ') });
		cell.createDiv({ cls: 'jhc-day-num', text: String(date.getDate()) });

		if (!otherMonth) {
			if (holidayName && this.plugin.settings.showHolidayName && !compact) {
				cell.createDiv({ cls: 'jhc-holiday-name', text: holidayName });
			}

			if (this.plugin.settings.showRokuyo && !compact) {
				const rokuyo = this.holidays.getRokuyo(date);
				cell.createDiv({ cls: `jhc-rokuyo jhc-rokuyo-${rokuyo}`, text: rokuyo });
			}

			if (this.plugin.settings.showKichijitsu && !compact) {
				const kichi = this.holidays.getKichijitsu(date, {
					tenshanichi: this.plugin.settings.showTenshanichi,
					ichiryuManbai: this.plugin.settings.showIchiryuManbai,
					fujoju: this.plugin.settings.showFujoju,
				});
				for (const label of kichi) {
					const cls = label === '不成就' ? 'jhc-kichi kyo' : 'jhc-kichi kichi';
					cell.createDiv({ cls, text: label });
				}
			}

			if (this.notes.noteExists(date)) {
				cell.createDiv({ cls: 'jhc-dot' });
			}

			const hasLinks = links.length > 0;
			const hasEvent = this.eventManager.hasEvent(dateKey);
			if (hasLinks || hasEvent) {
				const markers = cell.createDiv({ cls: 'jhc-markers-row' });
				if (hasLinks) {
					this.renderNoteLinkMarker(markers, links, dateKey);
				}
				if (hasEvent) {
					markers.createDiv({ cls: 'jhc-event-marker' });
				}
			}

			cell.onclick = async () => {
				try {
					await this.notes.openOrCreate(date);
					this.render();
				} catch (e) {
					new Notice('デイリーノートの作成に失敗しました');
					console.error(e);
				}
			};

			this.addContextMenu(cell, date, dateKey, links, compact);
		}

		if (this.plugin.settings.showTooltip && tooltip) {
			cell.addEventListener('mouseenter', () => {
				const lines = this.buildTooltipLines(date, links);
				tooltip.empty();
				for (const line of lines) {
					tooltip.createDiv({ text: line });
				}
				const cellRect = cell.getBoundingClientRect();
				const containerRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
				let left = cellRect.left - containerRect.left;
				const top = cellRect.bottom - containerRect.top + 4;

				const estimatedWidth = 140;
				if (left + estimatedWidth > containerRect.width) {
					left = containerRect.width - estimatedWidth - 4;
				}

				tooltip.setCssStyles({
					display: 'block',
					left: `${left}px`,
					top: `${top}px`,
				});
			});
			cell.addEventListener('mouseleave', () => {
				tooltip.setCssStyles({ display: 'none' });
			});
		}
	}

	// ─── Two-Month View ──────────────────────────────────────

	private renderTwoMonthView(root: HTMLElement) {
		const container = root.createDiv({ cls: 'jhc-two-month-grid' });
		for (let i = 0; i < 2; i++) {
			const d = this.current.add(i, 'month');
			this.renderMonthSection(container, d, false);
		}
	}

	// ─── Six-Month View ──────────────────────────────────────

	private renderSixMonthView(root: HTMLElement) {
		const container = root.createDiv({ cls: 'jhc-six-month-grid' });
		for (let i = 0; i < 6; i++) {
			const d = this.current.add(i, 'month');
			this.renderMonthSection(container, d, true);
		}
	}

	private renderMonthSection(root: HTMLElement, baseDate: Dayjs, compact: boolean) {
		const section = root.createDiv({ cls: `jhc-month-section${compact ? ' compact' : ''}` });

		const header = section.createDiv({ cls: 'jhc-month-section-header' });
		if (this.plugin.settings.showWareki) {
			header.createDiv({ cls: 'jhc-wareki', text: toWareki(baseDate.year()) });
		}
		header.createDiv({ cls: 'jhc-month', text: `${baseDate.year()}年${baseDate.month() + 1}月` });

		this.renderDowRow(section);
		const tooltip = section.createDiv({ cls: 'jhc-tooltip' });
		this.renderMonthView(section, baseDate, { tooltip, isPrimary: false, compact });
	}

	// ─── Year View ─────────────────────────────────────────────

	private renderYearView(root: HTMLElement) {
		const tooltip = this.plugin.settings.showTooltip ? root.createDiv({ cls: 'jhc-tooltip' }) : null;
		const grid = root.createDiv({ cls: 'jhc-year-grid' });
		const today = dayjs();
		const year = this.current.year();

		for (let month = 0; month < 12; month++) {
			this.renderMiniMonth(grid, dayjs(new Date(year, month, 1)), today, tooltip);
		}
	}

	private renderMiniMonth(container: HTMLElement, monthDate: Dayjs, today: Dayjs, tooltip: HTMLElement | null = null) {
		const mm = container.createDiv({ cls: 'jhc-mini-month' });

		const header = mm.createDiv({ cls: 'jhc-mini-month-header' });
		header.createDiv({ text: `${monthDate.month() + 1}月` });
		header.onclick = async () => {
			this.current = monthDate;
			this.plugin.settings.displayMode = 'month';
			await this.plugin.saveSettings();
			this.render();
		};
		header.setAttr('tabindex', '0');
		header.setAttr('role', 'button');
		header.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				void header.onclick?.(new MouseEvent('click'));
			}
		});

		const dowRow = mm.createDiv({ cls: 'jhc-mini-dow-grid' });
		const start = this.plugin.settings.weekStart;
		for (let i = 0; i < 7; i++) {
			const idx = (start + i) % 7;
			const cls = ['jhc-mini-dow', idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''].join(' ').trim();
			dowRow.createDiv({ cls, text: getDayLabel(idx) });
		}

		const dayGrid = mm.createDiv({ cls: 'jhc-mini-days-grid' });

		const firstDay = monthDate.startOf('month');
		const lastDay = monthDate.endOf('month');
		const offset = (firstDay.day() - start + 7) % 7;

		for (let i = offset - 1; i >= 0; i--) {
			const d = firstDay.subtract(i + 1, 'day');
			this.renderMiniCell(dayGrid, d.toDate(), true, today, tooltip);
		}

		for (let d = firstDay; d.isSameOrBefore(lastDay); d = d.add(1, 'day')) {
			this.renderMiniCell(dayGrid, d.toDate(), false, today, tooltip);
		}

		const totalCells = offset + lastDay.date();
		const remaining = (7 - (totalCells % 7)) % 7;
		for (let i = 1; i <= remaining; i++) {
			const d = lastDay.add(i, 'day');
			this.renderMiniCell(dayGrid, d.toDate(), true, today, tooltip);
		}
	}

	private renderMiniCell(grid: HTMLElement, date: Date, otherMonth: boolean, today: Dayjs, tooltip: HTMLElement | null = null) {
		const m = dayjs(date);
		const dow = date.getDay();
		const holidayName = this.holidays.getHolidayName(date);
		const isToday = m.isSame(today, 'day');
		const dateKey = this.noteLinkManager.dateKeyFromDate(date);
		const links = this.noteLinkManager.getLinks(dateKey);
		const hasDailyNote = !otherMonth && this.notes.noteExists(date);

		const classes = ['jhc-mini-day'];
		if (isToday) classes.push('today');
		if (otherMonth) classes.push('other-month');
		if (dow === 0 || (holidayName && !otherMonth)) classes.push('sunday');
		if (dow === 6) classes.push('saturday');
		if (holidayName && !otherMonth) classes.push('holiday');
		if (hasDailyNote) classes.push('has-daily-note');
		if (links.length > 0) classes.push('has-note-link');

		const cell = grid.createDiv({ cls: classes.join(' ') });

		cell.createDiv({ cls: 'jhc-mini-day-num', text: String(date.getDate()) });

		if (links.length > 0) {
			const marker = cell.createDiv({ cls: 'jhc-note-link-marker' });
			marker.onclick = (e) => {
				e.stopPropagation();
				this.openNoteLink(links);
			};
		}

		if (!otherMonth) {
			cell.onclick = async () => {
				try {
					await this.notes.openOrCreate(date);
				} catch (e) {
					new Notice('デイリーノートの作成に失敗しました');
					console.error(e);
				}
			};
		}

		if (!otherMonth) {
			this.addContextMenu(cell, date, dateKey, links, true);
		}

		if (tooltip) {
			cell.addEventListener('mouseenter', () => {
				const lines = this.buildTooltipLines(date, links);
				tooltip.empty();
				for (const line of lines) {
					tooltip.createDiv({ text: line });
				}
				const cellRect = cell.getBoundingClientRect();
				const containerRect = (tooltip.parentElement as HTMLElement).getBoundingClientRect();
				let left = cellRect.left - containerRect.left;
				const top = cellRect.bottom - containerRect.top + 4;
				const estimatedWidth = 140;
				if (left + estimatedWidth > containerRect.width) {
					left = containerRect.width - estimatedWidth - 4;
				}
				tooltip.setCssStyles({
					display: 'block',
					left: `${left}px`,
					top: `${top}px`,
				});
			});
			cell.addEventListener('mouseleave', () => {
				tooltip.setCssStyles({ display: 'none' });
			});
		}
	}

	// ─── Note Link Marker ────────────────────────────────────

	private renderNoteLinkMarker(container: HTMLElement, links: string[], _dateKey: string) {
		const marker = container.createDiv({ cls: 'jhc-note-link-marker' });
		marker.setAttr('aria-label', `${getStr('tooltipLinkedNotes')}: ${links.length}`);
		marker.onclick = (e) => {
			e.stopPropagation();
			this.openNoteLink(links);
		};
	}

	private openNoteLink(links: string[]) {
		if (links.length === 0) return;
		if (links.length === 1) {
			const path = links[0];
			if (!path) return;
			const file = this.noteLinkManager.resolveFile(path);
			if (file) {
				void this.app.workspace.getLeaf(false).openFile(file);
			} else {
				new Notice(getStr('noteNotFound'));
			}
			return;
		}

		const menu = new Menu();
		for (const link of links) {
			const file = this.noteLinkManager.resolveFile(link);
			const label = file ? file.basename : `${link} (${getStr('noteNotFound')})`;
			menu.addItem(item => {
				item.setTitle(label);
				item.onClick(async () => {
					if (file) {
						await this.app.workspace.getLeaf(false).openFile(file);
					} else {
						new Notice(getStr('noteNotFound'));
					}
				});
			});
		}
		menu.showAtMouseEvent(new MouseEvent('contextmenu'));
	}

	// ─── Context Menu ─────────────────────────────────────────

	private addContextMenu(cell: HTMLElement, date: Date, dateKey: string, links: string[], _compact?: boolean) {
		cell.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			const menu = new Menu();

			menu.addItem(item => {
				item.setTitle(getStr('openDailyNote'));
				item.onClick(async () => {
					try {
						await this.notes.openOrCreate(date);
					} catch {
						new Notice('デイリーノートの作成に失敗しました');
					}
				});
			});

			menu.addItem(item => {
				item.setTitle(getStr('linkNote'));
				item.onClick(() => {
					this.showNoteSelector(dateKey);
				});
			});

			if (links.length > 0) {
				if (links.length === 1) {
					menu.addItem(item => {
						item.setTitle(getStr('openLinkedNote'));
						item.onClick(() => {
							const path = links[0];
							if (!path) return;
							const file = this.noteLinkManager.resolveFile(path);
							if (file) {
								void this.app.workspace.getLeaf(false).openFile(file);
							} else {
								new Notice(getStr('noteNotFound'));
							}
						});
					});
				} else {
					menu.addItem(item => {
						item.setTitle(getStr('openLinkedNote'));
						item.onClick(() => {
							this.openNoteLink(links);
						});
					});
				}

				menu.addItem(item => {
					item.setTitle(getStr('manageLinks'));
					item.onClick(() => {
						this.showLinkManager(dateKey, date);
					});
				});
			} else {
				menu.addItem(item => {
					item.setTitle(getStr('manageLinks'));
					item.onClick(() => {
						this.showLinkManager(dateKey, date);
					});
				});
			}

			menu.addSeparator();

			const event = this.eventManager.getEvent(dateKey);
			if (event) {
				menu.addItem(item => {
					item.setTitle(getStr('editEvent'));
					item.onClick(() => {
						this.showEventDialog(dateKey, date);
					});
				});
			} else {
				menu.addItem(item => {
					item.setTitle(getStr('addEvent'));
					item.onClick(() => {
						this.showEventDialog(dateKey, date);
					});
				});
			}

			menu.showAtMouseEvent(e);
		});
	}

	// ─── Note Selector ─────────────────────────────────────────

	showNoteSelector(dateKey: string) {
		const allFiles = this.noteLinkManager.getAllMarkdownFiles();
		const existing = this.noteLinkManager.getLinks(dateKey);

		const available = allFiles.filter(f => !existing.includes(f.path));

		if (available.length === 0) {
			new Notice(getStr('noLinkedNotes'));
			return;
		}

		new NoteSelectorModal(this, available, dateKey).open();
	}

	// ─── Link Manager ──────────────────────────────────────────

	private showLinkManager(dateKey: string, date: Date) {
		const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
		new LinkManagerModal(this, dateKey, dateStr).open();
	}

	// ─── Tooltip ──────────────────────────────────────────────

	private buildTooltipLines(date: Date, links: string[]): string[] {
		const lines: string[] = [];
		const holidayName = this.holidays.getHolidayName(date);
		if (holidayName) lines.push(`🎌 ${holidayName}`);
		lines.push(this.holidays.getRokuyo(date));
		const kichi = this.holidays.getKichijitsu(date, { tenshanichi: true, ichiryuManbai: true, fujoju: true });
		for (const k of kichi) {
			lines.push(k === '不成就' ? `✗ ${k}` : `◎ ${k}`);
		}
		if (links.length > 0) {
			for (const link of links) {
				const file = this.noteLinkManager.resolveFile(link);
				const name = file ? file.basename : link;
				lines.push(`🔗 ${name}`);
			}
		}
		const dateKey = this.eventManager.dateKeyFromDate(date);
		const event = this.eventManager.getEvent(dateKey);
		if (event) {
			lines.push(`📅 ${event.title}`);
		}
		return lines;
	}

	private buildTooltipTitle(date: Date, links: string[]): string {
		const holidayName = this.holidays.getHolidayName(date);
		const rokuyo = this.holidays.getRokuyo(date);
		const parts: string[] = [];
		if (holidayName) parts.push(holidayName);
		parts.push(rokuyo);
		if (links.length > 0) {
			const names = links.map(l => {
				const file = this.noteLinkManager.resolveFile(l);
				return file ? file.basename : l;
			});
			parts.push(`📎 ${names.join(', ')}`);
		}
		const dateKey = this.eventManager.dateKeyFromDate(date);
		const event = this.eventManager.getEvent(dateKey);
		if (event) {
			parts.push(`📅 ${event.title}`);
		}
		return parts.join(' · ');
	}

	// ─── Event Dialog ─────────────────────────────────────────

	private showEventDialog(dateKey: string, date: Date) {
		const event = this.eventManager.getEvent(dateKey);
		const isEdit = !!event;

		const modal = new (class extends Modal {
			titleInput: HTMLInputElement;
			noteInput: HTMLInputElement;

			constructor(private view: CalendarView) {
				super(view.app);
				this.titleEl.setText(isEdit ? getStr('editEvent') : getStr('addEvent'));
			}

			onOpen() {
				const { contentEl } = this;

				// Title
				contentEl.createEl('label', { text: getStr('eventTitle'), cls: 'jhc-event-label' });
				this.titleInput = contentEl.createEl('input', {
					cls: 'jhc-event-input',
					attr: { type: 'text', placeholder: getStr('eventTitlePlaceholder') },
				});
				if (event) this.titleInput.value = event.title;

				// Note
				contentEl.createEl('label', { text: getStr('relatedNote'), cls: 'jhc-event-label' });
				const noteRow = contentEl.createDiv({ cls: 'jhc-event-note-row' });
				this.noteInput = noteRow.createEl('input', {
					cls: 'jhc-event-input',
					attr: { type: 'text', placeholder: getStr('relatedNotePlaceholder'), readonly: 'true' },
				});
				if (event && event.note) this.noteInput.value = event.note;
				const browseBtn = noteRow.createEl('button', { text: '...', cls: 'jhc-event-browse' });
				browseBtn.onclick = () => {
					this.close();
					this.view.showNoteSelectorForEvent(dateKey, date);
				};

				// Buttons
				const btnRow = contentEl.createDiv({ cls: 'jhc-event-buttons' });

				const saveBtn = btnRow.createEl('button', {
					text: getStr('saveEvent'),
					cls: 'jhc-event-save',
				});
				saveBtn.onclick = async () => {
					const title = this.titleInput.value.trim();
					if (!title) {
						new Notice(getStr('eventTitleRequired'));
						return;
					}
					const note = this.noteInput.value.trim() || undefined;
					await this.view.eventManager.saveEvent(dateKey, title, note);
					new Notice(getStr('eventSaved'));
					this.close();
				};

				if (isEdit) {
					const deleteBtn = btnRow.createEl('button', {
						text: getStr('deleteEvent'),
						cls: 'jhc-event-delete',
					});
					deleteBtn.onclick = async () => {
						await this.view.eventManager.deleteEvent(dateKey);
						new Notice(getStr('eventDeleted'));
						this.close();
					};
				}

				const cancelBtn = btnRow.createEl('button', {
					text: getStr('cancelEvent'),
					cls: 'jhc-event-cancel',
				});
				cancelBtn.onclick = () => this.close();

				// Enter to save
				this.titleInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter' && !e.isComposing) saveBtn.onclick?.(new MouseEvent('click'));
				});
			}

			onClose() {
				const { contentEl } = this;
				contentEl.empty();
				this.view.render();
			}
		})(this);
		modal.open();
	}

	// Add note selector variant for events
	private showNoteSelectorForEvent(dateKey: string, date: Date) {
		const files = this.app.vault.getMarkdownFiles();
		if (files.length === 0) {
			new Notice(getStr('noLinkedNotes'));
			return;
		}
		const modal = new (class extends FuzzySuggestModal<TFile> {
			constructor(private view: CalendarView) {
				super(view.app);
				this.setPlaceholder(getStr('selectNote'));
			}
			getItems(): TFile[] { return files; }
			getItemText(f: TFile): string { return f.path; }
			onChooseItem(f: TFile): void {
				this.view.showEventDialogWithNote(dateKey, date, f.path);
			}
		})(this);
		modal.open();
	}

	private showEventDialogWithNote(dateKey: string, date: Date, notePath: string) {
		const modal = new (class extends Modal {
			titleInput: HTMLInputElement;
			noteInput: HTMLInputElement;
			constructor(private view: CalendarView) {
				super(view.app);
				const event = view.eventManager.getEvent(dateKey);
				this.titleEl.setText(event ? getStr('editEvent') : getStr('addEvent'));
			}
			onOpen() {
				const { contentEl } = this;
				const event = this.view.eventManager.getEvent(dateKey);
				contentEl.createEl('label', { text: getStr('eventTitle'), cls: 'jhc-event-label' });
				this.titleInput = contentEl.createEl('input', { cls: 'jhc-event-input', attr: { type: 'text' } });
				if (event) this.titleInput.value = event.title;
				contentEl.createEl('label', { text: getStr('relatedNote'), cls: 'jhc-event-label' });
				this.noteInput = contentEl.createEl('input', {
					cls: 'jhc-event-input', attr: { type: 'text', readonly: 'true' },
				});
				this.noteInput.value = notePath;
				const btnRow = contentEl.createDiv({ cls: 'jhc-event-buttons' });
				const saveBtn = btnRow.createEl('button', { text: getStr('saveEvent'), cls: 'jhc-event-save' });
				saveBtn.onclick = async () => {
					const t = this.titleInput.value.trim();
					if (!t) { new Notice(getStr('eventTitleRequired')); return; }
					await this.view.eventManager.saveEvent(dateKey, t, notePath);
					new Notice(getStr('eventSaved'));
					this.close();
				};
				if (event) {
					const delBtn = btnRow.createEl('button', { text: getStr('deleteEvent'), cls: 'jhc-event-delete' });
					delBtn.onclick = async () => {
						await this.view.eventManager.deleteEvent(dateKey);
						new Notice(getStr('eventDeleted'));
						this.close();
					};
				}
				btnRow.createEl('button', { text: getStr('cancelEvent'), cls: 'jhc-event-cancel' }).onclick = () => this.close();
			}
			onClose() {
				const { contentEl } = this;
				contentEl.empty();
				this.view.render();
			}
		})(this);
		modal.open();
	}

	// ─── Legend ────────────────────────────────────────────────

	private renderLegend(root: HTMLElement) {
		const legend = root.createDiv({ cls: 'jhc-legend' });

		const items: Array<{ cls: string; label: string }> = [
			{ cls: 'accent', label: '今日' },
			{ cls: 'holiday', label: '祝日' },
			{ cls: 'saturday', label: '土曜' },
			{ cls: 'note-link', label: 'リンク' },
			{ cls: 'event', label: '予定' },
		];

		for (const item of items) {
			const el = legend.createDiv({ cls: 'jhc-legend-item' });
			el.createDiv({ cls: `jhc-legend-dot ${item.cls}` });
			el.createSpan({ text: item.label });
		}
	}

	// ─── Refresh ───────────────────────────────────────────────

	refresh() {
		this.notes = new DailyNoteManager(this.app, this.plugin.settings);
		this.render();
	}
}

// ─── Note Selector Modal ────────────────────────────────────

class NoteSelectorModal extends FuzzySuggestModal<TFile> {
	constructor(
		private readonly view: CalendarView,
		private readonly files: TFile[],
		private readonly dateKey: string,
	) {
		super(view.app);
		this.setPlaceholder(getStr('selectNote'));
	}

	getItems(): TFile[] {
		return this.files;
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		void (async () => {
			await this.view.noteLinkManager.addLink(this.dateKey, file.path);
			new Notice(getStr('linkAdded'));
			this.view.render();
		})();
	}
}

// ─── Link Manager Modal ─────────────────────────────────────

class LinkManagerModal extends Modal {
	constructor(
		private readonly view: CalendarView,
		private readonly dateKey: string,
		dateStr: string,
	) {
		super(view.app);
		this.titleEl.setText(`${getStr('manageLinks')} - ${dateStr}`);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		const links = this.view.noteLinkManager.getLinks(this.dateKey);

		if (links.length === 0) {
			contentEl.createDiv({ text: getStr('noLinkedNotes'), cls: 'jhc-link-manager-empty' });
		} else {
			const list = contentEl.createDiv({ cls: 'jhc-link-manager-list' });
			for (const link of links) {
				const item = list.createDiv({ cls: 'jhc-link-manager-item' });
				const file = this.view.noteLinkManager.resolveFile(link);
				const label = file ? file.path : `${link} (${getStr('noteNotFound')})`;
				const nameSpan = item.createSpan({ text: label, cls: 'jhc-link-manager-name' });

				if (file) {
					nameSpan.onclick = async () => {
						await this.view.app.workspace.getLeaf(false).openFile(file);
						this.close();
					};
					nameSpan.setAttr('tabindex', '0');
					nameSpan.setAttr('role', 'button');
				}

				const unlinkBtn = item.createEl('button', {
					text: getStr('unlink'),
					cls: 'jhc-link-manager-unlink',
				});
				unlinkBtn.onclick = async () => {
					await this.view.noteLinkManager.removeLink(this.dateKey, link);
					new Notice(getStr('linkRemoved'));
					this.onOpen();
				};
			}
		}

		const addBtn = contentEl.createEl('button', {
			text: getStr('linkNote'),
			cls: 'jhc-link-manager-add',
		});
		addBtn.onclick = () => {
			this.close();
			this.view.showNoteSelector(this.dateKey);
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
		this.view.render();
	}
}
