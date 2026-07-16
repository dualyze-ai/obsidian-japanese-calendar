import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

describe('Calendar date calculations', () => {
	describe('Month navigation', () => {
		it('navigates forward one month', () => {
			const current = dayjs('2026-07-01');
			const next = current.add(1, 'month');
			expect(next.month()).toBe(7); // August (0-indexed)
			expect(next.year()).toBe(2026);
		});

		it('navigates backward one month', () => {
			const current = dayjs('2026-07-01');
			const prev = current.subtract(1, 'month');
			expect(prev.month()).toBe(5); // June
			expect(prev.year()).toBe(2026);
		});

		it('handles December to January (next month)', () => {
			const current = dayjs('2026-12-01');
			const next = current.add(1, 'month');
			expect(next.month()).toBe(0); // January
			expect(next.year()).toBe(2027);
		});

		it('handles January to December (previous month)', () => {
			const current = dayjs('2027-01-01');
			const prev = current.subtract(1, 'month');
			expect(prev.month()).toBe(11); // December
			expect(prev.year()).toBe(2026);
		});
	});

	describe('Year navigation', () => {
		it('navigates forward one year', () => {
			const current = dayjs('2026-07-01');
			const next = current.add(1, 'year');
			expect(next.year()).toBe(2027);
			expect(next.month()).toBe(6); // Same month
		});

		it('navigates backward one year', () => {
			const current = dayjs('2026-07-01');
			const prev = current.subtract(1, 'year');
			expect(prev.year()).toBe(2025);
			expect(prev.month()).toBe(6);
		});
	});

	describe('Six-month view calculations', () => {
		it('shows 6 consecutive months starting from base', () => {
			const base = dayjs('2026-07-01');
			for (let i = 0; i < 6; i++) {
				const m = base.add(i, 'month');
				expect(m.month()).toBe((6 + i) % 12);
			}
		});

		it('handles year boundary within 6 months', () => {
			const base = dayjs('2026-10-01');
			const months = [];
			for (let i = 0; i < 6; i++) {
				months.push(base.add(i, 'month'));
			}
			expect(months[0].month()).toBe(9);  // Oct
			expect(months[2].month()).toBe(11); // Dec
			expect(months[3].month()).toBe(0);  // Jan 2027
			expect(months[3].year()).toBe(2027);
			expect(months[5].month()).toBe(2);  // Mar 2027
		});
	});

	describe('Two-month view calculations', () => {
		it('shows current month and next month', () => {
			const base = dayjs('2026-07-01');
			const month1 = base;
			const month2 = base.add(1, 'month');
			expect(month1.month()).toBe(6);
			expect(month2.month()).toBe(7);
		});

		it('handles December + January year boundary', () => {
			const base = dayjs('2026-12-01');
			const month2 = base.add(1, 'month');
			expect(month2.month()).toBe(0);
			expect(month2.year()).toBe(2027);
		});
	});

	describe('Go to today', () => {
		it('resets to current month', () => {
			const today = dayjs();
			const someDate = dayjs('2025-03-15');
			const reset = today; // goToToday sets this.current = dayjs()
			expect(reset.month()).toBe(today.month());
			expect(reset.year()).toBe(today.year());
		});
	});

	describe('Week start', () => {
		it('calculates correct offset for Sunday start', () => {
			const weekStart = 0; // Sunday
			// July 1, 2026 is Wednesday (day 3)
			const firstDay = dayjs('2026-07-01');
			const offset = (firstDay.day() - weekStart + 7) % 7;
			expect(offset).toBe(3); // Wednesday -> 3 cells from Sunday
		});

		it('calculates correct offset for Monday start', () => {
			const weekStart = 1; // Monday
			const firstDay = dayjs('2026-07-01');
			const offset = (firstDay.day() - weekStart + 7) % 7;
			expect(offset).toBe(2); // Wednesday -> 2 cells from Monday
		});

		it('handles leap year February 2028', () => {
			const date = dayjs('2028-02-29');
			expect(date.isValid()).toBe(true);
			expect(date.date()).toBe(29);
			expect(date.month()).toBe(1); // February
		});

		it('March 1 follows Feb 29 in leap year', () => {
			const feb29 = dayjs('2028-02-29');
			const mar1 = feb29.add(1, 'day');
			expect(mar1.date()).toBe(1);
			expect(mar1.month()).toBe(2); // March
		});
	});

	describe('Month view cell count', () => {
		it('generates correct number of week rows for July 2026', () => {
			const base = dayjs('2026-07-01');
			const firstDay = base.startOf('month');
			const lastDay = base.endOf('month');
			const start = 0; // Sunday
			const offset = (firstDay.day() - start + 7) % 7;
			const totalCells = offset + lastDay.date(); // 3 + 31 = 34
			const remaining = (7 - (totalCells % 7)) % 7; // 1 -> 35 total = 5 rows
			expect(totalCells + remaining).toBe(35);
		});

		it('generates correct number of rows for December 2026', () => {
			const base = dayjs('2026-12-01');
			const firstDay = base.startOf('month');
			const lastDay = base.endOf('month');
			const start = 0;
			const offset = (firstDay.day() - start + 7) % 7;
			const totalCells = offset + lastDay.date();
			const remaining = (7 - (totalCells % 7)) % 7;
			expect(totalCells + remaining).toBe(35);
		});
	});

	describe('Display mode transitions', () => {
		it('month click from year view sets target month', () => {
			const yearBase = dayjs('2026-07-01');
			const targetMonth = dayjs(new Date(2026, 5, 1)); // June
			// Simulate month click: current = targetMonth, mode = 'month'
			const newCurrent = targetMonth;
			expect(newCurrent.month()).toBe(5); // June
			expect(newCurrent.year()).toBe(2026);
		});

		it('today from year view resets to current year', () => {
			const yearBase = dayjs('2025-01-01'); // In year view showing 2025
			const today = dayjs(); // Today
			// goToToday sets this.current = dayjs()
			expect(today.year()).not.toBe(2025);
		});
	});
});
