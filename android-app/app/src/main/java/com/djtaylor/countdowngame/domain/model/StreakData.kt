package com.djtaylor.countdowngame.domain.model

import kotlinx.serialization.Serializable

/**
 * Persisted result for a single day's game.
 */
@Serializable
data class DailyResult(
    val dateKey: String,
    val lettersScore1: Int = 0,
    val lettersMax1: Int = 0,
    val letterWord1: String = "",
    val lettersScore2: Int = 0,
    val lettersMax2: Int = 0,
    val letterWord2: String = "",
    val numbersScore: Int = 0,
    val completed: Boolean = false  // true when all 3 rounds submitted
) {
    val lettersScore: Int get() = lettersScore1 + lettersScore2
    val lettersMax: Int get() = lettersMax1 + lettersMax2
    val totalScore: Int get() = lettersScore + numbersScore
}

/**
 * Running streak and history.
 */
@Serializable
data class StreakData(
    val currentPlayStreak: Int = 0,
    val currentCompleteStreak: Int = 0,
    val bestPlayStreak: Int = 0,
    val bestCompleteStreak: Int = 0,
    val lastPlayDate: String? = null,
    val lastCompleteDate: String? = null,
    val totalGamesPlayed: Int = 0,
    val totalGamesCompleted: Int = 0,
    val history: List<DailyResult> = emptyList()
)
