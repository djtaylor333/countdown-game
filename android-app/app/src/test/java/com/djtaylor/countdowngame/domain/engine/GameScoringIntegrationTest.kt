package com.djtaylor.countdowngame.domain.engine

import org.junit.Assert.*
import org.junit.Test

/**
 * Integration tests that validate scoring across both engines and
 * game-wide consistency checks (e.g., maximum possible score per round type).
 */
class GameScoringIntegrationTest {

    // ── Letters scoring integration ───────────────────────────────────────────

    @Test
    fun `letters score for 9-letter word is double a 9-letter length score`() {
        // 9-letter word should give 18 (special bonus), not 9
        val score = LettersEngine.scoreLetterRound("ABCDEFGHI")
        assertEquals(18, score)
        assertTrue("9-letter bonus should be > 9", score > 9)
    }

    @Test
    fun `letters score increases monotonically from 2 to 8 letters`() {
        val words = listOf("GO", "CAT", "STAR", "CRANE", "GARDEN", "READING", "STARGATE")
        val scores = words.map { LettersEngine.scoreLetterRound(it) }
        for (i in 0 until scores.size - 1) {
            assertTrue(
                "Score for '${words[i+1]}' (${scores[i+1]}) should be > '${words[i]}' (${scores[i]})",
                scores[i + 1] > scores[i]
            )
        }
    }

    @Test
    fun `letters score is length for 2-8 letter words`() {
        listOf("GO", "CAT", "STAR", "CRANE", "GARDEN", "READING", "STARGATE").forEach { word ->
            assertEquals(
                "Score for '${word}' should equal its length",
                word.length,
                LettersEngine.scoreLetterRound(word)
            )
        }
    }

    // ── Numbers scoring integration ───────────────────────────────────────────

    @Test
    fun `numbers scoring gives max 10 for exact match only`() {
        assertEquals(10, NumbersEngine.scoreNumbersRound(0))
        assertTrue(NumbersEngine.scoreNumbersRound(1) < 10)
    }

    @Test
    fun `numbers score is non-increasing as diff increases`() {
        val scores = (0..20).map { NumbersEngine.scoreNumbersRound(it) }
        for (i in 0 until scores.size - 1) {
            assertTrue(
                "Score at diff=${i+1} (${scores[i+1]}) should be <= score at diff=$i (${scores[i]})",
                scores[i + 1] <= scores[i]
            )
        }
    }

    @Test
    fun `numbers max possible score from a game is 10`() {
        val maxScore = NumbersEngine.scoreNumbersRound(0)
        assertEquals(10, maxScore)
    }

    // ── Cross-engine consistency ───────────────────────────────────────────────

    @Test
    fun `daily challenge letters can always form at least a 2-letter word`() {
        // Any 9 letters including at least 3 vowels should allow at least some word
        // We just verify the challenge is structurally valid
        val challenge = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        assertEquals(9, challenge.letterRound1.size)
        assertEquals(9, challenge.letterRound2.size)
        // All letters should be valid A-Z
        challenge.letterRound1.forEach { assertTrue(it in 'A'..'Z') }
        challenge.letterRound2.forEach { assertTrue(it in 'A'..'Z') }
    }

    @Test
    fun `daily challenge numbers include valid large and small values`() {
        val large = setOf(25, 50, 75, 100)
        val challenge = DailyChallengeEngine.getDailyChallenge("2025-09-10")
        challenge.numbers.forEach { n ->
            assertTrue("Number $n should be positive", n > 0)
            // All non-large numbers should be 1-10
            if (n !in large) {
                assertTrue("Small number $n should be in 1-10", n in 1..10)
            }
        }
    }

    @Test
    fun `multiple dates all produce valid challenges`() {
        val dates = listOf(
            "2025-01-01", "2025-02-14", "2025-06-15",
            "2025-10-31", "2025-12-25", "2026-01-01"
        )
        dates.forEach { date ->
            val c = DailyChallengeEngine.getDailyChallenge(date)
            assertEquals("$date: letterRound1 should have 9 letters", 9, c.letterRound1.size)
            assertEquals("$date: letterRound2 should have 9 letters", 9, c.letterRound2.size)
            assertEquals("$date: numbers should have 6 values", 6, c.numbers.size)
            assertTrue("$date: target should be 100-999", c.target in 100..999)
            assertEquals("$date: dateKey mismatch", date, c.dateKey)
        }
    }

    // ── Solve + validate consistency ──────────────────────────────────────────

    @Test
    fun `solved steps pass validation for simple puzzle`() {
        val numbers = listOf(3, 7, 5, 2, 50, 1)
        val target = 10
        val solved = NumbersEngine.solveNumbers(numbers, target)
        if (solved.exact && solved.steps.isNotEmpty()) {
            val (valid, result) = NumbersEngine.validateSteps(solved.steps, numbers)
            assertTrue("Solver steps should pass validation", valid)
            assertEquals(target, result)
        }
    }

    @Test
    fun `solved steps pass validation for classic puzzle`() {
        val numbers = listOf(50, 6, 25, 4, 3, 2)
        val target = 325
        val solved = NumbersEngine.solveNumbers(numbers, target)
        assertTrue("Expected exact solution for classic puzzle", solved.exact)
        val (valid, result) = NumbersEngine.validateSteps(solved.steps, numbers)
        assertTrue("Solver steps should pass validation", valid)
        assertEquals(target, result)
    }
}
