import { getLanguage } from 'obsidian';

const ja: Record<string, string> = {
	modeMonth: '1ヶ月',
	modeTwoMonth: '2ヶ月',
	modeSixMonth: '6ヶ月',
	modeYear: '1年',
	today: '今日',
	openDailyNote: 'デイリーノートを開く',
	linkNote: 'ノートをリンク',
	openLinkedNote: 'リンクしたノートを開く',
	manageLinks: 'ノートリンクを管理',
	unlink: 'リンク解除',
	noLinkedNotes: 'リンクされたノートはありません',
	noteNotFound: 'ノートが見つかりません',
	selectNote: 'リンクするノートを選択',
	linkAdded: 'ノートをリンクしました',
	linkRemoved: 'ノートリンクを解除しました',
	tooltipLinkedNotes: 'リンクされたノート',
	goToToday: '今日へ移動',
	goToPrevious: '前に戻る',
	goToNext: '次へ進む',
	commandShowMonth: '月表示を開く',
	commandShowTwoMonth: '2か月表示を開く',
	commandShowSixMonth: '6か月表示を開く',
	commandShowYear: '年表示を開く',
};

const en: Record<string, string> = {
	modeMonth: '1 Month',
	modeTwoMonth: '2 Months',
	modeSixMonth: '6 Months',
	modeYear: '1 Year',
	today: 'Today',
	openDailyNote: 'Open daily note',
	linkNote: 'Link note',
	openLinkedNote: 'Open linked note',
	manageLinks: 'Manage note links',
	unlink: 'Unlink',
	noLinkedNotes: 'No linked notes',
	noteNotFound: 'Note not found',
	selectNote: 'Select a note to link',
	linkAdded: 'Note linked',
	linkRemoved: 'Note link removed',
	tooltipLinkedNotes: 'Linked notes',
	goToToday: 'Go to today',
	goToPrevious: 'Go to previous',
	goToNext: 'Go to next',
	commandShowMonth: 'Show month view',
	commandShowTwoMonth: 'Show 2-month view',
	commandShowSixMonth: 'Show 6-month view',
	commandShowYear: 'Show year view',
};

const strings = getLanguage().toLowerCase().startsWith('ja') ? ja : en;

export function getStr(key: string): string {
	return strings[key] ?? key;
}
