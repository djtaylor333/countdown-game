package com.djtaylor.countdowngame.ui.results

import com.djtaylor.countdowngame.domain.model.DailyResult
import com.djtaylor.countdowngame.domain.model.StreakData

data class ResultsUiState(
    val isLoading: Boolean         = true,
    val todayKey: String           = "",
    val todayResult: DailyResult?  = null,
    val streakData: StreakData     = StreakData()
) {
    val totalScore: Int   get() = todayResult?.totalScore ?: 0
    val maxScore: Int     get() = (todayResult?.lettersMax ?: 0) + 10
    val percentage: Float get() = if (maxScore > 0) totalScore.toFloat() / maxScore else 0f
}
