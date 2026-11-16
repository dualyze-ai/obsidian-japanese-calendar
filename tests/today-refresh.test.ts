import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { calendarDayKey, msUntilNextMidnight, shouldRefreshTodayMarker, TODAY_MARKER_CHECK_MS, viewBecameVisible } from '../src/utils';

describe('msUntilNextMidnight', () => {
	it('日中の時刻から次の0時までの残り時間を返す', () => {
		const now = dayjs('2026-09-12T15:30:00');
		const ms = msUntilNextMidnight(now);
		expect(ms).toBe(dayjs('2026-09-13T00:00:00').diff(now));
		expect(ms).toBe(8.5 * 60 * 60 * 1000);
	});

	it('0時直後に呼んでもほぼ24時間を返す', () => {
		const now = dayjs('2026-09-12T00:00:01');
		const ms = msUntilNextMidnight(now);
		expect(ms).toBeLessThan(24 * 60 * 60 * 1000);
		expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000 + 59 * 60 * 1000);
	});

	it('23時59分台でも正しく残り時間を返す', () => {
		const now = dayjs('2026-09-30T23:59:00');
		const ms = msUntilNextMidnight(now);
		expect(ms).toBe(60 * 1000);
	});

	it('月・年をまたぐ日付でも正しく計算する', () => {
		const now = dayjs('2026-12-31T23:30:00');
		const ms = msUntilNextMidnight(now);
		expect(ms).toBe(30 * 60 * 1000);
	});
});

describe('日付変更検知ロジック（"今日"マークの再描画トリガー）', () => {
	it('日付が変わっていれば再描画対象と判定する', () => {
		expect(shouldRefreshTodayMarker('2026-09-12', dayjs('2026-09-13T00:00:05'))).toBe(true);
	});

	it('同じ日のうちは再描画対象と判定しない', () => {
		expect(shouldRefreshTodayMarker('2026-09-12', dayjs('2026-09-12T23:59:59'))).toBe(false);
	});

	it('プラグインをhideして翌日showしたシナリオを再現する', () => {
		const lastKnownToday = calendarDayKey(dayjs('2026-09-11T10:00:00'));
		const shownAgainAt = dayjs('2026-09-12T09:00:00');
		expect(shouldRefreshTodayMarker(lastKnownToday, shownAgainAt)).toBe(true);
	});

	it('スリープをまたいで翌朝開いたときは前日のマークを更新する', () => {
		const paintedBeforeSleep = calendarDayKey(dayjs('2026-11-16T22:40:00'));
		const afterWake = dayjs('2026-11-17T08:05:00');
		expect(shouldRefreshTodayMarker(paintedBeforeSleep, afterWake)).toBe(true);
		expect(calendarDayKey(afterWake)).toBe('2026-11-17');
	});

	it('日付判定は表示中の月を入力にしない', () => {
		const viewedMonth = dayjs('2026-10-01');
		const afterWake = dayjs('2026-11-17T08:05:00');
		expect(shouldRefreshTodayMarker('2026-11-16', afterWake)).toBe(true);
		expect(viewedMonth.format('YYYY-MM')).toBe('2026-10');
	});

	it('開いたままのビューは1分ごとに日付を見比べる', () => {
		expect(TODAY_MARKER_CHECK_MS).toBe(60_000);
	});

	it('非表示から再表示されたときは日付を見比べる', () => {
		expect(viewBecameVisible(false, true)).toBe(true);
		expect(viewBecameVisible(true, true)).toBe(false);
		expect(viewBecameVisible(false, false)).toBe(false);
	});

	it('別タブに隠して翌日開くと新しい今日になる', () => {
		const lastPainted = calendarDayKey(dayjs('2026-11-16T21:00:00'));
		const shownNextDay = dayjs('2026-11-17T09:30:00');
		expect(viewBecameVisible(false, true)).toBe(true);
		expect(shouldRefreshTodayMarker(lastPainted, shownNextDay)).toBe(true);
	});
});
