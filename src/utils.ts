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

/** カレンダー上の「今日」を比較するためのローカル日付キー */
export function calendarDayKey(from: Dayjs = dayjs()): string {
	return from.format('YYYY-MM-DD');
}

/**
 * 前回描画した日と今の日付が違うときだけ true。
 * スリープ中は setTimeout の残り時間が進まないため、壁時計の日付で判定する。
 */
export function shouldRefreshTodayMarker(lastRenderedDay: string, now: Dayjs = dayjs()): boolean {
	return calendarDayKey(now) !== lastRenderedDay;
}

/**
 * 日付チェックの間隔。長時間の setTimeout はスリープで止まり、
 * 復帰後も「残り時間」だけ待ってしまう。短い間隔なら復帰後すぐ再判定できる。
 */
export const TODAY_MARKER_CHECK_MS = 30_000;
