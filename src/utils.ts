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

const WEEKDAY_JA_LONG = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];

/** ノートの日付の曜日。界面言語に依存しない。 */
export function weekdayJa(date: Date): string {
	return getDayLabel(date.getDay());
}

export function weekdayJaLong(date: Date): string {
	return WEEKDAY_JA_LONG[date.getDay()] ?? '日曜日';
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
 * 開いたままのカレンダーを日付変更で更新する間隔。
 * 0時までの一回限りの setTimeout はスリープ中に進まないので、
 * 1分ごとに壁時計の日付を見比べる。
 */
export const TODAY_MARKER_CHECK_MS = 60_000;

/** 非表示だったビューが再び表示された */
export function viewBecameVisible(wasShown: boolean, isShown: boolean): boolean {
	return isShown && !wasShown;
}
