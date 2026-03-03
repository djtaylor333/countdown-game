package com.djtaylor.countdowngame.ui.home

import com.djtaylor.countdowngame.domain.model.DailyChallenge
import com.djtaylor.countdowngame.domain.model.DailyResult
import com.djtaylor.countdowngame.domain.model.StreakData

data class HomeUiState(
    val isLoading: Boolean           = true,
    val todayKey: String             = "",
    val challenge: DailyChallenge?   = null,
    val streakData: StreakData       = StreakData(),
    val todayResult: DailyResult?    = null
) {
    /** True if the user has started (or completed) today's game. */
    val hasPlayedToday: Boolean
        get() = todayResult != null

    /** True if all 3 rounds were submitted. */
    val hasCompletedToday: Boolean
        get() = todayResult?.completed == true

    val currentPlayStreak: Int
        get() = streakData.currentPlayStreak

    val currentCompleteStreak: Int
        get() = streakData.currentCompleteStreak
}
