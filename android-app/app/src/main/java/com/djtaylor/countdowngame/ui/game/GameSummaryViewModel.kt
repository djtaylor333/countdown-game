package com.djtaylor.countdowngame.ui.game

import androidx.lifecycle.ViewModel
import com.djtaylor.countdowngame.data.GameResultStore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

@HiltViewModel
class GameSummaryViewModel @Inject constructor(
    private val gameResultStore: GameResultStore
) : ViewModel() {

    private val _summary = MutableStateFlow(gameResultStore.lastSummary)
    val summary: StateFlow<GameResultStore.GameSummary?> = _summary.asStateFlow()

    val totalScore: Int get() = _summary.value?.let { gameResultStore.totalScore(it) } ?: 0
    val maxScore:   Int get() = _summary.value?.let { gameResultStore.maxScore(it) } ?: 0
}
