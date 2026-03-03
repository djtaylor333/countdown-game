package com.djtaylor.countdowngame.domain.engine

import org.junit.Assert.*
import org.junit.Test

class LettersEngineTest {

    // ── canFormWord ───────────────────────────────────────────────────────────

    @Test
    fun `canFormWord returns true when word can be formed from letters`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        assertTrue(LettersEngine.canFormWord("STAR", letters))
    }

    @Test
    fun `canFormWord returns false when letter not in pool`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        assertFalse(LettersEngine.canFormWord("BUZZ", letters))
    }

    @Test
    fun `canFormWord returns false when same letter used more times than available`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        assertFalse(LettersEngine.canFormWord("STARRED", letters)) // needs 2 Rs but only 1 available
    }

    @Test
    fun `canFormWord is case insensitive`() {
        val letters = listOf('C', 'A', 'T', 'S', 'E', 'N', 'D', 'I', 'G')
        assertTrue(LettersEngine.canFormWord("cats", letters))
    }

    @Test
    fun `canFormWord returns true for exact use of all 9 letters`() {
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        assertTrue(LettersEngine.canFormWord("STARGAZIN", letters))
    }

    @Test
    fun `canFormWord returns false for empty word`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        assertFalse(LettersEngine.canFormWord("", letters))
    }

    // ── scoreLetterRound ─────────────────────────────────────────────────────

    @Test
    fun `scoreLetterRound gives 0 for empty word`() {
        assertEquals(0, LettersEngine.scoreLetterRound(""))
    }

    @Test
    fun `scoreLetterRound gives 0 for single-char word`() {
        assertEquals(0, LettersEngine.scoreLetterRound("A"))
    }

    @Test
    fun `scoreLetterRound gives length for 2-8 letter words`() {
        assertEquals(4, LettersEngine.scoreLetterRound("STAR"))
        assertEquals(7, LettersEngine.scoreLetterRound("STARTLE"))
        assertEquals(8, LettersEngine.scoreLetterRound("ANTIDOTE"))
    }

    @Test
    fun `scoreLetterRound gives 18 for 9-letter word`() {
        assertEquals(18, LettersEngine.scoreLetterRound("STARGAING"))
    }

    // ── generateSeededLetters ────────────────────────────────────────────────

    @Test
    fun `generateSeededLetters returns exactly 9 letters`() {
        val letters = LettersEngine.generateSeededLetters(12345, 4)
        assertEquals(9, letters.size)
    }

    @Test
    fun `generateSeededLetters is deterministic for same seed`() {
        val letters1 = LettersEngine.generateSeededLetters(99999, 4)
        val letters2 = LettersEngine.generateSeededLetters(99999, 4)
        assertEquals(letters1, letters2)
    }

    @Test
    fun `generateSeededLetters produces different results for different seeds`() {
        val letters1 = LettersEngine.generateSeededLetters(111, 4)
        val letters2 = LettersEngine.generateSeededLetters(222, 4)
        assertNotEquals(letters1, letters2)
    }

    @Test
    fun `generateSeededLetters respects minimum vowel count`() {
        // vowelCount clamped to min 3
        val letters = LettersEngine.generateSeededLetters(123, 1) // ask for 1 vowel, should get 3
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        val vowelCount = letters.count { it in vowels }
        assertTrue("Expected at least 3 vowels, got $vowelCount", vowelCount >= 3)
    }

    @Test
    fun `generateSeededLetters respects maximum vowel count`() {
        // vowelCount clamped to max 6
        val letters = LettersEngine.generateSeededLetters(456, 9) // ask for 9 vowels, should get 6
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        val vowelCount = letters.count { it in vowels }
        assertTrue("Expected at most 6 vowels, got $vowelCount", vowelCount <= 6)
    }

    @Test
    fun `generateSeededLetters only returns uppercase letters`() {
        val letters = LettersEngine.generateSeededLetters(54321, 4)
        letters.forEach { ch ->
            assertTrue("Expected uppercase letter, got $ch", ch in 'A'..'Z')
        }
    }

    // ── findBestWords ────────────────────────────────────────────────────────

    @Test
    fun `findBestWords returns longest valid words first`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        val wordSet = setOf("READING", "READ", "STAR", "STARLING", "AN", "TRADING")
        val best = LettersEngine.findBestWords(letters, wordSet, limit = 5)
        // READING (7) and TRADING (7) can be formed; STAR (4) can
        assertTrue(best.isNotEmpty())
        // Results should be sorted by length descending
        for (i in 0 until best.size - 1) {
            assertTrue(best[i].length >= best[i + 1].length)
        }
    }

    @Test
    fun `findBestWords returns empty list when no words can be formed`() {
        val letters = listOf('A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A')
        val wordSet = setOf("BUZZ", "FIZZ", "WHIZ")
        val best = LettersEngine.findBestWords(letters, wordSet, limit = 5)
        assertTrue(best.isEmpty())
    }

    @Test
    fun `findBestWords respects the limit`() {
        val letters = listOf('S', 'T', 'A', 'R', 'E', 'N', 'D', 'I', 'G')
        val wordSet = setOf("STAR", "STING", "STERN", "SIREN", "STAGE", "DINER", "TREAD")
        val best = LettersEngine.findBestWords(letters, wordSet, limit = 3)
        assertTrue(best.size <= 3)
    }
}
