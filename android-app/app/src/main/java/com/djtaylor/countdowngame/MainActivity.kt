package com.djtaylor.countdowngame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.rememberNavController
import com.djtaylor.countdowngame.ui.navigation.AppNavigation
import com.djtaylor.countdowngame.ui.theme.CountdownGameTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CountdownGameTheme {
                val navController = rememberNavController()
                AppNavigation(navController = navController)
            }
        }
    }
}
