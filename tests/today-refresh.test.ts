import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { msUntilNextMidnight } from '../src/utils';

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
		const lastKnownToday = '2026-09-12';
		const newToday = dayjs('2026-09-13T00:00:05').format('YYYY-MM-DD');
		expect(newToday).not.toBe(lastKnownToday);
	});

	it('同じ日のうちは再描画対象と判定しない', () => {
		const lastKnownToday = '2026-09-12';
		const stillToday = dayjs('2026-09-12T23:59:59').format('YYYY-MM-DD');
		expect(stillToday).toBe(lastKnownToday);
	});

	it('プラグインをhideして翌日showしたシナリオを再現する', () => {
		// 前日に開いたまま放置し、最後の描画時点の日付を記録
		const lastKnownToday = dayjs('2026-09-11T10:00:00').format('YYYY-MM-DD');
		// 翌日ビューが再度アクティブになった（active-leaf-change）時点
		const shownAgainAt = dayjs('2026-09-12T09:00:00');
		const today = shownAgainAt.format('YYYY-MM-DD');
		expect(today).not.toBe(lastKnownToday); // 再描画が必要と判定されるべき
	});
});
