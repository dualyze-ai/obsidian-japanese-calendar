/**
 * Japanese lunisolar calendar (現代の旧暦再構成) and 二十四節気 lookups.
 *
 * 朔 and 節気 instants are tabulated in JST from Skyfield + JPL DE440s
 * (verified against 国立天文台 暦要項 2025–2026, max error < 1 minute).
 *
 * Month numbers and leap months are assigned with the civil-date (日付)
 * method used by common Japanese almanacs: a 中気 belongs to the lunar
 * month that starts on its JST calendar date. When 朔 and 中気 fall on
 * the same JST day, the 中気 belongs to the new month.
 *
 * Supported Gregorian dates (JST civil date): 1899-12-03 .. 2100-11-30.
 */

import {
	FIRST_SEKKI_LON,
	KOYOMI_EPOCH_UTC_MS,
	SAKU_COUNT,
	SAKU_PACKED,
	SEKKI_COUNT,
	SEKKI_PACKED,
} from './koyomi-data';

export interface CivilDate {
	y: number;
	m: number;
	d: number;
}

export interface LunarDate {
	month: number;
	day: number;
	leap: boolean;
}

export const KOYOMI_MIN: CivilDate = { y: 1899, m: 12, d: 3 };
export const KOYOMI_MAX: CivilDate = { y: 2100, m: 11, d: 30 };

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 節 longitudes, index 0 = 寅月 (立春 315°)
const SETSU_LONS = [315, 345, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285];

