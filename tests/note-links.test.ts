import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoteLinkManager } from '../src/NoteLinkManager';
import type JapaneseCalendarPlugin from '../src/main';

function createMockPlugin(): JapaneseCalendarPlugin {
	return {
		settings: {
			noteLinks: {},
		},
		app: {
			vault: {
				getAbstractFileByPath: vi.fn(),
				getMarkdownFiles: vi.fn().mockReturnValue([]),
			},
		},
		saveSettings: vi.fn().mockResolvedValue(undefined),
	} as unknown as JapaneseCalendarPlugin;
}

describe('NoteLinkManager', () => {
	let manager: NoteLinkManager;
	let plugin: JapaneseCalendarPlugin;

	beforeEach(() => {
		plugin = createMockPlugin();
		manager = new NoteLinkManager(plugin);
	});

	describe('dateKey', () => {
		it('generates correct YYYY-MM-DD format', () => {
			expect(manager.dateKey(2026, 0, 1)).toBe('2026-01-01');
			expect(manager.dateKey(2026, 11, 31)).toBe('2026-12-31');
		});

		it('pads single-digit month and day', () => {
			expect(manager.dateKey(2026, 6, 5)).toBe('2026-07-05');
			expect(manager.dateKey(2026, 0, 9)).toBe('2026-01-09');
		});

		it('handles year boundary', () => {
			expect(manager.dateKey(2026, 11, 1)).toBe('2026-12-01');
			expect(manager.dateKey(2027, 0, 1)).toBe('2027-01-01');
		});
	});

	describe('dateKeyFromDate', () => {
		it('generates local date key without UTC shift', () => {
			// Using local timezone date
			const date = new Date(2026, 6, 20); // July 20, 2026 local time
			expect(manager.dateKeyFromDate(date)).toBe('2026-07-20');
		});

		it('handles last day of year', () => {
			const date = new Date(2026, 11, 31);
			expect(manager.dateKeyFromDate(date)).toBe('2026-12-31');
		});

		it('handles leap year', () => {
			const date = new Date(2028, 1, 29); // Feb 29, 2028
			expect(manager.dateKeyFromDate(date)).toBe('2028-02-29');
		});
	});

	describe('getLinks', () => {
		it('returns empty array for date with no links', () => {
			expect(manager.getLinks('2026-07-20')).toEqual([]);
		});

		it('returns links for date that has them', async () => {
			await manager.addLink('2026-07-20', 'Test Note.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Test Note.md']);
		});
	});

	describe('addLink', () => {
		it('adds a link to a date', async () => {
			await manager.addLink('2026-07-20', 'Test Note.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Test Note.md']);
			expect(plugin.saveSettings).toHaveBeenCalledOnce();
		});

		it('adds multiple links to the same date', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.addLink('2026-07-20', 'Note B.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Note A.md', 'Note B.md']);
		});

		it('prevents duplicate links', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.addLink('2026-07-20', 'Note A.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Note A.md']);
		});

		it('handles different dates independently', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.addLink('2026-07-21', 'Note B.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Note A.md']);
			expect(manager.getLinks('2026-07-21')).toEqual(['Note B.md']);
		});
	});

	describe('removeLink', () => {
		it('removes a single link', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.removeLink('2026-07-20', 'Note A.md');
			expect(manager.getLinks('2026-07-20')).toEqual([]);
		});

		it('removes the date key when last link is removed', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.removeLink('2026-07-20', 'Note A.md');
			expect((plugin.settings.noteLinks as Record<string, string[]>)['2026-07-20']).toBeUndefined();
		});

		it('removes only the specified link', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.addLink('2026-07-20', 'Note B.md');
			await manager.removeLink('2026-07-20', 'Note A.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Note B.md']);
		});

		it('does nothing when removing a non-existent link', async () => {
			await manager.addLink('2026-07-20', 'Note A.md');
			await manager.removeLink('2026-07-20', 'Non Existent.md');
			expect(manager.getLinks('2026-07-20')).toEqual(['Note A.md']);
		});
	});
});
