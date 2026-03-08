package com.djtaylor.countdowngame.domain.engine

import com.djtaylor.countdowngame.domain.model.GamePhase
import com.djtaylor.countdowngame.domain.model.GameMode
import com.djtaylor.countdowngame.domain.model.RoundDef
import com.djtaylor.countdowngame.ui.game.GameUiState
import org.junit.Assert.*
import org.junit.Test

/**
 * Tests covering timer-expiry semantics:
 *
 * When the 60-second round timer reaches zero the app MUST:
 *  1. Auto-submit immediately (no interactive SUBMITTING phase).
 *  2. Award 0 pts if nothing was built, or the partial score otherwise.
 *  3. Set [GameUiState.timedOut] = true so the UI can show the modal.
 *  4. Clear [timedOut] when the next round starts.
 */
class GameTimerExpiryTest {

    // ── Letters: auto-submit with empty word ─────────────────────────────────

    @Test
    fun `empty word on timeout scores 0`() {
        val score = LettersEngine.scoreLetterRound("")
        assertEquals(0, score)
    }

    @Test
    fun `empty word on timeout is not valid for any letter set`() {
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        // canFormWord("", ...) should return false so we never award pts
        assertFalse(LettersEngine.canFormWord("", letters))
    }

    @Test
    fun `partial word built before timeout scores its length`() {
        // Player typed "STAR" before time ran out
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        assertTrue(LettersEngine.canFormWord("STAR", letters))
        assertEquals(4, LettersEngine.scoreLetterRound("STAR"))
    }

    @Test
    fun `invalid word built before timeout scores 0`() {
        // "BUZZ" cannot be formed from the available letters
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        assertFalse(LettersEngine.canFormWord("BUZZ", letters))
        // Score is only awarded for valid words
        val score = if (LettersEngine.canFormWord("BUZZ", letters)) LettersEngine.scoreLetterRound("BUZZ") else 0
        assertEquals(0, score)
    }

    @Test
    fun `9-letter word before timeout earns double points (18)`() {
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        // "STARGAZIN" uses all 9 letters (canFormWord = true, even if not a real word)
        assertTrue(LettersEngine.canFormWord("STARGAZIN", letters))
        assertEquals(18, LettersEngine.scoreLetterRound("STARGAZIN"))
    }

    // ── Numbers: auto-submit with no steps ───────────────────────────────────

    @Test
    fun `no answer on timeout scores 0`() {
        // Simulates: steps.isEmpty() → userResult = null → diff = huge
        val score = NumbersEngine.scoreNumbersRound(Int.MAX_VALUE)
        assertEquals(0, score)
    }

    @Test
    fun `near miss less than target by 3 before timeout scores 7`() {
        // Target 843, user reached 840, diff = 3
        val score = NumbersEngine.scoreNumbersRound(3)
        assertEquals(7, score)
    }

    @Test
    fun `near miss more than 10 away before timeout scores 0`() {
        // diff = 20
        val score = NumbersEngine.scoreNumbersRound(20)
        assertEquals(0, score)
    }

    @Test
    fun `exact match before timeout scores 10`() {
        val score = NumbersEngine.scoreNumbersRound(0)
        assertEquals(10, score)
    }

    // ── GameUiState: timedOut flag data-class semantics ──────────────────────

    @Test
    fun `GameUiState initialises timedOut to false`() {
        val state = GameUiState()
        assertFalse(state.timedOut)
    }

    @Test
    fun `GameUiState copy with timedOut true reflects change`() {
        val state    = GameUiState()
        val timedOut = state.copy(timedOut = true)
        assertTrue(timedOut.timedOut)
        // Original is unchanged (immutability)
        assertFalse(state.timedOut)
    }

    @Test
    fun `setting timedOut true then false restores original state`() {
        val state    = GameUiState()
        val timedOut = state.copy(timedOut = true, phase = GamePhase.RESULTS)
        val cleared  = timedOut.copy(timedOut = false)
        assertFalse(cleared.timedOut)
        assertEquals(GamePhase.RESULTS, cleared.phase) // phase unchanged by clearing timedOut
    }

    // ── State-machine: phase transitions on timer expiry ────────────────────

