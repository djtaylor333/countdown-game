package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.DailyChallenge
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
}
