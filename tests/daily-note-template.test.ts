import { describe, it, expect } from 'vitest';
import { applyDailyNoteTemplate } from '../src/dailyNoteTemplate';
import { weekdayJa, weekdayJaLong } from '../src/utils';

const fields = {
	noteFormat: 'YYYY-MM-DD',
	holiday: null,
	rokuyo: '先勝',
	wareki: '令和8年',
};

describe('Japanese weekday of the note date', () => {
	it('uses short and long forms for Monday', () => {
		const monday = new Date(2026, 10, 16);
		expect(monday.getDay()).toBe(1);
		expect(weekdayJa(monday)).toBe('月');
		expect(weekdayJaLong(monday)).toBe('月曜日');
	});

	it('uses the clicked date rather than a fixed day', () => {
		const wednesday = new Date(2026, 10, 18);
		const sunday = new Date(2026, 10, 22);
		expect(weekdayJa(wednesday)).toBe('水');
		expect(weekdayJaLong(wednesday)).toBe('水曜日');
		expect(weekdayJa(sunday)).toBe('日');
		expect(weekdayJaLong(sunday)).toBe('日曜日');
	});

	it('substitutes both weekday variables without eating the long form', () => {
		const tuesday = new Date(2026, 10, 24);
		const out = applyDailyNoteTemplate(
			'{{date}} {{weekday_ja}} {{weekday_ja_long}} {{wareki}}',
			tuesday,
			fields,
		);
		expect(out).toBe('2026-11-24 火 火曜日 令和8年');
	});

	it('leaves existing variables working beside the new ones', () => {
		const date = new Date(2026, 10, 23);
		const out = applyDailyNoteTemplate(
			'{{date:YYYY}}/{{date:MM}}/{{date:DD}} {{weekday_ja}} {{holiday}} {{rokuyo}}',
			date,
			{ ...fields, holiday: '勤労感謝の日' },
		);
		expect(out).toBe('2026/11/23 月 勤労感謝の日 先勝');
	});
});
