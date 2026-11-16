import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HolidayManager } from '../src/HolidayManager';
import { etoIndex, toLunar, KOYOMI_MIN, KOYOMI_MAX, seasonIndex, setsuMonthIndex } from '../src/koyomi';

const fixturePath = join(dirname(fileURLToPath(import.meta.url)), 'fixtures/arachne-2025-2026.json');
const arachne: Record<string, Record<string, { d: number; r: string; k: string[] }[]>> =
	JSON.parse(readFileSync(fixturePath, 'utf8'));

const holidays = new HolidayManager();
const allOpts = {
	tenshanichi: true,
	ichiryuManbai: true,
	fujoju: true,
	tora: true,
	mi: true,
};

function at(y: number, m: number, d: number): Date {
	return new Date(y, m - 1, d);
}

describe('eto (sexagenary cycle)', () => {
	it('anchors 2024-01-01 as 甲子 (0)', () => {
		expect(etoIndex(2024, 1, 1)).toBe(0);
	});

	it('anchors 2000-01-01 as 戊午 (54)', () => {
		expect(etoIndex(2000, 1, 1)).toBe(54);
	});

	it('gives 丙戌 (22) on 2026-11-08', () => {
		expect(etoIndex(2026, 11, 8)).toBe(22);
	});

	it('gives 辛巳 (17) on 2026-11-03 (巳の日)', () => {
		expect(etoIndex(2026, 11, 3)).toBe(17);
		expect(etoIndex(2026, 11, 3) % 12).toBe(5);
	});
});

describe('旧暦 conversion', () => {
	it('maps 2026-11-08 to 旧暦 9月29日 and 2026-11-09 to 10月1日', () => {
		expect(toLunar({ y: 2026, m: 11, d: 8 })).toEqual({ month: 9, day: 29, leap: false });
		expect(toLunar({ y: 2026, m: 11, d: 9 })).toEqual({ month: 10, day: 1, leap: false });
	});

	it('treats 2025-07-25 as 閏6月1日 (朔/処暑 same-day leap)', () => {
		expect(toLunar({ y: 2025, m: 7, d: 25 })).toEqual({ month: 6, day: 1, leap: true });
		expect(toLunar({ y: 2025, m: 8, d: 23 })).toEqual({ month: 7, day: 1, leap: false });
	});

	it('returns null outside the supported range', () => {
		expect(toLunar({ y: 1899, m: 12, d: 2 })).toBeNull();
		expect(toLunar({ y: 2100, m: 12, d: 1 })).toBeNull();
		expect(toLunar(KOYOMI_MIN)).not.toBeNull();
		expect(toLunar(KOYOMI_MAX)).not.toBeNull();
	});
});

describe('節月 and 天赦日 seasons', () => {
	it('starts 亥月 / winter on 立冬 2026-11-07', () => {
		// 戌月 index 8, 亥月 index 9
		expect(setsuMonthIndex({ y: 2026, m: 11, d: 6 })).toBe(8);
		expect(setsuMonthIndex({ y: 2026, m: 11, d: 7 })).toBe(9);
		expect(seasonIndex({ y: 2026, m: 11, d: 6 })).toBe(2);
		expect(seasonIndex({ y: 2026, m: 11, d: 7 })).toBe(3);
	});
});

