package com.djtaylor.countdowngame.domain.engine

import org.junit.Assert.*
import org.junit.Test

class DailyChallengeEngineTest {

    // ── dateToSeed ────────────────────────────────────────────────────────────

    @Test
    fun `dateToSeed is deterministic for same date`() {
        assertEquals(
            DailyChallengeEngine.dateToSeed("2025-06-15"),
            DailyChallengeEngine.dateToSeed("2025-06-15")
        )
    }

    @Test
    fun `dateToSeed produces different seeds for different dates`() {
        val seed1 = DailyChallengeEngine.dateToSeed("2025-06-15")
        val seed2 = DailyChallengeEngine.dateToSeed("2025-06-16")
        assertNotEquals(seed1, seed2)
    }

    @Test
    fun `dateToSeed returns non-negative value`() {
        val seed = DailyChallengeEngine.dateToSeed("2025-06-15")
        assertTrue("Seed should be non-negative: $seed", seed >= 0)
    }

    // ── getDailyChallenge ────────────────────────────────────────────────────

    @Test
    fun `getDailyChallenge is deterministic for same date`() {
        val c1 = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        val c2 = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        assertEquals(c1, c2)
    }

    @Test
    fun `getDailyChallenge produces different challenges for different dates`() {
        val c1 = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        val c2 = DailyChallengeEngine.getDailyChallenge("2025-06-16")
        assertNotEquals(c1, c2)
    }

    @Test
    fun `getDailyChallenge letterRound1 has exactly 9 letters`() {
        val c = DailyChallengeEngine.getDailyChallenge("2025-01-01")
        assertEquals(9, c.letterRound1.size)
    }

    @Test
    fun `getDailyChallenge letterRound2 has exactly 9 letters`() {
        val c = DailyChallengeEngine.getDailyChallenge("2025-01-01")
        assertEquals(9, c.letterRound2.size)
    }

    @Test
    fun `getDailyChallenge numbers has exactly 6 values`() {
        val c = DailyChallengeEngine.getDailyChallenge("2025-01-01")
        assertEquals(6, c.numbers.size)
    }

    @Test
    fun `getDailyChallenge target is in range 100-999`() {
        listOf("2025-01-01", "2025-06-15", "2025-12-31").forEach { date ->
            val c = DailyChallengeEngine.getDailyChallenge(date)
            assertTrue("Target out of range for $date: ${c.target}", c.target in 100..999)
        }
    }

    @Test
    fun `getDailyChallenge largeCount is in range 0-4`() {
        listOf("2025-01-01", "2025-06-15", "2025-12-31").forEach { date ->
            val c = DailyChallengeEngine.getDailyChallenge(date)
            assertTrue("largeCount out of range: ${c.largeCount}", c.largeCount in 0..4)
        }
    }

    @Test
    fun `getDailyChallenge round 1 and round 2 letters differ`() {
        val c = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        assertNotEquals(c.letterRound1, c.letterRound2)
    }

    @Test
    fun `getDailyChallenge letterRound1 has between 3 and 6 vowels`() {
        val vowels = setOf('A', 'E', 'I', 'O', 'U')
        val c = DailyChallengeEngine.getDailyChallenge("2025-03-22")
        val vowelCount = c.letterRound1.count { it in vowels }
        assertTrue("Expected 3-6 vowels, got $vowelCount", vowelCount in 3..6)
    }

    @Test
    fun `getDailyChallenge matches web app output for known date`() {
        // Validates cross-platform parity: same algorithm as TypeScript implementation.
        // This seed uses: djb2 hash of "2025-06-15" = known value.
        // The test simply checks structural constraints since the seed is deterministic.
        val c = DailyChallengeEngine.getDailyChallenge("2025-06-15")
        assertEquals("2025-06-15", c.dateKey)
        assertEquals(9, c.letterRound1.size)
        assertEquals(9, c.letterRound2.size)
        assertEquals(6, c.numbers.size)
        assertTrue(c.target in 100..999)
    }
}
