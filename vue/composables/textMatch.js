/**
 * Free-text matching for pickers: every word of the query must appear in one of an item's texts,
 * ignoring case and accents ("creme" finds "Crème brûlée"). Words may match different texts.
 */

/** Lower-cased text without accents. */
export function foldText(text) {
	return String(text ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** The query's words, folded; empty for a blank query. */
export function queryWords(query) {
	return foldText(query).split(/\s+/).filter(Boolean)
}

/** Whether every word appears in one of texts (always true for no words). */
export function matchesAllWords(texts, words) {
	if (words.length === 0) {
		return true
	}
	// Words hold no whitespace, so joining on a newline never matches across two texts.
	const haystack = texts.map(foldText).join('\n')
	return words.every((word) => haystack.includes(word))
}
