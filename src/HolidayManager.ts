import * as HolidayJp from '@holiday-jp/holiday_jp';

export class HolidayManager {
	getHolidayName(date: Date): string | null {
		const holidays = HolidayJp.between(date, date);
		if (holidays.length === 0) return null;
		const h = holidays[0];
		return h ? (h.name ?? null) : null;
	}

	getRokuyo(date: Date): string {
		const lunar = this.toLunarMonthDay(date);
		const names: string[] = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];
		return names[(lunar.month + lunar.day) % 6] ?? '大安';
	}

	private toLunarMonthDay(date: Date): { month: number; day: number } {
		const jd = this.julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
		const elapsed = jd - 2343155;
		const month = Math.floor(elapsed / 29.530589) % 12 + 1;
		const day = Math.floor(elapsed % 29.530589) + 1;
		return { month, day };
	}

	private julianDay(y: number, m: number, d: number): number {
		const a = Math.floor((14 - m) / 12);
		const yr = y + 4800 - a;
		const mo = m + 12 * a - 3;
		return d + Math.floor((153 * mo + 2) / 5) + 365 * yr +
			Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
	}
}
