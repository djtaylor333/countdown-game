package com.djtaylor.countdowngame.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.djtaylor.countdowngame.ui.game.GameScreen
import com.djtaylor.countdowngame.ui.home.HomeScreen
import com.djtaylor.countdowngame.ui.results.ResultsScreen

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(
        navController   = navController,
        startDestination = Screen.Home.route
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onPlayClick = { navController.navigate(Screen.Game.route) },
                onViewResults = {
                    navController.navigate(Screen.Results.route) {
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(Screen.Game.route) {
            GameScreen(
                onGameComplete = {
                    navController.navigate(Screen.Results.route) {
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
    }
}
