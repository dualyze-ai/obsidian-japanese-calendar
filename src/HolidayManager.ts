import * as HolidayJp from '@holiday-jp/holiday_jp';

export interface KichijitsuOptions {
	tenshanichi: boolean;
	ichiryuManbai: boolean;
	fujoju: boolean;
}

export class HolidayManager {
	// Calibrated so that 2024-01-01 (甲子) yields eto index 0
	private readonly ETO_OFFSET = 27;

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

	getKichijitsu(date: Date, opts: KichijitsuOptions): string[] {
		const result: string[] = [];
		if (opts.tenshanichi && this.isTenshanichi(date)) result.push('天赦日');
		if (opts.ichiryuManbai && this.isIchiryuManbai(date)) result.push('一粒万倍');
		if (opts.fujoju && this.isFujoju(date)) result.push('不成就');
		return result;
	}

	private getEtoIndex(date: Date): number {
		const jd = this.julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
		return (jd + this.ETO_OFFSET) % 60;
	}

	private isTenshanichi(date: Date): boolean {
		const month = date.getMonth() + 1;
		const eto = this.getEtoIndex(date);
		// 冬(11-1月):甲子(0), 春(2-4月):戊寅(14), 夏(5-7月):甲午(30), 秋(8-10月):戊申(44)
		if (month === 1 || month >= 11) return eto === 0;
		if (month <= 4) return eto === 14;
		if (month <= 7) return eto === 30;
		return eto === 44;
	}

	private isIchiryuManbai(date: Date): boolean {
		const lunar = this.toLunarMonthDay(date);
		const lm = ((lunar.month - 1) % 6) + 1;
		const branch = this.getEtoIndex(date) % 12;
		// 旧暦月(1-6, 7-12で折り返し) と 日の地支 の対応表
		const table: Record<number, number[]> = {
			1: [0, 6], 2: [2, 6], 3: [0, 3],
			4: [3, 9], 5: [6, 9], 6: [3, 6],
		};
		return (table[lm] ?? []).includes(branch);
	}

	private isFujoju(date: Date): boolean {
		const lunar = this.toLunarMonthDay(date);
		const lm = ((lunar.month - 1) % 4) + 1;
		const branch = this.getEtoIndex(date) % 12;
		// 4ヶ月サイクル: 寅(2)→亥(11)→申(8)→巳(5)
		const table: Record<number, number> = { 1: 2, 2: 11, 3: 8, 4: 5 };
		return table[lm] === branch;
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
