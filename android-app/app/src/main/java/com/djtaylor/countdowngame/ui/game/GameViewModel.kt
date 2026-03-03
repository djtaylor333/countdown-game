package com.djtaylor.countdowngame.ui.game

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.djtaylor.countdowngame.data.PreferencesRepository
import com.djtaylor.countdowngame.data.WordRepository
import com.djtaylor.countdowngame.domain.engine.DailyChallengeEngine
import com.djtaylor.countdowngame.domain.engine.LettersEngine
import com.djtaylor.countdowngame.domain.engine.NumbersEngine
import com.djtaylor.countdowngame.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject

@HiltViewModel
class GameViewModel @Inject constructor(
    private val wordRepository: WordRepository,
    private val preferencesRepository: PreferencesRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null
    private var countdownJob: Job? = null

    init {
        loadChallenge()
    }

    private fun loadChallenge() {
        val todayKey  = DailyChallengeEngine.getTodayKey()
        val challenge = DailyChallengeEngine.getDailyChallenge(todayKey)
        _uiState.update { it.copy(
            isLoading  = false,
            challenge  = challenge,
            phase      = GamePhase.SELECTING,
            numbers    = challenge.numbers,
            target     = challenge.target,
            availableNums = challenge.numbers
        ) }
    }

    // ── Round lifecycle ───────────────────────────────────────────────────────

    /** User taps "Ready" — start 3-2-1 countdown. */
    fun startCountdown() {
        _uiState.update { it.copy(phase = GamePhase.COUNTDOWN, countdownValue = 3) }
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            for (i in 3 downTo 1) {
                _uiState.update { it.copy(countdownValue = i) }
                delay(1000)
            }
            startPlaying()
        }
    }

    /** User taps "Large" during numbers selecting phase. */
    fun pickLargeNumber() {
        val state = _uiState.value
        if (state.pickedNumbers.size >= 6 || state.numLargePool.isEmpty()) return
        val n = state.numLargePool.first()
        _uiState.update { it.copy(
            pickedNumbers = it.pickedNumbers + n,
            numLargePool  = it.numLargePool.drop(1)
        ) }
    }

    /** User taps "Small" during numbers selecting phase. */
    fun pickSmallNumber() {
        val state = _uiState.value
        if (state.pickedNumbers.size >= 6 || state.numSmallPool.isEmpty()) return
        val n = state.numSmallPool.first()
        _uiState.update { it.copy(
            pickedNumbers = it.pickedNumbers + n,
            numSmallPool  = it.numSmallPool.drop(1)
        ) }
    }

    private fun startPlaying() {
        val challenge = _uiState.value.challenge ?: return
        val round     = _uiState.value.currentRound
        val letters   = if (round == 0) challenge.letterRound1 else challenge.letterRound2
        val nums      = if (round == 2) _uiState.value.pickedNumbers else challenge.numbers
        _uiState.update { it.copy(
            phase            = GamePhase.PLAYING,
            timeRemaining    = 60,
            selectedLetters  = letters,
            currentWord      = emptyList(),
            currentWordIndices = emptyList(),
            equationSteps    = emptyList(),
            availableNums    = nums,
            currentLeft      = null,
            currentOp        = null
        ) }
        startTimer()
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewModelScope.launch {
            for (seconds in 60 downTo 0) {
                if (!isActive) break
                _uiState.update { it.copy(timeRemaining = seconds) }
                if (seconds == 0) {
                    submitAnswer()
                    break
                }
                delay(1000)
            }
        }
    }

    /** User taps "Stop the Clock" or timer hits 0. */
    fun submitAnswer() {
        timerJob?.cancel()
        _uiState.update { it.copy(phase = GamePhase.SUBMITTING) }
    }

    // ── Letters interaction ───────────────────────────────────────────────────

    /** User taps a letter tile to add it to the word being built. */
    fun addLetter(index: Int) {
        val state = _uiState.value
        if (state.phase != GamePhase.PLAYING) return
        if (index in state.currentWordIndices) return
        val letter = state.selectedLetters.getOrNull(index) ?: return
        _uiState.update { it.copy(
            currentWord        = it.currentWord + letter,
            currentWordIndices = it.currentWordIndices + index
        ) }
    }

    /** Remove the last letter placed in the word builder. */
    fun removeLetter() {
        val state = _uiState.value
        if (state.currentWord.isEmpty()) return
        _uiState.update { it.copy(
            currentWord        = it.currentWord.dropLast(1),
            currentWordIndices = it.currentWordIndices.dropLast(1)
        ) }
    }

    fun clearWord() {
        _uiState.update { it.copy(
            currentWord        = emptyList(),
            currentWordIndices = emptyList()
        ) }
    }

    /** Submit the built word for validation. */
    fun submitWord(word: String) {
        val state = _uiState.value
        viewModelScope.launch {
            val letters  = state.challenge?.let {
                if (state.currentRound == 0) it.letterRound1 else it.letterRound2
            } ?: return@launch

            val wordSet  = wordRepository.getWordSet()
            val canForm  = LettersEngine.canFormWord(word, letters)
            val inDict   = wordSet.contains(word.uppercase())
            val valid    = canForm && inDict
            val score    = if (valid) LettersEngine.scoreLetterRound(word) else 0
            val bestWords = withContext(Dispatchers.Default) {
                LettersEngine.findBestWords(letters, wordSet, limit = 5)
            }
            val maxScore = bestWords.firstOrNull()?.let { LettersEngine.scoreLetterRound(it) } ?: 0

            _uiState.update { it.copy(
                submittedWord    = word.uppercase(),
                wordIsValid      = valid,
                wordScore        = score,
                bestWords        = bestWords,
                maxPossibleScore = maxScore,
                phase            = GamePhase.RESULTS
            ) }
        }
    }

    // ── Numbers interaction ───────────────────────────────────────────────────

    fun selectNumber(value: Int) {
        val state = _uiState.value
        if (state.phase != GamePhase.PLAYING) return
        if (state.currentLeft == null) {
            // First operand
            _uiState.update { it.copy(
                currentLeft   = value,
                availableNums = it.availableNums.toMutableList().apply { remove(value) }
            ) }
        }
        // Second operand selected after op is set
        else if (state.currentOp != null) {
            val left   = state.currentLeft  // Int? — checked by outer else if
            val op     = state.currentOp   // Operation? — checked by else if
            if (left == null) return
            val result: Int? = when (op) {
                Operation.PLUS   -> left + value
                Operation.MINUS  -> if (left - value > 0) left - value else null
                Operation.TIMES  -> left * value
                Operation.DIVIDE -> if (value != 0 && left % value == 0) left / value else null
                null             -> null
            }
            if (result != null && result > 0) {
                val step = EquationStep(left = left, op = op, right = value, result = result)
                val newAvailable = state.availableNums.toMutableList().apply { remove(value); add(result) }
                _uiState.update { it.copy(
                    equationSteps = it.equationSteps + step,
                    availableNums = newAvailable,
                    currentLeft   = null,
                    currentOp     = null
                ) }
            } else {
                // Invalid operation — put left operand back
                _uiState.update { it.copy(
                    currentLeft   = null,
                    currentOp     = null,
                    availableNums = it.availableNums.toMutableList().apply { add(left); sort() }
                ) }
            }
        }
    }

    fun selectOperation(op: Operation) {
        if (_uiState.value.currentLeft != null) {
            _uiState.update { it.copy(currentOp = op) }
        }
    }

    fun undoNumberStep() {
        val state = _uiState.value
        // If just selected left operand (or op), cancel that
        val leftVal = state.currentLeft
        if (leftVal != null) {
            _uiState.update { it.copy(
                currentLeft   = null,
                currentOp     = null,
                availableNums = it.availableNums.toMutableList().apply { add(leftVal); sort() }
            ) }
            return
        }
        // Otherwise undo last committed step
        val lastStep = state.equationSteps.lastOrNull() ?: return
        val newAvailable = state.availableNums.toMutableList().apply {
            remove(lastStep.result)
            add(lastStep.left)
            add(lastStep.right)
            sort()
        }
        _uiState.update { it.copy(
            equationSteps = it.equationSteps.dropLast(1),
            availableNums = newAvailable
        ) }
    }

    fun clearNumberSteps() {
        val state = _uiState.value
        _uiState.update { it.copy(
            equationSteps = emptyList(),
            availableNums = state.pickedNumbers,
            currentLeft   = null,
            currentOp     = null
        ) }
    }

    /** Submit user's number solution after timer ends. */
    fun submitNumbers() {
        val state = _uiState.value
        viewModelScope.launch {
            val (valid, finalResult) = NumbersEngine.validateSteps(state.equationSteps, state.pickedNumbers)
            val userResult = if (valid) finalResult else null
            val diff       = if (userResult != null) kotlin.math.abs(userResult - state.target) else state.target
            val score      = if (valid && userResult != null) NumbersEngine.scoreNumbersRound(diff) else 0
            val solution   = withContext(Dispatchers.Default) {
                NumbersEngine.solveNumbers(state.pickedNumbers, state.target).steps
            }
            _uiState.update { it.copy(
                numbersResult = userResult,
                numbersScore  = score,
                solution      = solution,
                phase         = GamePhase.RESULTS
            ) }
        }
    }

    // ── Round completion ──────────────────────────────────────────────────────

    /** User taps "Next Round" from results view. */
    fun advanceRound() {
        val state = _uiState.value

        // Persist completed round result
        val letterResult1 = if (state.currentRound == 0) buildLetterResult(state) else state.letterResult1
        val letterResult2 = if (state.currentRound == 1) buildLetterResult(state) else state.letterResult2
        val numberResult  = if (state.currentRound == 2) buildNumberResult(state) else state.numberResult

        if (state.currentRound < 2) {
            // Move to next round
            _uiState.update { it.copy(
                currentRound  = it.currentRound + 1,
                phase         = GamePhase.SELECTING,
                letterResult1 = letterResult1,
                letterResult2 = letterResult2,
                numberResult  = numberResult,
                currentWord   = emptyList(),
                currentWordIndices = emptyList(),
                submittedWord = "",
                wordIsValid   = null,
                wordScore     = 0,
                equationSteps = emptyList(),
                availableNums = emptyList(),
                currentLeft   = null,
                currentOp     = null,
                pickedNumbers = emptyList(),
                numLargePool  = listOf(25, 50, 75, 100).shuffled(),
                numSmallPool  = listOf(1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10).shuffled()
            ) }
        } else {
            // All 3 rounds done — save and move to complete
            viewModelScope.launch {
                saveDailyResult(letterResult1, letterResult2, numberResult, state)
            }
            _uiState.update { it.copy(
                phase         = GamePhase.COMPLETE,
                letterResult1 = letterResult1,
                letterResult2 = letterResult2,
                numberResult  = numberResult
            ) }
        }
    }

    private fun buildLetterResult(state: GameUiState): LetterRoundResult = LetterRoundResult(
        userWord         = state.submittedWord,
        userWordValid    = state.wordIsValid == true,
        userScore        = state.wordScore,
        bestWords        = state.bestWords.map { BestWord(it) },
        maxPossibleScore = state.maxPossibleScore
    )

    private fun buildNumberResult(state: GameUiState): NumberRoundResult = NumberRoundResult(
        userResult = state.numbersResult,
        userSteps  = state.equationSteps,
        userScore  = state.numbersScore,
        solution   = state.solution,
        target     = state.target
    )

    private suspend fun saveDailyResult(
        letterResult1: LetterRoundResult?,
        letterResult2: LetterRoundResult?,
        numberResult: NumberRoundResult?,
        state: GameUiState
    ) {
        val todayKey = state.challenge?.dateKey ?: return
        val result = DailyResult(
            dateKey      = todayKey,
            lettersScore1 = letterResult1?.userScore ?: 0,
            lettersMax1   = letterResult1?.maxPossibleScore ?: 0,
            letterWord1   = letterResult1?.userWord ?: "",
            lettersScore2 = letterResult2?.userScore ?: 0,
            lettersMax2   = letterResult2?.maxPossibleScore ?: 0,
            letterWord2   = letterResult2?.userWord ?: "",
            numbersScore  = numberResult?.userScore ?: 0,
            completed     = true
        )
        preferencesRepository.recordDailyPlay(result)
    }

    override fun onCleared() {
        super.onCleared()
        timerJob?.cancel()
        countdownJob?.cancel()
    }
}
