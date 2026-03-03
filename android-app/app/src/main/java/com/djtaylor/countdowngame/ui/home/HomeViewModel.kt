package com.djtaylor.countdowngame.ui.home

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
class HomeViewModel @Inject constructor(
    private val preferencesRepository: PreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        val todayKey  = DailyChallengeEngine.getTodayKey()
        val challenge = DailyChallengeEngine.getDailyChallenge(todayKey)

        viewModelScope.launch {
            preferencesRepository.streakDataFlow.collect { streakData ->
                val todayResult = streakData.history.find { it.dateKey == todayKey }
                _uiState.update { state ->
                    state.copy(
                        isLoading  = false,
                        todayKey   = todayKey,
                        challenge  = challenge,
                        streakData = streakData,
                        todayResult = todayResult
                    )
                }
            }
        }
    }
}
