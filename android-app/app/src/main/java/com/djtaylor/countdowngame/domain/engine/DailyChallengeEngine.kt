package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.DailyChallenge
import com.djtaylor.countdowngame.domain.model.GameMode
import com.djtaylor.countdowngame.domain.model.RoundDef
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Daily challenge engine — port of web-app/src/logic/dailyChallenge.ts.
 *
 * All users on the same date receive the same puzzle.
 */
object DailyChallengeEngine {

    private val DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    // ── Seed derivation (djb2 hash — matches TypeScript) ─────────────────────

    /**
     * Deterministic seed from a date string "YYYY-MM-DD".
     * Uses djb2-style hash so the same date always produces the same puzzle.
     */
    fun dateToSeed(dateKey: String): Int {
        var hash = 0L
        for (ch in dateKey) {
            hash = ((hash shl 5) - hash + ch.code) and 0xFFFFFFFFL
        }
        return (hash and 0x7FFFFFFFL).toInt()  // unsigned 31-bit (positive)
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private fun seededInt(seed: Int, min: Int, max: Int): Int {
        var s = seed.toLong() and 0xFFFFFFFFL
        s = ((1664525L * s + 1013904223L) and 0xFFFFFFFFL)
        val rng = s.toDouble() / 0x100000000L
        return min + (rng * (max - min + 1)).toInt()
    }

    // ── Daily challenge generation ────────────────────────────────────────────

    /**
     * Get today's date key in "YYYY-MM-DD" format (device local time).
     */
    fun getTodayKey(): String = LocalDate.now().format(DATE_FORMATTER)

    /**
     * Generate the full daily challenge for [dateKey].
     * Logic mirrors the TypeScript implementation exactly for cross-platform parity.
     */
    fun getDailyChallenge(dateKey: String): DailyChallenge {
        val seed = dateToSeed(dateKey)

        // Round 1: 4 vowels, 5 consonants (mirrors TS getDailyChallenge)
        val letterRound1 = LettersEngine.generateSeededLetters(seed, vowelCount = 4)

        // Round 2: 3 vowels, 6 consonants — more consonant-heavy
        val letterRound2 = LettersEngine.generateSeededLetters(seed + 100, vowelCount = 3)

        // Numbers
        val largeCount = seededInt(seed + 200, min = 0, max = 4)
        val numbers     = NumbersEngine.generateNumbers(largeCount = largeCount, seed = seed + 300)
        val target      = NumbersEngine.generateTarget(seed = seed + 400)

        return DailyChallenge(
            dateKey      = dateKey,
            letterRound1 = letterRound1,
            letterRound2 = letterRound2,
            numbers      = numbers,
            largeCount   = largeCount,
            target       = target
        )
    }

    /** Shortcut — today's challenge. */
    fun getTodaysChallenge(): DailyChallenge = getDailyChallenge(getTodayKey())

    // ── Practice / Full-game round generation (epoch-seeded) ─────────────────

    /**
     * Convert a daily challenge into RoundDef list (for mode parity in GameViewModel).
     */
    fun dailyToRoundDefs(challenge: DailyChallenge): List<RoundDef> {
        val seed = dateToSeed(challenge.dateKey)
        return listOf(
            RoundDef(type = GameMode.LETTERS, deckSeed = seed.toLong()),
            RoundDef(type = GameMode.LETTERS, deckSeed = (seed + 100).toLong()),
            RoundDef(type = GameMode.NUMBERS,
                target     = challenge.target,
                numsSeed   = (seed + 300).toLong(),
                largeCount = challenge.largeCount)
        )
    }

    private fun makeLettersRoundDef(seed: Long, vowelCount: Int = 4): RoundDef =
        RoundDef(type = GameMode.LETTERS, deckSeed = seed, largeCount = vowelCount)

    private fun makeNumbersRoundDef(seed: Long): RoundDef {
        val largeSeed = (seed and 0x7FFFFFFFL).toInt()
        val lc = seededInt(largeSeed, 0, 4)
        val target = NumbersEngine.generateTarget((seed + 999L and 0x7FFFFFFFL).toInt())
        return RoundDef(type = GameMode.NUMBERS, numsSeed = seed, target = target, largeCount = lc)
    }

    /**
     * Generate round definitions for a 3-round practice session.
     * Format mirrors daily: Letters, Letters, Numbers.
     * [seed] defaults to current epoch ms for fresh randomness.
     */
    fun generatePracticeRoundDefs(seed: Long = System.currentTimeMillis()): List<RoundDef> = listOf(
        makeLettersRoundDef(seed,           vowelCount = 4),
        makeLettersRoundDef(seed + 1000L,   vowelCount = 3),
        makeNumbersRoundDef(seed + 2000L)
    )

    /**
     * Generate round definitions for a 9-round full-game session.
     * Real Countdown format: 6 letters rounds alternating with 3 numbers rounds.
     * Pattern: L L N L L N L L N
     * [seed] defaults to current epoch ms for fresh randomness.
     */
    fun generateFullGameRoundDefs(seed: Long = System.currentTimeMillis()): List<RoundDef> {
        var s = seed
        val defs = mutableListOf<RoundDef>()
        repeat(3) {
            defs += makeLettersRoundDef(s, vowelCount = 4);      s += 1000L
            defs += makeLettersRoundDef(s, vowelCount = 3);      s += 1000L
            defs += makeNumbersRoundDef(s);                      s += 1000L
        }
        return defs
    }
}
