import { describe, expect, it } from 'vitest'
import { foldText, matchesAllWords, queryWords } from './textMatch.js'

describe('text matching', () => {
	it('folds case and accents', () => {
		expect(foldText('Crème Brûlée')).toBe('creme brulee')
		expect(foldText(null)).toBe('')
	})

	it('splits the query into words', () => {
		expect(queryWords('  Beef   MINCE ')).toEqual(['beef', 'mince'])
		expect(queryWords('   ')).toEqual([])
	})

	it('needs every word, in any of the texts', () => {
		expect(matchesAllWords(['Beef mince', 'Meat'], queryWords('meat beef'))).toBe(true)
		expect(matchesAllWords(['Beef mince', 'Meat'], queryWords('beef dairy'))).toBe(false)
		expect(matchesAllWords(['Crème brûlée'], queryWords('creme'))).toBe(true)
		expect(matchesAllWords(['anything'], [])).toBe(true)
	})

	it('does not match across two texts', () => {
		expect(matchesAllWords(['ab', 'cd'], queryWords('bc'))).toBe(false)
	})
})
