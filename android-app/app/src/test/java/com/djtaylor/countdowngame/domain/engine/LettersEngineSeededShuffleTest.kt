package com.djtaylor.countdowngame.domain.engine

import org.junit.Assert.*
import org.junit.Test

/**
 * Extended tests for LettersEngine.seededShuffle and vowel/consonant pool guarantees.
 */
class LettersEngineSeededShuffleTest {

    // ── seededShuffle ─────────────────────────────────────────────────────────

    @Test
    fun `seededShuffle returns same size list as input`() {
        val input = (1..10).toList()
        val result = LettersEngine.seededShuffle(input, seed = 42)
        assertEquals(10, result.size)
    }

    @Test
    fun `seededShuffle contains same elements as input`() {
        val input = listOf('A', 'B', 'C', 'D', 'E')
        val result = LettersEngine.seededShuffle(input, seed = 1234)
        assertEquals(input.sorted(), result.sorted())
    }

    @Test
    fun `seededShuffle is deterministic for same seed`() {
        val input = (1..20).toList()
        val r1 = LettersEngine.seededShuffle(input, seed = 9999)
        val r2 = LettersEngine.seededShuffle(input, seed = 9999)
        assertEquals(r1, r2)
    }

    @Test
    fun `seededShuffle produces different order for different seeds`() {
        val input = (1..10).toList()
        val r1 = LettersEngine.seededShuffle(input, seed = 100)
        val r2 = LettersEngine.seededShuffle(input, seed = 200)
        assertNotEquals(r1, r2)
    }

    @Test
    fun `seededShuffle does not modify original list`() {
        val input = listOf(1, 2, 3, 4, 5)
        val original = input.toList()
        LettersEngine.seededShuffle(input, seed = 77)
        assertEquals(original, input)
    }

    @Test
    fun `seededShuffle handles single-element list`() {
        val input = listOf(42)
        val result = LettersEngine.seededShuffle(input, seed = 0)
        assertEquals(listOf(42), result)
    }

    @Test
    fun `seededShuffle handles empty list`() {
        val result = LettersEngine.seededShuffle(emptyList<Int>(), seed = 1)
        assertTrue(result.isEmpty())
    }

    // ── generateSeededLetters vowel/consonant guarantees ─────────────────────

    @Test
    fun `generateSeededLetters with default vowelCount has at least 3 vowels`() {
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        // Test across many seeds
        (0..19).forEach { seed ->
            val letters = LettersEngine.generateSeededLetters(seed * 13337, 4)
            val vc = letters.count { it in vowels }
            assertTrue("Seed $seed: expected ≥3 vowels, got $vc", vc >= 3)
        }
    }

    @Test
    fun `generateSeededLetters all letters are valid uppercase A-Z`() {
        (0..9).forEach { seed ->
            LettersEngine.generateSeededLetters(seed * 5555, 4).forEach { ch ->
                assertTrue("Expected A-Z letter, got $ch", ch in 'A'..'Z')
            }
        }
    }

    @Test
    fun `generateSeededLetters produces 9 letters across many seeds`() {
        (1..20).forEach { seed ->
            val letters = LettersEngine.generateSeededLetters(seed * 111, vowelCount = 3)
            assertEquals("Seed $seed should produce 9 letters", 9, letters.size)
        }
    }

    @Test
    fun `generateSeededLetters with vowelCount 6 gives max 6 vowels`() {
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        (0..9).forEach { seed ->
            val letters = LettersEngine.generateSeededLetters(seed * 7777, vowelCount = 6)
            val vc = letters.count { it in vowels }
            assertEquals("Seed $seed: expected exactly 6 vowels, got $vc", 6, vc)
        }
    }

    @Test
    fun `generateSeededLetters with vowelCount 3 gives exact 3 vowels`() {
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        (0..9).forEach { seed ->
            val letters = LettersEngine.generateSeededLetters(seed * 2345, vowelCount = 3)
            val vc = letters.count { it in vowels }
            assertEquals("Seed $seed: expected exactly 3 vowels, got $vc", 3, vc)
        }
    }

    // ── scoreLetterRound edge cases ───────────────────────────────────────────

    @Test
    fun `scoreLetterRound gives exactly word length for 2-letter word`() {
        assertEquals(2, LettersEngine.scoreLetterRound("AT"))
    }

    @Test
    fun `scoreLetterRound gives exactly word length for 5-letter word`() {
        assertEquals(5, LettersEngine.scoreLetterRound("CRANE"))
    }

    @Test
    fun `scoreLetterRound gives 18 for any 9-letter word`() {
        // The bonus for using all 9 letters should be 18
        assertEquals(18, LettersEngine.scoreLetterRound("ABCDEFGHI"))
    }

    @Test
    fun `scoreLetterRound is case insensitive`() {
        assertEquals(
            LettersEngine.scoreLetterRound("STAR"),
            LettersEngine.scoreLetterRound("star")
        )
    }

    // ── findBestWords edge cases ──────────────────────────────────────────────

    @Test
    fun `findBestWords with limit 0 returns empty list`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        val wordSet = setOf("STAR", "READING")
        val best = LettersEngine.findBestWords(letters, wordSet, limit = 0)
        assertTrue(best.isEmpty())
    }

    @Test
    fun `findBestWords returns words that can be formed only`() {
        val letters = listOf('C', 'A', 'T', 'S', 'E', 'R', 'I', 'N', 'G')
        val wordSet = setOf("CAT", "BUZZ", "CATS", "RACING", "ZZZZZ")
        val best = LettersEngine.findBestWords(letters, wordSet, limit = 10)
        assertTrue("BUZZ should not appear", "BUZZ" !in best)
        assertTrue("ZZZZZ should not appear", "ZZZZZ" !in best)
    }
}