describe('Rokuyo and Kichijitsu vs Arachne 2025–2026', () => {
	for (const year of Object.keys(arachne).map(Number).sort()) {
		it(`matches every day of ${year}`, () => {
			const months = arachne[String(year)];
			if (!months) throw new Error('missing year');
			const mismatches: string[] = [];
			for (const [monthStr, days] of Object.entries(months)) {
				const month = Number(monthStr);
				for (const row of days) {
					const date = at(year, month, row.d);
					const rokuyo = holidays.getRokuyo(date);
					const kichi = holidays.getKichijitsu(date, allOpts);
					if (rokuyo !== row.r || JSON.stringify(kichi) !== JSON.stringify(row.k)) {
						mismatches.push(
							`${year}-${String(month).padStart(2, '0')}-${String(row.d).padStart(2, '0')}` +
							` got=${rokuyo}[${kichi.join(',')}] expected=${row.r}[${row.k.join(',')}]`,
						);
					}
				}
			}
			expect(mismatches, mismatches.slice(0, 10).join('\n')).toEqual([]);
		});
	}

	it('leaves rokuyo and lunar-based days blank outside the table', () => {
		for (const date of [at(1899, 12, 2), at(1890, 1, 1), at(2100, 12, 1), at(2200, 6, 1)]) {
			expect(holidays.getRokuyo(date)).toBe('');
			const labels = holidays.getKichijitsu(date, allOpts);
			expect(labels).not.toContain('天赦日');
			expect(labels).not.toContain('一粒万倍');
			expect(labels).not.toContain('不成就');
		}
		expect(holidays.getRokuyo(at(KOYOMI_MIN.y, KOYOMI_MIN.m, KOYOMI_MIN.d))).not.toBe('');
		expect(holidays.getRokuyo(at(KOYOMI_MAX.y, KOYOMI_MAX.m, KOYOMI_MAX.d))).not.toBe('');
	});

	it('still reports 寅の日 from the sexagenary cycle outside the lunar table', () => {
		const date = at(1800, 1, 1);
		const labels = holidays.getKichijitsu(date, allOpts);
		if (etoIndex(1800, 1, 1) % 12 === 2) expect(labels).toContain('寅の日');
		else expect(labels).not.toContain('寅の日');
		expect(labels).not.toContain('不成就');
	});

	it('assigns a lunar day of 1–30 on every civil date in range', () => {
		let y = KOYOMI_MIN.y;
		let m = KOYOMI_MIN.m;
		let d = KOYOMI_MIN.d;
		let prev: { month: number; day: number } | null = null;
		const problems: string[] = [];
		for (;;) {
			const lunar = toLunar({ y, m, d });
			const key = `${y}-${m}-${d}`;
			if (!lunar || lunar.day < 1 || lunar.day > 30) {
				problems.push(`${key} lunar=${JSON.stringify(lunar)}`);
			} else if (prev && lunar.day !== prev.day + 1) {
				if (lunar.day !== 1 || (prev.day !== 29 && prev.day !== 30)) {
					problems.push(`${key} day=${lunar.day} after ${prev.day}`);
				}
			}
			if (lunar) prev = lunar;
			if (y === KOYOMI_MAX.y && m === KOYOMI_MAX.m && d === KOYOMI_MAX.d) break;
			const next = new Date(Date.UTC(y, m - 1, d));
			next.setUTCDate(next.getUTCDate() + 1);
			y = next.getUTCFullYear();
			m = next.getUTCMonth() + 1;
			d = next.getUTCDate();
			if (problems.length > 8) break;
		}
		expect(problems, problems.join('\n')).toEqual([]);
	});

	it('matches the November 2026 examples from issue #6', () => {
		expect(holidays.getRokuyo(at(2026, 11, 8))).toBe('先勝');
		expect(holidays.getRokuyo(at(2026, 11, 9))).toBe('仏滅');
		expect(holidays.getRokuyo(at(2026, 11, 10))).toBe('大安');
		expect(holidays.getKichijitsu(at(2026, 11, 3), allOpts)).toEqual(['巳の日']);
		expect(holidays.getKichijitsu(at(2026, 11, 4), allOpts)).toEqual(['一粒万倍', '不成就']);
		expect(holidays.getKichijitsu(at(2026, 11, 8), allOpts)).toEqual(['一粒万倍']);
		expect(holidays.getKichijitsu(at(2026, 11, 12), allOpts)).toEqual(['寅の日', '不成就']);
		expect(holidays.getKichijitsu(at(2026, 11, 16), allOpts)).toEqual([]);
		expect(holidays.getKichijitsu(at(2026, 11, 20), allOpts)).toEqual(['一粒万倍', '不成就']);
		expect(holidays.getKichijitsu(at(2026, 11, 24), allOpts)).toEqual(['寅の日']);
		expect(holidays.getKichijitsu(at(2026, 11, 28), allOpts)).toEqual(['不成就']);
	});
});
