package com.djtaylor.countdowngame.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.djtaylor.countdowngame.domain.model.AppMode
import com.djtaylor.countdowngame.ui.game.GameScreen
import com.djtaylor.countdowngame.ui.game.GameSummaryScreen
import com.djtaylor.countdowngame.ui.home.HomeScreen
import com.djtaylor.countdowngame.ui.results.ResultsScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController    = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onPlayClick        = { navController.navigate(Screen.Game.withMode(AppMode.DAILY)) },
                onPracticeClick    = { navController.navigate(Screen.Game.withMode(AppMode.PRACTICE)) },
                onFullGameClick    = { navController.navigate(Screen.Game.withMode(AppMode.FULL)) },
                onViewResults      = {
                    navController.navigate(Screen.Results.route) {
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(
            route     = Screen.Game.route,
            arguments = listOf(navArgument("mode") {
                type         = NavType.StringType
                defaultValue = AppMode.DAILY.name
            })
        ) {
            GameScreen(
                onGameComplete = {
                    navController.navigate(Screen.Results.route) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onGameSummary  = {
                    navController.navigate(Screen.GameSummary.route) {
                        popUpTo(Screen.Home.route)
                    }
                },
                onNavigateHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Results.route) {
            ResultsScreen(
                onPlayAgainTomorrow = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.GameSummary.route) {
            GameSummaryScreen(
                onPlayAgain = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                },
                onHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }
    }
}