function decodeBase64(s: string): Uint8Array {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function unpackDeltas(packed: string, count: number): number[] {
	const bytes = decodeBase64(packed);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const first = view.getUint32(0, true);
	const out: number[] = [first];
	let offset = 4;
	let prev = first;
	for (let i = 1; i < count; i++) {
		prev += view.getUint16(offset, true);
		out.push(prev);
		offset += 2;
	}
	return out;
}

function minutesToJst(mins: number): CivilDate {
	const jst = new Date(KOYOMI_EPOCH_UTC_MS + mins * 60_000 + JST_OFFSET_MS);
	return { y: jst.getUTCFullYear(), m: jst.getUTCMonth() + 1, d: jst.getUTCDate() };
}

function cmpDate(a: CivilDate, b: CivilDate): number {
	if (a.y !== b.y) return a.y - b.y;
	if (a.m !== b.m) return a.m - b.m;
	return a.d - b.d;
}

export function civilDate(date: Date): CivilDate {
	return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

export function isInKoyomiRange(c: CivilDate): boolean {
	return cmpDate(c, KOYOMI_MIN) >= 0 && cmpDate(c, KOYOMI_MAX) <= 0;
}

export function julianDayNumber(y: number, m: number, d: number): number {
	const a = Math.floor((14 - m) / 12);
	const yr = y + 4800 - a;
	const mo = m + 12 * a - 3;
	return d + Math.floor((153 * mo + 2) / 5) + 365 * yr +
		Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045;
}

/** 日の六十干支 index. 甲子=0. 2024-01-01 and 2000-01-01=戊午(54) are anchors. */
export function etoIndex(y: number, m: number, d: number): number {
	// JDN(2024-01-01)=2460311; (2460311 + 49) % 60 === 0 (甲子)
	return ((julianDayNumber(y, m, d) + 49) % 60 + 60) % 60;
}

function lastIndexOnOrBefore(dates: CivilDate[], target: CivilDate): number {
	let lo = 0;
	let hi = dates.length - 1;
	let ans = 0;
	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const midDate = dates[mid];
		if (midDate !== undefined && cmpDate(midDate, target) <= 0) {
			ans = mid;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}
	return ans;
}

interface Tables {
	sakuMins: number[];
	sakuDates: CivilDate[];
	sekkiMins: number[];
	sekkiDates: CivilDate[];
	sekkiLons: number[];
	lunarMonth: number[];
	lunarLeap: boolean[];
}

let tables: Tables | null = null;

function getTables(): Tables {
	if (tables) return tables;

	const sakuMins = unpackDeltas(SAKU_PACKED, SAKU_COUNT);
	const sakuDates = sakuMins.map(minutesToJst);
	const sekkiMins = unpackDeltas(SEKKI_PACKED, SEKKI_COUNT);
	const sekkiDates = sekkiMins.map(minutesToJst);
	const sekkiLons: number[] = [];
	for (let i = 0; i < SEKKI_COUNT; i++) {
		sekkiLons.push((FIRST_SEKKI_LON + 15 * i) % 360);
	}

	const chukiIdx: number[] = [];
	const toujiIdx: number[] = [];
	for (let i = 0; i < SEKKI_COUNT; i++) {
		const lon = sekkiLons[i] ?? 0;
		if (lon % 30 === 0) chukiIdx.push(i);
		if (lon === 270) toujiIdx.push(i);
	}

	const lunarMonth = new Array<number>(SAKU_COUNT).fill(0);
	const lunarLeap = new Array<boolean>(SAKU_COUNT).fill(false);

	const lastSakuOnOrBefore = (c: CivilDate): number => lastIndexOnOrBefore(sakuDates, c);

	const hasChuki = (si: number): boolean => {
		const a = sakuDates[si];
		const b = sakuDates[si + 1];
		if (!a || !b) return false;
		for (const ci of chukiIdx) {
			const c = sekkiDates[ci];
			if (!c) continue;
			if (cmpDate(c, a) >= 0 && cmpDate(c, b) < 0) return true;
			if (cmpDate(c, b) >= 0) break;
		}
		return false;
	};

	for (let t = 0; t < toujiIdx.length - 1; t++) {
		const tj0 = toujiIdx[t];
		const tj1 = toujiIdx[t + 1];
		const d0 = tj0 !== undefined ? sekkiDates[tj0] : undefined;
		const d1 = tj1 !== undefined ? sekkiDates[tj1] : undefined;
		if (!d0 || !d1) continue;
		const s0 = lastSakuOnOrBefore(d0);
		const s1 = lastSakuOnOrBefore(d1);
		if (s1 + 1 >= SAKU_COUNT) continue;
		const n = s1 - s0;
		if (n === 12) {
			const nums = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			for (let k = 0; k < n; k++) {
				const si = s0 + k;
				const month = nums[k];
				if (month !== undefined) lunarMonth[si] = month;
			}
		} else if (n === 13) {
			const seq = [11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			let seqI = 0;
			let leapUsed = false;
			for (let k = 0; k < n; k++) {
				const si = s0 + k;
				if (k === 0) {
					lunarMonth[si] = 11;
					seqI = 1;
				} else if (!leapUsed && !hasChuki(si)) {
					lunarMonth[si] = lunarMonth[si - 1] ?? 0;
					lunarLeap[si] = true;
					leapUsed = true;
				} else {
					const month = seq[seqI];
					if (month !== undefined) lunarMonth[si] = month;
					seqI += 1;
				}
			}
		}
	}

	tables = { sakuMins, sakuDates, sekkiMins, sekkiDates, sekkiLons, lunarMonth, lunarLeap };
	return tables;
}

function daysBetween(a: CivilDate, b: CivilDate): number {
	const ja = julianDayNumber(a.y, a.m, a.d);
	const jb = julianDayNumber(b.y, b.m, b.d);
	return jb - ja;
}

export function toLunar(c: CivilDate): LunarDate | null {
	if (!isInKoyomiRange(c)) return null;
	const t = getTables();
	const si = lastIndexOnOrBefore(t.sakuDates, c);
	const month = t.lunarMonth[si] ?? 0;
	const start = t.sakuDates[si];
	if (month === 0 || !start) return null;
	return {
		month,
		day: daysBetween(start, c) + 1,
		leap: t.lunarLeap[si] ?? false,
	};
}

function lastSekkiOnOrBefore(c: CivilDate, pred: (lon: number) => boolean): number | null {
	const t = getTables();
	const end = lastIndexOnOrBefore(t.sekkiDates, c);
	for (let i = end; i >= 0; i--) {
		const lon = t.sekkiLons[i];
		if (lon !== undefined && pred(lon)) return lon;
	}
	return null;
}

/**
 * 節月 index: 0=寅月 (立春〜啓蟄前日), 1=卯月, …, 11=丑月.
 * The JST date of a 節入り belongs to the new 節月.
 */
export function setsuMonthIndex(c: CivilDate): number | null {
	if (!isInKoyomiRange(c)) return null;
	const lon = lastSekkiOnOrBefore(c, l => l % 30 === 15);
	if (lon === null) return null;
	const idx = SETSU_LONS.indexOf(lon);
	return idx < 0 ? null : idx;
}

/**
 * Season for 天赦日: 0=春(立春〜立夏前日), 1=夏, 2=秋, 3=冬.
 * The JST date of 立春/立夏/立秋/立冬 belongs to the new season.
 */
export function seasonIndex(c: CivilDate): number | null {
	if (!isInKoyomiRange(c)) return null;
	const lon = lastSekkiOnOrBefore(c, l => l === 315 || l === 45 || l === 135 || l === 225);
	if (lon === 315) return 0;
	if (lon === 45) return 1;
	if (lon === 135) return 2;
	if (lon === 225) return 3;
	return null;
}

/** Force table initialization (useful for tests). */
export function initKoyomi(): void {
	getTables();
}