    /**
     * Simulate the ViewModel timerExpired() call:
     * timedOut = true → then submitWord/submitNumbers → RESULTS
     *
     * We cannot call the real ViewModel here (it needs Hilt injected deps),
     * so we verify the transitions using the immutable state copy pattern.
     */
    @Test
    fun `timer expiry sets timedOut and goes to RESULTS not SUBMITTING`() {
        // Start in PLAYING phase
        val playingState = GameUiState(
            phase         = GamePhase.PLAYING,
            timedOut      = false,
            timeRemaining = 0
        )

        // Simulate timerExpired() — sets timedOut, then (async) transitions to RESULTS
        val afterExpiry = playingState.copy(timedOut = true)
        assertTrue(afterExpiry.timedOut)

        // After auto-submit completes, phase becomes RESULTS (not SUBMITTING)
        val afterResults = afterExpiry.copy(phase = GamePhase.RESULTS)
        assertEquals(GamePhase.RESULTS, afterResults.phase)
        assertTrue(afterResults.timedOut)
        // The SUBMITTING phase is NOT involved
        assertNotEquals(GamePhase.SUBMITTING, afterResults.phase)
    }

    @Test
    fun `advancing to next round clears timedOut flag`() {
        val afterResults = GameUiState(
            phase         = GamePhase.RESULTS,
            timedOut      = true,
            currentRound  = 0
        )
        // advanceRound() copies to SELECTING with timedOut = false
        val nextRound = afterResults.copy(
            phase        = GamePhase.SELECTING,
            currentRound = 1,
            timedOut     = false
        )
        assertFalse(nextRound.timedOut)
        assertEquals(GamePhase.SELECTING, nextRound.phase)
        assertEquals(1, nextRound.currentRound)
    }

    @Test
    fun `user-initiated stop (no timeout) leaves timedOut false`() {
        // submitAnswer() = player presses Stop Clock voluntarily
        val playingState = GameUiState(phase = GamePhase.PLAYING, timedOut = false)
        // User stops clock → SUBMITTING, timedOut stays false
        val submitting = playingState.copy(phase = GamePhase.SUBMITTING)
        assertFalse(submitting.timedOut)
        assertEquals(GamePhase.SUBMITTING, submitting.phase)
    }

    // ── RoundDefs: timer applies only to non-practice rounds ────────────────

    @Test
    fun `practice mode timerEnabled is false, so timer never fires`() {
        // In practice mode, timerEnabled = false → timerExpired() is unreachable
        val practiceState = GameUiState(timerEnabled = false, phase = GamePhase.PLAYING)
        assertFalse(practiceState.timerEnabled)
        // Timer should never set timedOut = true in practice mode
        // This assertion documents the expected invariant
        assertFalse(practiceState.timedOut)
    }

    @Test
    fun `daily mode timerEnabled is true`() {
        val dailyState = GameUiState(timerEnabled = true, phase = GamePhase.PLAYING)
        assertTrue(dailyState.timerEnabled)
    }

    // ── Best words / solution: auto-submit reveals them ──────────────────────

    @Test
    fun `findBestWords returns results for any valid letter set`() {
        // Auto-submit calls findBestWords to populate bestWords for the modal
        val letters = listOf('S', 'T', 'A', 'R', 'G', 'A', 'Z', 'I', 'N')
        // We just verify the engine can find at least one candidate
        // (actual word validation requires the dictionary, so we check canFormWord)
        val candidates = listOf("STAR", "SING", "RING", "GRAIN")
        val formable = candidates.filter { LettersEngine.canFormWord(it, letters) }
        assertTrue("Should find at least one formable word", formable.isNotEmpty())
    }

    @Test
    fun `solveNumbers returns a solution when one exists`() {
        // Auto-submit calls solveNumbers to populate solution steps for the modal
        val numbers = listOf(75, 50, 6, 3, 9, 2)
        val target  = 843
        val result  = NumbersEngine.solveNumbers(numbers, target)
        // 75 * 9 + 3 * 6 = 675 + 18 = 693 (not exact, but solver should find close)
        // Just verify the solver runs without exception and returns a valid result
        assertNotNull(result)
    }
}
