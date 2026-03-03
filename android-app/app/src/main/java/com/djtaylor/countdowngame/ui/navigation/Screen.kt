package com.djtaylor.countdowngame.ui.navigation

import com.djtaylor.countdowngame.domain.model.AppMode

/** All navigable destinations in the app. */
sealed class Screen(val route: String) {
    data object Home        : Screen("home")
    data object Results     : Screen("results")
    data object GameSummary : Screen("game-summary")
    data object Game        : Screen("game/{mode}") {
        fun withMode(mode: AppMode) = "game/${mode.name}"
        fun withMode(mode: String)  = "game/$mode"
    }
}
