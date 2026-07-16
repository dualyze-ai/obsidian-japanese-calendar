import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toWareki, getDayLabel } from '../src/utils';

describe('toWareki', () => {
	it('returns Reiwa for 2019 and later', () => {
		expect(toWareki(2019)).toBe('令和1年');
		expect(toWareki(2020)).toBe('令和2年');
		expect(toWareki(2026)).toBe('令和8年');
	});

	it('returns Heisei for 1989-2018', () => {
		expect(toWareki(1989)).toBe('平成1年');
		expect(toWareki(1990)).toBe('平成2年');
		expect(toWareki(2018)).toBe('平成30年');
	});

	it('returns Showa for 1926-1988', () => {
		expect(toWareki(1926)).toBe('昭和1年');
		expect(toWareki(1927)).toBe('昭和2年');
		expect(toWareki(1988)).toBe('昭和63年');
	});

	it('returns year for dates before 1926', () => {
		expect(toWareki(1925)).toBe('1925年');
		expect(toWareki(1900)).toBe('1900年');
	});
});

describe('getDayLabel', () => {
	it('returns correct Japanese day labels', () => {
		expect(getDayLabel(0)).toBe('日');
		expect(getDayLabel(1)).toBe('月');
		expect(getDayLabel(2)).toBe('火');
		expect(getDayLabel(3)).toBe('水');
		expect(getDayLabel(4)).toBe('木');
		expect(getDayLabel(5)).toBe('金');
		expect(getDayLabel(6)).toBe('土');
	});

	it('falls back for invalid index', () => {
		expect(getDayLabel(7)).toBe('日');
		expect(getDayLabel(-1)).toBe('日');
	});
});
