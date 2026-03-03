package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.EquationStep
import com.djtaylor.countdowngame.domain.model.Operation
import com.djtaylor.countdowngame.domain.model.SolverResult

/**
 * Numbers engine — port of web-app/src/logic/numbers.ts.
 *
 * Authentic Countdown number pools:
 *   Large: 25, 50, 75, 100 (one of each)
 *   Small: 1–10 (two of each)
 */
object NumbersEngine {

    private val LARGE_NUMBERS = listOf(25, 50, 75, 100)
    private val SMALL_NUMBERS = (1..10).flatMap { listOf(it, it) }

    // ── LCG seeded shuffle (same constants as LettersEngine + web app) ────────

    private fun <T> seededShuffle(list: List<T>, seed: Int): List<T> =
        LettersEngine.seededShuffle(list, seed)

    // ── Number generation ─────────────────────────────────────────────────────

    /**
     * Generate 6 numbers for a round.
     *
     * @param largeCount How many large numbers (25/50/75/100); clamped to [0,4]
     * @param seed       RNG seed for deterministic generation
     */
    fun generateNumbers(largeCount: Int, seed: Int): List<Int> {
        val lc = largeCount.coerceIn(0, 4)
        val sc = 6 - lc

        val large = seededShuffle(LARGE_NUMBERS, seed)
        val small = seededShuffle(SMALL_NUMBERS, seed + 77)

        return large.take(lc) + small.take(sc)
    }

    /**
     * Generate a random 3-digit target in range [100, 999].
     */
    fun generateTarget(seed: Int): Int {
        val adjustedSeed = seed + 999
        var s = adjustedSeed.toLong() and 0xFFFFFFFFL
        s = ((1664525L * s + 1013904223L) and 0xFFFFFFFFL)
        val rng = s.toDouble() / 0x100000000L
        return (rng * 900).toInt() + 100
    }

    // ── Arithmetic helper ────────────────────────────────────────────────────

    private fun applyOp(a: Int, op: Operation, b: Int): Int? = when (op) {
        Operation.PLUS   -> a + b
        Operation.MINUS  -> if (a - b > 0) a - b else null  // no negatives/zero
        Operation.TIMES  -> a * b
        Operation.DIVIDE -> if (b != 0 && a % b == 0) a / b else null  // integers only
    }

    // ── Recursive solver ──────────────────────────────────────────────────────

    private var bestResult: SolverResult? = null

    private fun solve(nums: List<Int>, steps: List<EquationStep>, target: Int) {
        // Check all current numbers as potential answer
        for (n in nums) {
            val diff = kotlin.math.abs(n - target)
            val current = bestResult
            if (current == null || diff < current.diff) {
                bestResult = SolverResult(exact = diff == 0, closest = n, diff = diff, steps = steps.toList())
            }
            if (bestResult?.exact == true) return
        }

        if (nums.size < 2) return

        for (i in nums.indices) {
            for (j in nums.indices) {
                if (i == j) continue
                val a = nums[i]; val b = nums[j]

                for (op in Operation.entries) {
                    // Avoid redundant commutative pairs for + and ×
                    if ((op == Operation.PLUS || op == Operation.TIMES) && i > j) continue

                    val result = applyOp(a, op, b) ?: continue
                    if (result <= 0) continue

                    val newNums = nums.filterIndexed { idx, _ -> idx != i && idx != j }.toMutableList()
                    newNums.add(result)

                    val newSteps = steps + EquationStep(left = a, op = op, right = b, result = result)
                    solve(newNums, newSteps, target)

                    if (bestResult?.exact == true) return
                }
            }
        }
    }

    /**
     * Find the best (exact or nearest) solution for the numbers game.
     */
    fun solveNumbers(numbers: List<Int>, target: Int): SolverResult {
        synchronized(this) {
            bestResult = null
            solve(numbers, emptyList(), target)
            return bestResult ?: SolverResult(exact = false, closest = 0, diff = target, steps = emptyList())
        }
    }

    // ── Scoring ───────────────────────────────────────────────────────────────

    /**
     * Score a numbers round.
     * 10 = exact (diff 0), 7 = within 5, 5 = within 10, 0 = more than 10 off
     */
    fun scoreNumbersRound(diff: Int): Int = when {
        diff == 0  -> 10
        diff <= 5  -> 7
        diff <= 10 -> 5
        else       -> 0
    }

    /**
     * Validate user-submitted equation steps against the starting numbers.
     * Returns whether the steps are valid and the final result value.
     */
    fun validateSteps(steps: List<EquationStep>, numbers: List<Int>): Pair<Boolean, Int?> {
        if (steps.isEmpty()) return Pair(false, null)

        val available = numbers.toMutableList()
        var lastResult: Int? = null

        for (step in steps) {
            val leftIdx = available.indexOf(step.left)
            if (leftIdx == -1) return Pair(false, null)
            available.removeAt(leftIdx)

            val rightIdx = available.indexOf(step.right)
            if (rightIdx == -1) return Pair(false, null)
            available.removeAt(rightIdx)

            val result = applyOp(step.left, step.op, step.right)
            if (result == null || result != step.result) return Pair(false, null)

            available.add(result)
            lastResult = result
        }

        return Pair(true, lastResult)
    }

    /**
     * Format equation steps as a human-readable string.
     * e.g. "50 × 6 = 300, 300 + 25 = 325"
     */
    fun formatSolution(steps: List<EquationStep>): String =
        steps.joinToString(", ") { "${it.left} ${it.op.symbol} ${it.right} = ${it.result}" }
}
