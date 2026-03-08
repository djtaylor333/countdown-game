package com.djtaylor.countdowngame.ui.game

import com.djtaylor.countdowngame.domain.model.*

/**
 * Immutable UI state for the game screen.
 * Supports daily (3 rounds), practice (3 rounds, no timer),
 * and full game (9 rounds) modes.
 */
data class GameUiState(
    // ── Session mode ──────────────────────────────────────────────────────────
    val mode: AppMode               = AppMode.DAILY,
    val timerEnabled: Boolean       = true,
    val roundDefs: List<RoundDef>   = emptyList(),  // one entry per round

    // ── Meta ──────────────────────────────────────────────────────────────────
    val currentRound: Int       = 0,    // 0-based round index
    val phase: GamePhase        = GamePhase.SELECTING,
    val isLoading: Boolean      = true,
    val challenge: DailyChallenge? = null,

    // ── Timer ─────────────────────────────────────────────────────────────────
    val timeRemaining: Int      = 60,   // seconds
    val countdownValue: Int     = 3,    // 3-2-1 pre-round countdown
    /** True when the 60-second round timer hit zero (auto-submit fired). */
    val timedOut: Boolean       = false,

    // ── Letters round state ───────────────────────────────────────────────────
    val selectedLetters: List<Char>    = emptyList(),
    val currentWord: List<Char>        = emptyList(),
    val currentWordIndices: List<Int>  = emptyList(),
    val vowelCount: Int                = 0,
    val consonantCount: Int            = 0,
    val submittedWord: String          = "",
    val wordIsValid: Boolean?          = null,
    val wordScore: Int                 = 0,
    val bestWords: List<String>        = emptyList(),
    val maxPossibleScore: Int          = 0,

    // ── Numbers round state ───────────────────────────────────────────────────
    val numbers: List<Int>             = emptyList(),
    val target: Int                    = 0,
    val availableNums: List<Int>       = emptyList(),
    val equationSteps: List<EquationStep> = emptyList(),
    val currentLeft: Int?              = null,
    val currentOp: Operation?          = null,
    val numbersResult: Int?            = null,
    val numbersScore: Int              = 0,
    val solution: List<EquationStep>?  = null,

    // ── Numbers picker (selecting phase) ──────────────────────────────────────
    val pickedNumbers: List<Int>       = emptyList(),
    val numLargePool: List<Int>        = listOf(25, 50, 75, 100),
    val numSmallPool: List<Int>        = listOf(1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10),

    // ── Completed round results ───────────────────────────────────────────────
    val letterResult1: LetterRoundResult? = null,
    val letterResult2: LetterRoundResult? = null,
    val numberResult: NumberRoundResult?  = null,

    /** Generic per-round results list (used for practice/full game summaries). */
    val roundResults: List<Any?> = emptyList()
) {

    val totalRounds: Int get() = roundDefs.size.coerceAtLeast(3)

    val isLettersRound: Boolean
        get() = roundDefs.getOrNull(currentRound)?.type == GameMode.LETTERS
            ?: (currentRound < 2)   // fallback for empty roundDefs

    /** Letters for the current round — from daily challenge or seeded generation. */
    val availableLetters: List<Char>
        get() {
            val def = roundDefs.getOrNull(currentRound)
            return when {
                def != null && def.type == GameMode.LETTERS -> selectedLetters
                challenge != null -> if (currentRound == 0) challenge.letterRound1 else challenge.letterRound2
                else -> emptyList()
            }
        }
}

