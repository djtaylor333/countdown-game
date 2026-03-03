package com.djtaylor.countdowngame.domain.engine

/**
 * Letters engine — port of web-app/src/logic/letters.ts.
 *
 * Pools match authentic Countdown / SOWPODS frequencies.
 * Vowels : A×15, E×21, I×13, O×13, U×5  = 67 total
 * Consonants: B×6, C×4, D×8, F×2, G×4, H×3, J×2, K×2, L×5, M×4,
 *             N×8, P×4, Q×1, R×9, S×9, T×7, V×4, W×3, X×1, Y×2, Z×1
 */
object LettersEngine {

    // ── Letter pools ──────────────────────────────────────────────────────────

    private val VOWEL_POOL: List<Char> = buildList {
        repeat(15) { add('A') }
        repeat(21) { add('E') }
        repeat(13) { add('I') }
        repeat(13) { add('O') }
        repeat(5)  { add('U') }
    }

    private val CONSONANT_POOL: List<Char> = buildList {
        repeat(6) { add('B') }; repeat(4) { add('C') }; repeat(8) { add('D') }
        repeat(2) { add('F') }; repeat(4) { add('G') }; repeat(3) { add('H') }
        repeat(2) { add('J') }; repeat(2) { add('K') }; repeat(5) { add('L') }
        repeat(4) { add('M') }; repeat(8) { add('N') }; repeat(4) { add('P') }
        repeat(1) { add('Q') }; repeat(9) { add('R') }; repeat(9) { add('S') }
        repeat(7) { add('T') }; repeat(4) { add('V') }; repeat(3) { add('W') }
        repeat(1) { add('X') }; repeat(2) { add('Y') }; repeat(1) { add('Z') }
    }

    // ── Seeded shuffle (LCG — matches TypeScript implementation) ──────────────

    /**
     * In-place Fisher-Yates shuffle driven by linear congruential generator.
     * Uses same constants as web app: multiplier=1664525, increment=1013904223.
     */
    fun <T> seededShuffle(list: List<T>, seed: Int): List<T> {
        val arr = list.toMutableList()
        var s = seed.toLong() and 0xFFFFFFFFL
        fun next(): Double {
            s = ((1664525L * s + 1013904223L) and 0xFFFFFFFFL)
            return s.toDouble() / 0x100000000L
        }
        for (i in arr.lastIndex downTo 1) {
            val j = (next() * (i + 1)).toInt()
            val tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
        }
        return arr
    }

    // ── Seeded letter generation ──────────────────────────────────────────────

    /**
     * Generate 9 letters seeded by a date key + round index.
     * Always produces min 3 vowels and min 4 consonants.
     *
     * @param seed      Integer seed (from dateToSeed)
     * @param vowelCount Desired vowel count; clamped to [3, 6]
     */
    fun generateSeededLetters(seed: Int, vowelCount: Int = 4): List<Char> {
        val vCount = vowelCount.coerceIn(3, 6)
        val cCount = 9 - vCount

        val vowels     = seededShuffle(VOWEL_POOL, seed)
        val consonants = seededShuffle(CONSONANT_POOL, seed + 1)

        val combined = vowels.take(vCount) + consonants.take(cCount)
        return seededShuffle(combined, seed + 2)
    }

    // ── Word validation ───────────────────────────────────────────────────────

    /**
     * Check whether [word] can be formed from the available [letters].
     * Each letter in [letters] may be used at most once.
     */
    fun canFormWord(word: String, letters: List<Char>): Boolean {
        if (word.isEmpty()) return false
        val available = mutableMapOf<Char, Int>()
        for (l in letters) available[l] = (available[l] ?: 0) + 1
        for (ch in word.uppercase()) {
            val count = available[ch] ?: 0
            if (count == 0) return false
            available[ch] = count - 1
        }
        return true
    }

    // ── Scoring ───────────────────────────────────────────────────────────────

    /**
     * Score a letters round.
     * 9-letter word = 18, otherwise = word length, invalid / empty = 0.
     */
    fun scoreLetterRound(word: String): Int {
        val len = word.length
        return when {
            len <= 1  -> 0
            len == 9  -> 18
            else      -> len
        }
    }

    // ── Best word finder ──────────────────────────────────────────────────────

    /**
     * Find the best words that can be formed from [letters] within [wordSet].
     *
     * @param letters   The 9 available letters
     * @param wordSet   Set of valid words (uppercase)
     * @param limit     Maximum number of results to return
     * @return          Words sorted by length descending, up to [limit]
     */
    fun findBestWords(letters: List<Char>, wordSet: Set<String>, limit: Int = 8): List<String> {
        return wordSet
            .filter { it.length in 2..9 && canFormWord(it, letters) }
            .sortedByDescending { it.length }
            .take(limit)
    }
}
