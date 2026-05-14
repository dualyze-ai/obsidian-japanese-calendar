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
