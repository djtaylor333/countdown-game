package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.EquationStep
import com.djtaylor.countdowngame.domain.model.Operation
import org.junit.Assert.*
import org.junit.Test

class NumbersEngineTest {

    // ── generateNumbers ───────────────────────────────────────────────────────

    @Test
    fun `generateNumbers returns exactly 6 numbers`() {
        val numbers = NumbersEngine.generateNumbers(largeCount = 2, seed = 42)
        assertEquals(6, numbers.size)
    }

    @Test
    fun `generateNumbers with 0 large returns only small numbers`() {
        val large = setOf(25, 50, 75, 100)
        val numbers = NumbersEngine.generateNumbers(largeCount = 0, seed = 100)
        assertTrue("Expected no large numbers", numbers.none { it in large })
    }

    @Test
    fun `generateNumbers with 4 large returns 4 large numbers`() {
        val large = setOf(25, 50, 75, 100)
        val numbers = NumbersEngine.generateNumbers(largeCount = 4, seed = 200)
        assertEquals(4, numbers.count { it in large })
    }

    @Test
    fun `generateNumbers is deterministic for same seed`() {
        val n1 = NumbersEngine.generateNumbers(largeCount = 2, seed = 777)
        val n2 = NumbersEngine.generateNumbers(largeCount = 2, seed = 777)
        assertEquals(n1, n2)
    }

    @Test
    fun `generateNumbers all values are positive`() {
        val numbers = NumbersEngine.generateNumbers(largeCount = 1, seed = 321)
        numbers.forEach { assertTrue("Expected positive number, got $it", it > 0) }
    }

    @Test
    fun `generateNumbers clamps largeCount to 0-4`() {
        val large = setOf(25, 50, 75, 100)
        val withNeg = NumbersEngine.generateNumbers(largeCount = -1, seed = 1)
        assertEquals(0, withNeg.count { it in large })
        val withMax = NumbersEngine.generateNumbers(largeCount = 10, seed = 2)
        assertEquals(4, withMax.count { it in large })
    }

    // ── generateTarget ────────────────────────────────────────────────────────

    @Test
    fun `generateTarget returns value in range 100 to 999`() {
        repeat(20) { seed ->
            val target = NumbersEngine.generateTarget(seed = seed * 1000)
            assertTrue("Target out of range: $target", target in 100..999)
        }
    }

    @Test
    fun `generateTarget is deterministic`() {
        assertEquals(
            NumbersEngine.generateTarget(seed = 12345),
            NumbersEngine.generateTarget(seed = 12345)
        )
    }

    // ── solveNumbers ─────────────────────────────────────────────────────────

    @Test
    fun `solveNumbers finds exact solution when one exists`() {
        // 3 + 7 = 10, trivially
        val result = NumbersEngine.solveNumbers(numbers = listOf(3, 7, 5, 2, 50, 1), target = 10)
        assertTrue("Expected exact solution", result.exact)
        assertEquals(0, result.diff)
    }

    @Test
    fun `solveNumbers finds exact for 25 + 75 = 100`() {
        val result = NumbersEngine.solveNumbers(numbers = listOf(25, 75, 3, 4, 5, 6), target = 100)
        assertTrue(result.exact)
    }

    @Test
    fun `solveNumbers finds exact for classic countdown puzzle`() {
        // 50 × 6 = 300; 300 + 25 = 325; well-known solvable puzzle
        val result = NumbersEngine.solveNumbers(numbers = listOf(50, 6, 25, 4, 3, 2), target = 325)
        assertTrue(result.exact)
    }

    @Test
    fun `solveNumbers returns closest when exact not possible`() {
        // With numbers 1,2,3,4,5,6 target=999 – impossible to reach exactly
        val result = NumbersEngine.solveNumbers(numbers = listOf(1, 2, 3, 4, 5, 6), target = 999)
        // Best reachable: 6*5*4*3 = 360? Not 999. Just verify diff > 0 and closest > 0
        assertFalse(result.exact)
        assertTrue(result.closest > 0)
    }

    @Test
    fun `solveNumbers result steps are non-empty for solvable puzzle`() {
        val result = NumbersEngine.solveNumbers(listOf(100, 4, 3, 2, 1, 7), target = 107)
        assertTrue(result.exact)
        assertTrue(result.steps.isNotEmpty())
    }

    // ── scoreNumbersRound ────────────────────────────────────────────────────

    @Test
    fun `scoreNumbersRound gives 10 for exact (diff = 0)`() {
        assertEquals(10, NumbersEngine.scoreNumbersRound(diff = 0))
    }

    @Test
    fun `scoreNumbersRound gives 7 for diff in 1-5`() {
        assertEquals(7, NumbersEngine.scoreNumbersRound(diff = 1))
        assertEquals(7, NumbersEngine.scoreNumbersRound(diff = 5))
    }

    @Test
    fun `scoreNumbersRound gives 5 for diff in 6-10`() {
        assertEquals(5, NumbersEngine.scoreNumbersRound(diff = 6))
        assertEquals(5, NumbersEngine.scoreNumbersRound(diff = 10))
    }

    @Test
    fun `scoreNumbersRound gives 0 for diff over 10`() {
        assertEquals(0, NumbersEngine.scoreNumbersRound(diff = 11))
        assertEquals(0, NumbersEngine.scoreNumbersRound(diff = 500))
    }

    // ── validateSteps ────────────────────────────────────────────────────────

    @Test
    fun `validateSteps returns valid true and correct result for good steps`() {
        val numbers = listOf(3, 7, 5, 2, 50, 1)
        val steps = listOf(
            EquationStep(left = 3, op = Operation.PLUS, right = 7, result = 10)
        )
        val (valid, finalResult) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue(valid)
        assertEquals(10, finalResult)
    }

    @Test
    fun `validateSteps returns false when number not available`() {
        val numbers = listOf(3, 7, 5)
        val steps = listOf(
            EquationStep(left = 4, op = Operation.PLUS, right = 7, result = 11) // 4 not in numbers
        )
        val (valid, _) = NumbersEngine.validateSteps(steps, numbers)
        assertFalse(valid)
    }

    @Test
    fun `validateSteps returns false when result does not match op`() {
        val numbers = listOf(3, 7, 5)
        val steps = listOf(
            EquationStep(left = 3, op = Operation.PLUS, right = 7, result = 99) // 3+7=10, not 99
        )
        val (valid, _) = NumbersEngine.validateSteps(steps, numbers)
        assertFalse(valid)
    }

    @Test
    fun `validateSteps returns false for empty steps`() {
        val (valid, _) = NumbersEngine.validateSteps(emptyList(), listOf(3, 7, 5))
        assertFalse(valid)
    }

    @Test
    fun `validateSteps supports multi-step equations`() {
        val numbers = listOf(50, 6, 3)
        val steps = listOf(
            EquationStep(left = 50, op = Operation.TIMES, right = 6, result = 300),
            EquationStep(left = 300, op = Operation.PLUS, right = 3, result = 303)
        )
        val (valid, finalResult) = NumbersEngine.validateSteps(steps, numbers)
        assertTrue(valid)
        assertEquals(303, finalResult)
    }
}
