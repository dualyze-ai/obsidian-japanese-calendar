export { getStr } from './i18n';
import { getLanguage } from 'obsidian';
import dayjs, { Dayjs } from 'dayjs';

export function toWareki(year: number): string {
	if (year >= 2019) return `令和${year - 2018}年`;
	if (year >= 1989) return `平成${year - 1988}年`;
	if (year >= 1926) return `昭和${year - 1925}年`;
	return `${year}年`;
}

export function getDayLabel(index: number): string {
	const labels = ['日', '月', '火', '水', '木', '金', '土'];
	return labels[index] ?? '日';
}

export function detectLocale(): 'ja' | 'en' {
	return getLanguage().toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

/** 指定時刻（省略時は現在時刻）から次の0時までのミリ秒数を返す */
export function msUntilNextMidnight(from: Dayjs = dayjs()): number {
	const nextMidnight = from.add(1, 'day').startOf('day');
	return nextMidnight.diff(from);
}
