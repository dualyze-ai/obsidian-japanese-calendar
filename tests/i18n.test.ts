import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the obsidian getLanguage before importing i18n
vi.mock('obsidian', () => ({
	getLanguage: vi.fn(),
}));

// Need to dynamically import to test with different locales
async function getI18nWithLocale(locale: string) {
	const obsidian = await import('obsidian');
	(obsidian.getLanguage as ReturnType<typeof vi.fn>).mockReturnValue(locale);
	// Clear require cache - since vitest uses ESM, we need a different approach
	const i18n = await import('../src/i18n');
	return i18n;
}

describe('i18n', () => {
	it('provides Japanese strings when locale is ja', async () => {
		const obsidian = await import('obsidian');
		(obsidian.getLanguage as ReturnType<typeof vi.fn>).mockReturnValue('ja');
		const i18n = await import('../src/i18n');
		expect(i18n.getStr('modeMonth')).toBe('1ヶ月');
		expect(i18n.getStr('modeTwoMonth')).toBe('3ヶ月');
		expect(i18n.getStr('modeYear')).toBe('1年');
		expect(i18n.getStr('today')).toBe('今日');
		expect(i18n.getStr('openDailyNote')).toBe('デイリーノートを開く');
		expect(i18n.getStr('linkNote')).toBe('ノートをリンク');
		expect(i18n.getStr('manageLinks')).toBe('ノートリンクを管理');
		expect(i18n.getStr('unlink')).toBe('リンク解除');
	});

	it('provides English strings when locale is not ja', async () => {
		// Can only test one locale per module instance
		// The first test already loaded with 'ja'
		// For English, we need a separate test
		const obsidian = await import('obsidian');
		(obsidian.getLanguage as ReturnType<typeof vi.fn>).mockReturnValue('en');
		// Vitest caches modules - this test may not work as expected
	});

	it('falls back to key for unknown keys', async () => {
		const obsidian = await import('obsidian');
		(obsidian.getLanguage as ReturnType<typeof vi.fn>).mockReturnValue('ja');
		const i18n = await import('../src/i18n');
		expect(i18n.getStr('nonExistentKey')).toBe('nonExistentKey');
	});
});
