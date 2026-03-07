package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.EquationStep
import com.djtaylor.countdowngame.domain.model.Operation
import org.junit.Assert.*
import org.junit.Test

/**
 * Extended tests for NumbersEngine — subtraction, division, multi-step solving,
 * scoring boundaries, and edge cases.
 */
class NumbersEngineEdgeCasesTest {

    // ── solveNumbers — arithmetic operations ─────────────────────────────────

    @Test
    fun `solveNumbers finds solution using subtraction`() {
        // 50 - 3 = 47
        val result = NumbersEngine.solveNumbers(listOf(50, 3, 75, 4, 2, 1), target = 47)
        assertTrue("Expected exact solution for 50-3=47", result.exact)
    }

    @Test
    fun `solveNumbers finds solution using multiplication`() {
        // 6 * 7 = 42
        val result = NumbersEngine.solveNumbers(listOf(6, 7, 3, 2, 1, 5), target = 42)
        assertTrue("Expected exact solution for 6×7=42", result.exact)
    }

    @Test
    fun `solveNumbers finds solution using division`() {
        // 75 / 25 = 3 (but need to make target)
        // 100 / 4 = 25
        val result = NumbersEngine.solveNumbers(listOf(100, 4, 5, 3, 2, 1), target = 25)
        assertTrue("Expected exact solution for 100/4=25", result.exact)
    }

    @Test
    fun `solveNumbers handles two-step solution`() {
        // 50 * 6 = 300, 300 + 25 = 325
        val result = NumbersEngine.solveNumbers(listOf(50, 6, 25, 4, 3, 2), target = 325)
        assertTrue("Expected exact two-step solution", result.exact)
        assertTrue("Expected at least 2 steps", result.steps.size >= 2)
    }

    @Test
    fun `solveNumbers single number equals target`() {
        val result = NumbersEngine.solveNumbers(listOf(75, 6, 25, 4, 3, 2), target = 75)
        assertTrue("Single number matching target should be exact", result.exact)
    }

    @Test
    fun `solveNumbers returns diff zero for exact match`() {
        val result = NumbersEngine.solveNumbers(listOf(100, 3, 4, 5, 6, 7), target = 100)
        assertEquals(0, result.diff)
    }

    @Test
    fun `solveNumbers diff is always non-negative`() {
        listOf(123, 456, 789, 999, 100).forEach { target ->
            val result = NumbersEngine.solveNumbers(listOf(1, 2, 3, 4, 5, 6), target = target)
            assertTrue("Diff should be non-negative for target $target", result.diff >= 0)
        }
    }

    // ── generateNumbers ───────────────────────────────────────────────────────

    @Test
    fun `generateNumbers small numbers are in range 1-10`() {
        val large = setOf(25, 50, 75, 100)
        val numbers = NumbersEngine.generateNumbers(largeCount = 0, seed = 555)
        numbers.forEach { n ->
            assertTrue("Small number $n out of range 1-10", n in 1..10)
        }
    }

    @Test
    fun `generateNumbers large numbers are in set 25-50-75-100`() {
        val large = setOf(25, 50, 75, 100)
        val numbers = NumbersEngine.generateNumbers(largeCount = 4, seed = 666)
        val largeInResult = numbers.filter { it in large }
        assertEquals(4, largeInResult.size)
        largeInResult.forEach { n ->
            assertTrue("$n is not a valid large number", n in large)
        }
    }

    @Test
    fun `generateNumbers with 2 large returns 2 large and 4 small`() {
        val large = setOf(25, 50, 75, 100)
        val numbers = NumbersEngine.generateNumbers(largeCount = 2, seed = 42)
        val largeCount = numbers.count { it in large }
        val smallCount = numbers.count { it !in large }
        assertEquals(2, largeCount)
        assertEquals(4, smallCount)
    }

    // ── scoreNumbersRound boundary values ─────────────────────────────────────

    @Test
    fun `scoreNumbersRound boundary at diff=5 gives 7`() {
        assertEquals(7, NumbersEngine.scoreNumbersRound(diff = 5))
    }

    @Test
    fun `scoreNumbersRound boundary at diff=6 gives 5`() {
        assertEquals(5, NumbersEngine.scoreNumbersRound(diff = 6))
    }

    @Test
    fun `scoreNumbersRound boundary at diff=10 gives 5`() {
        assertEquals(5, NumbersEngine.scoreNumbersRound(diff = 10))
    }

    @Test
    fun `scoreNumbersRound boundary at diff=11 gives 0`() {
        assertEquals(0, NumbersEngine.scoreNumbersRound(diff = 11))
    }

    @Test
    fun `scoreNumbersRound gives 0 for large diff`() {
        assertEquals(0, NumbersEngine.scoreNumbersRound(diff = 899))
    }

    // ── validateSteps multi-step and operation coverage ───────────────────────

    @Test
    fun `validateSteps handles subtraction correctly`() {
        val numbers = listOf(75, 25)
        val steps = listOf(
            EquationStep(left = 75, op = Operation.MINUS, right = 25, result = 50)
        )
        val (valid, result) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue(valid)
        assertEquals(50, result)
    }

    @Test
    fun `validateSteps handles multiplication correctly`() {
        val numbers = listOf(6, 8)
        val steps = listOf(
            EquationStep(left = 6, op = Operation.TIMES, right = 8, result = 48)
        )
        val (valid, result) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue(valid)
        assertEquals(48, result)
    }

    @Test
    fun `validateSteps handles division correctly`() {
        val numbers = listOf(50, 5)
        val steps = listOf(
            EquationStep(left = 50, op = Operation.DIVIDE, right = 5, result = 10)
        )
        val (valid, result) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue(valid)
        assertEquals(10, result)
    }

    @Test
    fun `validateSteps rejects division with non-integer result`() {
        val numbers = listOf(7, 3)
        val steps = listOf(
            EquationStep(left = 7, op = Operation.DIVIDE, right = 3, result = 2)
        )
        val (valid, _) = NumbersEngine.validateSteps(steps, numbers)
        assertFalse("7÷3 is not an integer, should be invalid", valid)
    }

    @Test
    fun `validateSteps rejects subtraction resulting in negative`() {
        val numbers = listOf(3, 7)
        val steps = listOf(
            EquationStep(left = 3, op = Operation.MINUS, right = 7, result = -4)
        )
        val (valid, _) = NumbersEngine.validateSteps(steps, numbers)
        assertFalse("Negative intermediate result should be invalid", valid)
    }

    @Test
    fun `validateSteps reuses intermediate result in next step`() {
        val numbers = listOf(4, 5, 3)
        val steps = listOf(
            EquationStep(left = 4, op = Operation.TIMES, right = 5, result = 20),
            EquationStep(left = 20, op = Operation.PLUS, right = 3, result = 23)
        )
        val (valid, result) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue("Multi-step reuse should be valid", valid)
        assertEquals(23, result)
    }

    // ── generateTarget ────────────────────────────────────────────────────────

    @Test
    fun `generateTarget is different for sequential seeds`() {
        val targets = (0..9).map { NumbersEngine.generateTarget(seed = it * 9999) }.toSet()
        // Not all 10 should be identical
        assertTrue("Expected some variation in generated targets", targets.size > 1)
    }

    @Test
    fun `generateTarget never produces exactly 0`() {
        (0..50).forEach { i ->
            val t = NumbersEngine.generateTarget(seed = i * 1337)
            assertNotEquals("Target should never be 0", 0, t)
        }
    }
}
