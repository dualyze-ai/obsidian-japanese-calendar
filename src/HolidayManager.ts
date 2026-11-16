import * as HolidayJp from '@holiday-jp/holiday_jp';
import {
	civilDate,
	etoIndex,
	seasonIndex,
	setsuMonthIndex,
	toLunar,
	type CivilDate,
} from './koyomi';

export interface KichijitsuOptions {
	tenshanichi: boolean;
	ichiryuManbai: boolean;
	fujoju: boolean;
	tora?: boolean;
	mi?: boolean;
}

const ROKUYO_NAMES: string[] = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'];

// 天赦日: 春=戊寅(14), 夏=甲午(30), 秋=戊申(44), 冬=甲子(0)
const TENSHA_ETO = [14, 30, 44, 0];

// 一粒万倍日: 節月 (0=寅月) × 日の十二支
const ICHIRYU_BRANCHES: ReadonlyArray<ReadonlyArray<number>> = [
	[1, 6],   // 寅月 丑・午
	[2, 9],   // 卯月 寅・酉
	[0, 3],   // 辰月 子・卯
	[3, 4],   // 巳月 卯・辰
	[5, 6],   // 午月 巳・午
	[6, 9],   // 未月 午・酉
	[0, 7],   // 申月 子・未
	[3, 8],   // 酉月 卯・申
	[6, 9],   // 戌月 午・酉
	[9, 10],  // 亥月 酉・戌
	[0, 11],  // 子月 子・亥
	[0, 3],   // 丑月 子・卯
];

// 不成就日: 旧暦の月に対する旧暦日（8日周期）。閏月は本月に準ずる。
const FUJOJU_DAYS: Record<number, ReadonlySet<number>> = {
	1: new Set([3, 11, 19, 27]),
	2: new Set([2, 10, 18, 26]),
	3: new Set([1, 9, 17, 25]),
	4: new Set([4, 12, 20, 28]),
	5: new Set([5, 13, 21, 29]),
	6: new Set([6, 14, 22, 30]),
	7: new Set([3, 11, 19, 27]),
	8: new Set([2, 10, 18, 26]),
	9: new Set([1, 9, 17, 25]),
	10: new Set([4, 12, 20, 28]),
	11: new Set([5, 13, 21, 29]),
	12: new Set([6, 14, 22, 30]),
};

export class HolidayManager {
	getHolidayName(date: Date): string | null {
		const holidays = HolidayJp.between(date, date);
		if (holidays.length === 0) return null;
		const h = holidays[0];
		return h ? (h.name ?? null) : null;
	}

	getRokuyo(date: Date): string {
		const lunar = toLunar(civilDate(date));
		if (!lunar) return '';
		return ROKUYO_NAMES[(lunar.month + lunar.day) % 6] ?? '大安';
	}

	getKichijitsu(date: Date, opts: KichijitsuOptions): string[] {
		const c = civilDate(date);
		const eto = etoIndex(c.y, c.m, c.d);
		const branch = eto % 12;
		const result: string[] = [];
		if (opts.tenshanichi && this.isTenshanichi(c, eto)) result.push('天赦日');
		if (opts.ichiryuManbai && this.isIchiryuManbai(c, branch)) result.push('一粒万倍');
		if (opts.tora && branch === 2) result.push('寅の日');
		if (opts.mi && branch === 5) result.push('巳の日');
		if (opts.mi && eto === 5) result.push('己巳の日');
		if (opts.fujoju && this.isFujoju(c)) result.push('不成就');
		return result;
	}

	private isTenshanichi(c: CivilDate, eto: number): boolean {
		const season = seasonIndex(c);
		if (season === null) return false;
		return eto === (TENSHA_ETO[season] ?? -1);
	}

	private isIchiryuManbai(c: CivilDate, branch: number): boolean {
		const sm = setsuMonthIndex(c);
		if (sm === null) return false;
		return (ICHIRYU_BRANCHES[sm] ?? []).includes(branch);
	}

	private isFujoju(c: CivilDate): boolean {
		const lunar = toLunar(c);
		if (!lunar) return false;
		return FUJOJU_DAYS[lunar.month]?.has(lunar.day) ?? false;
	}
}
