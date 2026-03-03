package com.djtaylor.countdowngame.ui.results

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.djtaylor.countdowngame.data.PreferencesRepository
import com.djtaylor.countdowngame.domain.engine.DailyChallengeEngine
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ResultsViewModel @Inject constructor(
    private val preferencesRepository: PreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ResultsUiState())
    val uiState: StateFlow<ResultsUiState> = _uiState.asStateFlow()

    init {
        loadResults()
    }

    private fun loadResults() {
        val todayKey = DailyChallengeEngine.getTodayKey()
        viewModelScope.launch {
            preferencesRepository.streakDataFlow.collect { streakData ->
                val todayResult = streakData.history.find { it.dateKey == todayKey }
                _uiState.update {
                    it.copy(
                        isLoading   = false,
                        todayKey    = todayKey,
                        todayResult = todayResult,
                        streakData  = streakData
                    )
                }
            }
        }
    }
}
