package com.djtaylor.countdowngame.ui.navigation

/** All navigable destinations in the app. */
sealed class Screen(val route: String) {
    data object Home    : Screen("home")
    data object Game    : Screen("game")
    data object Results : Screen("results")
}
