package com.djtaylor.countdowngame.data

import com.djtaylor.countdowngame.domain.model.AppMode
import com.djtaylor.countdowngame.domain.model.LetterRoundResult
import com.djtaylor.countdowngame.domain.model.NumberRoundResult
import com.djtaylor.countdowngame.domain.model.RoundDef
import javax.inject.Inject
import javax.inject.Singleton

/**
 * In-memory store that holds the results of the most recently completed
 * practice or full-game session. GameViewModel writes to it; GameSummaryViewModel reads from it.
 */
@Singleton
class GameResultStore @Inject constructor() {

    data class GameSummary(
        val mode: AppMode,
        val roundDefs: List<RoundDef>,
        val roundResults: List<Any?>
    )

    var lastSummary: GameSummary? = null

    fun totalScore(summary: GameSummary): Int =
        summary.roundResults.sumOf { result ->
            when (result) {
                is LetterRoundResult -> result.userScore
                is NumberRoundResult -> result.userScore
                else -> 0
            }
        }

    fun maxScore(summary: GameSummary): Int =
        summary.roundResults.sumOf { result ->
            when (result) {
                is LetterRoundResult -> result.maxPossibleScore
                is NumberRoundResult -> 10   // max number round score
                else -> 0
            }
        }
}
