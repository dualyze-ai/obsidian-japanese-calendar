import dayjs from 'dayjs';
import { weekdayJa, weekdayJaLong } from './utils';

export interface DailyNoteTemplateFields {
	noteFormat: string;
	holiday: string | null;
	rokuyo: string | null;
	wareki: string;
}

/** クリックした日付（date）の値でテンプレート変数を置換する。 */
export function applyDailyNoteTemplate(tmpl: string, date: Date, fields: DailyNoteTemplateFields): string {
	const m = dayjs(date);
	const format = fields.noteFormat || 'YYYY-MM-DD';
	return tmpl
		.replace(/\{\{date\}\}/g, m.format(format))
		.replace(/\{\{date:YYYY\}\}/g, m.format('YYYY'))
		.replace(/\{\{date:MM\}\}/g, m.format('MM'))
		.replace(/\{\{date:DD\}\}/g, m.format('DD'))
		.replace(/\{\{holiday\}\}/g, fields.holiday ?? '')
		.replace(/\{\{rokuyo\}\}/g, fields.rokuyo ?? '')
		.replace(/\{\{weekday_ja_long\}\}/g, weekdayJaLong(date))
		.replace(/\{\{weekday_ja\}\}/g, weekdayJa(date))
		.replace(/\{\{wareki\}\}/g, fields.wareki);
}
