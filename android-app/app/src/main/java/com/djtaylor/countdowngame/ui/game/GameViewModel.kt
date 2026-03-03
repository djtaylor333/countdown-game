package com.djtaylor.countdowngame.ui.game

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.djtaylor.countdowngame.data.GameResultStore
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
    private val preferencesRepository: PreferencesRepository,
    private val gameResultStore: GameResultStore,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    private var timerJob: Job? = null
    private var countdownJob: Job? = null

    init {
        val modeStr = savedStateHandle.get<String>("mode") ?: AppMode.DAILY.name
        val mode = runCatching { AppMode.valueOf(modeStr) }.getOrDefault(AppMode.DAILY)
        when (mode) {
            AppMode.DAILY    -> loadDailyChallenge()
            AppMode.PRACTICE -> loadPracticeChallenge(System.currentTimeMillis())
            AppMode.FULL     -> loadFullGameChallenge(System.currentTimeMillis())
        }
    }

    // -- Challenge loading ----------------------------------------------------

    private fun loadDailyChallenge() {
        val todayKey  = DailyChallengeEngine.getTodayKey()
        val challenge = DailyChallengeEngine.getDailyChallenge(todayKey)
        val defs      = DailyChallengeEngine.dailyToRoundDefs(challenge)
        _uiState.update { it.copy(
            mode          = AppMode.DAILY,
            timerEnabled  = true,
            roundDefs     = defs,
            isLoading     = false,
            challenge     = challenge,
            phase         = GamePhase.SELECTING,
            numbers       = challenge.numbers,
            target        = challenge.target,
            availableNums = challenge.numbers,
            roundResults  = List(defs.size) { null }
        ) }
        initCurrentRound(0, defs, challenge)
    }

    private fun loadPracticeChallenge(seed: Long) {
        val defs = DailyChallengeEngine.generatePracticeRoundDefs(seed)
        _uiState.update { GameUiState(
            mode         = AppMode.PRACTICE,
            timerEnabled = false,
            roundDefs    = defs,
            isLoading    = false,
            phase        = GamePhase.SELECTING,
            roundResults = List(defs.size) { null }
        ) }
        initCurrentRound(0, defs, null)
    }

    private fun loadFullGameChallenge(seed: Long) {
        val defs = DailyChallengeEngine.generateFullGameRoundDefs(seed)
        _uiState.update { GameUiState(
            mode         = AppMode.FULL,
            timerEnabled = true,
            roundDefs    = defs,
            isLoading    = false,
            phase        = GamePhase.SELECTING,
            roundResults = List(defs.size) { null }
        ) }
        initCurrentRound(0, defs, null)
    }

    /** Prepare number pools and letters for the given round index. */
    private fun initCurrentRound(index: Int, defs: List<RoundDef>, challenge: DailyChallenge?) {
        val def = defs.getOrNull(index) ?: return
        if (def.type == GameMode.NUMBERS) {
            val seed   = (def.numsSeed and 0x7FFFFFFFL).toInt()
            val nums   = NumbersEngine.generateNumbers(def.largeCount, seed)
            val large  = LettersEngine.seededShuffle(listOf(25, 50, 75, 100), seed)
            val small  = LettersEngine.seededShuffle(
                listOf(1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10), seed + 77)
            _uiState.update { it.copy(
                numbers       = nums,
                target        = def.target,
                availableNums = nums,
                numLargePool  = large,
                numSmallPool  = small,
                pickedNumbers = emptyList()
            ) }
        } else {
            val letters: List<Char> = when {
                challenge != null -> {
                    val lettersIdx = defs.take(index + 1).count { it.type == GameMode.LETTERS } - 1
                    if (lettersIdx == 0) challenge.letterRound1 else challenge.letterRound2
                }
                else -> {
                    val seed       = (def.deckSeed and 0x7FFFFFFFL).toInt()
                    val vowelCount = def.largeCount.coerceIn(3, 6)
                    LettersEngine.generateSeededLetters(seed, vowelCount)
                }
            }
            _uiState.update { it.copy(selectedLetters = letters) }
        }
    }

    // -- Round lifecycle -------------------------------------------------------

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

    fun pickLargeNumber() {
        val state = _uiState.value
        if (state.pickedNumbers.size >= 6 || state.numLargePool.isEmpty()) return
        val n = state.numLargePool.first()
        _uiState.update { it.copy(
            pickedNumbers = it.pickedNumbers + n,
            numLargePool  = it.numLargePool.drop(1)
        ) }
    }

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
        val state     = _uiState.value
        val def       = state.roundDefs.getOrNull(state.currentRound)
        val isLetters = def?.type == GameMode.LETTERS || (def == null && state.currentRound < 2)
        val nums: List<Int> = if (!isLetters) state.pickedNumbers else emptyList()

        _uiState.update { it.copy(
            phase              = GamePhase.PLAYING,
            timeRemaining      = 60,
            currentWord        = emptyList(),
            currentWordIndices = emptyList(),
            equationSteps      = emptyList(),
            availableNums      = nums,
            currentLeft        = null,
            currentOp          = null
        ) }
        startTimer()
    }

    private fun startTimer() {
        if (!_uiState.value.timerEnabled) return   // practice mode has no timer
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

    fun submitAnswer() {
        timerJob?.cancel()
        _uiState.update { it.copy(phase = GamePhase.SUBMITTING) }
    }

    // -- Letters interaction ---------------------------------------------------

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

    fun submitWord(word: String) {
        val state   = _uiState.value
        val letters = state.selectedLetters
        if (letters.isEmpty()) return
        viewModelScope.launch {
            val wordSet   = wordRepository.getWordSet()
            val canForm   = LettersEngine.canFormWord(word, letters)
            val inDict    = wordSet.contains(word.uppercase())
            val valid     = canForm && inDict
            val score     = if (valid) LettersEngine.scoreLetterRound(word) else 0
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

    // -- Numbers interaction ---------------------------------------------------

    fun selectNumber(value: Int) {
        val state = _uiState.value
        if (state.phase != GamePhase.PLAYING) return
        if (state.currentLeft == null) {
            _uiState.update { it.copy(
                currentLeft   = value,
                availableNums = it.availableNums.toMutableList().apply { remove(value) }
            ) }
        } else if (state.currentOp != null) {
            val left = state.currentLeft
            val op   = state.currentOp
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
        val state   = _uiState.value
        val leftVal = state.currentLeft
        if (leftVal != null) {
            _uiState.update { it.copy(
                currentLeft   = null,
                currentOp     = null,
                availableNums = it.availableNums.toMutableList().apply { add(leftVal); sort() }
            ) }
            return
        }
        val lastStep = state.equationSteps.lastOrNull() ?: return
        val newAvailable = state.availableNums.toMutableList().apply {
            remove(lastStep.result); add(lastStep.left); add(lastStep.right); sort()
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

    // -- Round completion ------------------------------------------------------

    fun advanceRound() {
        val state     = _uiState.value
        val def       = state.roundDefs.getOrNull(state.currentRound)
        val isLetters = def?.type == GameMode.LETTERS || (def == null && state.currentRound < 2)

        val result: Any? = if (isLetters) buildLetterResult(state) else buildNumberResult(state)
        val newResults = state.roundResults.toMutableList().also {
            if (state.currentRound < it.size) it[state.currentRound] = result
        }

        val letterResult1 = if (state.currentRound == 0 && isLetters)
            result as? LetterRoundResult ?: state.letterResult1 else state.letterResult1
        val letterResult2 = if (state.currentRound == 1 && isLetters)
            result as? LetterRoundResult ?: state.letterResult2 else state.letterResult2
        val numberResult  = if (!isLetters)
            result as? NumberRoundResult ?: state.numberResult else state.numberResult

        val nextRound = state.currentRound + 1

        if (nextRound < state.totalRounds) {
            _uiState.update { it.copy(
                currentRound       = nextRound,
                phase              = GamePhase.SELECTING,
                letterResult1      = letterResult1,
                letterResult2      = letterResult2,
                numberResult       = numberResult,
                roundResults       = newResults,
                currentWord        = emptyList(),
                currentWordIndices = emptyList(),
                submittedWord      = "",
                wordIsValid        = null,
                wordScore          = 0,
                equationSteps      = emptyList(),
                availableNums      = emptyList(),
                currentLeft        = null,
                currentOp          = null,
                pickedNumbers      = emptyList()
            ) }
            initCurrentRound(nextRound, state.roundDefs, state.challenge)
        } else {
            if (state.mode == AppMode.DAILY) {
                viewModelScope.launch {
                    saveDailyResult(letterResult1, letterResult2, numberResult, state)
                }
            } else {
                gameResultStore.lastSummary = GameResultStore.GameSummary(
                    mode         = state.mode,
                    roundDefs    = state.roundDefs,
                    roundResults = newResults
                )
            }
            _uiState.update { it.copy(
                phase         = GamePhase.COMPLETE,
                letterResult1 = letterResult1,
                letterResult2 = letterResult2,
                numberResult  = numberResult,
                roundResults  = newResults
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
        numberResult:  NumberRoundResult?,
        state: GameUiState
    ) {
        val todayKey = state.challenge?.dateKey ?: return
        val result = DailyResult(
            dateKey       = todayKey,
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
