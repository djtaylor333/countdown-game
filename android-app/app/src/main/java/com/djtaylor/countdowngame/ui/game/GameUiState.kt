package com.djtaylor.countdowngame.ui.game

import com.djtaylor.countdowngame.domain.model.*

/**
 * Immutable UI state for the game screen.
 * Covers all 3 rounds (Letters 1, Letters 2, Numbers) driven by the GameViewModel.
 */
data class GameUiState(
    // ── Meta ──────────────────────────────────────────────────────────────────
    val currentRound: Int       = 0,    // 0 = letters1, 1 = letters2, 2 = numbers
    val phase: GamePhase        = GamePhase.SELECTING,
    val isLoading: Boolean      = true,
    val challenge: DailyChallenge? = null,

    // ── Timer ─────────────────────────────────────────────────────────────────
    val timeRemaining: Int      = 60,   // seconds
    val countdownValue: Int     = 3,    // 3-2-1 pre-round countdown

    // ── Letters round state ───────────────────────────────────────────────────
    val selectedLetters: List<Char>    = emptyList(),
    val currentWord: List<Char>        = emptyList(),     // letters placed in word builder
    val currentWordIndices: List<Int>  = emptyList(),     // indices of used tiles
    val vowelCount: Int                = 0,
    val consonantCount: Int            = 0,
    val submittedWord: String          = "",
    val wordIsValid: Boolean?          = null,    // null = not yet validated
    val wordScore: Int                 = 0,
    val bestWords: List<String>        = emptyList(),
    val maxPossibleScore: Int          = 0,

    // ── Numbers round state ───────────────────────────────────────────────────
    val numbers: List<Int>             = emptyList(),
    val target: Int                    = 0,
    val availableNums: List<Int>       = emptyList(),     // numbers still usable
    val equationSteps: List<EquationStep> = emptyList(),
    val currentLeft: Int?              = null,
    val currentOp: Operation?          = null,
    val numbersResult: Int?            = null,   // user's final value
    val numbersScore: Int              = 0,
    val solution: List<EquationStep>?  = null,   // solver's answer

    // ── Numbers picker (selecting phase) ──────────────────────────────────────
    val pickedNumbers: List<Int>       = emptyList(),
    val numLargePool: List<Int>        = listOf(25, 50, 75, 100).shuffled(),
    val numSmallPool: List<Int>        = listOf(1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10).shuffled(),

    // ── Completed round results (for summary) ─────────────────────────────────
    val letterResult1: LetterRoundResult? = null,
    val letterResult2: LetterRoundResult? = null,
    val numberResult: NumberRoundResult?  = null
) {

    val totalRounds: Int get() = 3

    val isLettersRound: Boolean get() = currentRound < 2

    /** Letters available for selection in the current letters round (not yet picked). */
    val availableLetters: List<Char>
        get() = if (challenge == null) emptyList() else {
            val pool = if (currentRound == 0) challenge.letterRound1 else challenge.letterRound2
            pool
        }
}
