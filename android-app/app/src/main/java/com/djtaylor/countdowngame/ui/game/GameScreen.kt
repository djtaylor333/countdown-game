package com.djtaylor.countdowngame.ui.game

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.djtaylor.countdowngame.domain.engine.LettersEngine
import com.djtaylor.countdowngame.domain.model.AppMode
import com.djtaylor.countdowngame.domain.model.GameMode
import com.djtaylor.countdowngame.domain.model.GamePhase
import com.djtaylor.countdowngame.domain.model.Operation
import com.djtaylor.countdowngame.ui.theme.*
import com.djtaylor.countdowngame.ui.theme.SpaceGroteskFamily
import com.djtaylor.countdowngame.ui.theme.RajdhaniFamily

@Composable
fun GameScreen(
    onGameComplete: () -> Unit,
    onGameSummary: () -> Unit = {},
    onNavigateHome: () -> Unit,
    viewModel: GameViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    // Show the Times Up dialog overlay when the timer fires and results are ready
    var showTimedOutPanel by remember { mutableStateOf(false) }
    LaunchedEffect(state.timedOut, state.phase) {
        if (state.timedOut && state.phase == GamePhase.RESULTS) showTimedOutPanel = true
    }
    LaunchedEffect(state.currentRound) {
        showTimedOutPanel = false
    }

    // Navigate out when all rounds done
    LaunchedEffect(state.phase) {
        if (state.phase == GamePhase.COMPLETE) {
            if (state.mode == AppMode.DAILY) onGameComplete()
            else onGameSummary()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(NavyDeep, Navy)))
    ) {
        if (state.isLoading) {
            CircularProgressIndicator(Modifier.align(Alignment.Center), color = Gold)
            return@Box
        }

        // ── Times Up dialog overlay ───────────────────────────────────────────
        if (showTimedOutPanel) {
            TimesUpDialog(
                state    = state,
                onDismiss = { showTimedOutPanel = false }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // ── Top bar ───────────────────────────────────────────────────────
            GameTopBar(
                roundIndex    = state.currentRound,
                totalRounds   = state.totalRounds,
                roundDefs     = state.roundDefs,
                timerEnabled  = state.timerEnabled,
                phase         = state.phase,
                timeRemaining = state.timeRemaining,
                onHome        = onNavigateHome
            )

            Spacer(Modifier.height(12.dp))

            // ── Phase content ─────────────────────────────────────────────────
            AnimatedContent(
                targetState = state.phase,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "phase"
            ) { phase ->
                when (phase) {
                    GamePhase.SELECTING -> SelectingPhase(
                        state       = state,
                        onReady     = viewModel::startCountdown,
                        onPickLarge = viewModel::pickLargeNumber,
                        onPickSmall = viewModel::pickSmallNumber
                    )
                    GamePhase.COUNTDOWN -> CountdownPhase(state.countdownValue)
                    GamePhase.PLAYING   -> if (state.isLettersRound)
                        LettersPlayingPhase(state = state, viewModel = viewModel)
                    else
                        NumbersPlayingPhase(state = state, viewModel = viewModel)
                    GamePhase.SUBMITTING -> if (state.isLettersRound)
                        LettersSubmittingPhase(state = state, onSubmitWord = viewModel::submitWord)
                    else
                        NumbersSubmittingPhase(state = state, onSubmitNumbers = viewModel::submitNumbers)
                    GamePhase.RESULTS   -> RoundResultsPhase(state = state, onNext = viewModel::advanceRound)
                    GamePhase.COMPLETE  -> { /* handled by LaunchedEffect above */ }
                }
            }
        }
    }
}

// ── Top bar ────────────────────────────────────────────────────────────────────

@Composable
private fun GameTopBar(
    roundIndex: Int,
    totalRounds: Int,
    roundDefs: List<com.djtaylor.countdowngame.domain.model.RoundDef>,
    timerEnabled: Boolean,
    phase: GamePhase,
    timeRemaining: Int,
    onHome: () -> Unit
) {
    // Build dynamic round names from defs if available
    val roundNames: List<String> = if (roundDefs.isEmpty()) {
        listOf("Letters 1", "Letters 2", "Numbers")
    } else {
        var lIdx = 0; var nIdx = 0
        roundDefs.map { def ->
            if (def.type == GameMode.LETTERS) "Letters ${++lIdx}"
            else "Numbers ${++nIdx}"
        }
    }
    Row(
        modifier            = Modifier.fillMaxWidth(),
        verticalAlignment   = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        IconButton(onClick = onHome) {
            Icon(Icons.Default.Home, "Home", tint = TextSecondary)
        }
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text       = roundNames.getOrElse(roundIndex) { "Round" },
                fontWeight = FontWeight.Bold,
                fontFamily = RajdhaniFamily,
                color      = Gold,
                fontSize   = 17.sp,
                textAlign  = TextAlign.Center,
                modifier   = Modifier.fillMaxWidth()
            )
            // Round progress dots (capped at 9 for layout)
            val dotsToShow = totalRounds.coerceAtMost(9)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                (0 until dotsToShow).forEach { idx ->
                    val dotSize = if (dotsToShow <= 3) 8.dp else 6.dp
                    Box(
                        modifier = Modifier
                            .size(dotSize)
                            .clip(CircleShape)
                            .background(if (idx <= roundIndex) Gold else TextMuted)
                    )
                }
            }
        }
        // Timer or practice indicator
        if (!timerEnabled) {
            Text(
                text      = "∞",
                fontSize  = 24.sp,
                color     = TextSecondary,
                modifier  = Modifier.widthIn(min = 48.dp),
                textAlign = TextAlign.End
            )
        } else if (phase == GamePhase.PLAYING) {
            val timerColor = when {
                timeRemaining <= 5  -> TimerRed
                timeRemaining <= 10 -> TimerAmber
                else                -> TimerGreen
            }
            Text(
                text       = timeRemaining.toString(),
                fontSize   = 28.sp,
                fontWeight = FontWeight.Black,
                color      = timerColor,
                modifier   = Modifier.widthIn(min = 48.dp),
                textAlign  = TextAlign.End
            )
        } else {
            Spacer(Modifier.width(48.dp))
        }
    }
}

// ── Selecting phase ────────────────────────────────────────────────────────────

@Composable
private fun SelectingPhase(
    state: GameUiState,
    onReady: () -> Unit,
    onPickLarge: () -> Unit = {},
    onPickSmall: () -> Unit = {}
) {
    Column(
        modifier            = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (state.isLettersRound) {
            val letters = state.availableLetters
            Text(
                "Your 9 Letters",
                color      = TextSecondary,
                fontSize   = 14.sp,
                fontFamily = RajdhaniFamily,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(Modifier.height(24.dp))
            LetterTileRow(letters = letters.map { it.toString() }, selectedIndices = emptySet())
        } else {
            // Numbers round — interactive picker
            Text(
                "Pick your 6 numbers",
                color      = TextSecondary,
                fontSize   = 14.sp,
                fontFamily = RajdhaniFamily,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text      = "${state.pickedNumbers.size}/6 chosen  •  up to 4 large",
                fontSize  = 12.sp,
                color     = TextMuted
            )
            Spacer(Modifier.height(16.dp))

            // Target
            Text("Target", color = TextSecondary, fontSize = 12.sp)
            Text(
                text       = state.target.toString(),
                fontSize   = 40.sp,
                fontWeight = FontWeight.Black,
                color      = Gold
            )
            Spacer(Modifier.height(16.dp))

            // Picked number tiles
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                val largeTile = setOf(25, 50, 75, 100)
                repeat(6) { idx ->
                    if (idx < state.pickedNumbers.size) {
                        val n       = state.pickedNumbers[idx]
                        val isLarge = n in largeTile
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(
                                    if (isLarge) NavyDeep else NavyDark,
                                    RoundedCornerShape(10.dp)
                                )
                                .border(2.dp, if (isLarge) Gold else TileBlueBorder, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text       = n.toString(),
                                fontSize   = if (n >= 100) 11.sp else 16.sp,
                                fontWeight = FontWeight.Bold,
                                color      = if (isLarge) Gold else TextPrimary
                            )
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .border(2.dp, color = TextMuted, shape = RoundedCornerShape(10.dp))
                        )
                    }
                }
            }
            Spacer(Modifier.height(24.dp))

            // Large / Small buttons
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                val largeUsed   = state.pickedNumbers.count { it in setOf(25, 50, 75, 100) }
                val canLarge    = state.pickedNumbers.size < 6 && state.numLargePool.isNotEmpty() && largeUsed < 4
                val canSmall    = state.pickedNumbers.size < 6 && state.numSmallPool.isNotEmpty()

                Button(
                    onClick  = onPickLarge,
                    enabled  = canLarge,
                    colors   = ButtonDefaults.buttonColors(containerColor = if (canLarge) NavyDark else NavyDeep, contentColor = Gold),
                    shape    = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(60.dp).width(120.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("25–100", fontWeight = FontWeight.Black, fontSize = 14.sp)
                        Text("Large", fontSize = 11.sp)
                    }
                }

                Button(
                    onClick  = onPickSmall,
                    enabled  = canSmall,
                    colors   = ButtonDefaults.buttonColors(containerColor = if (canSmall) Navy else NavyDeep, contentColor = TextPrimary),
                    shape    = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(60.dp).width(120.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("1–10", fontWeight = FontWeight.Black, fontSize = 14.sp)
                        Text("Small", fontSize = 11.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(32.dp))
        Button(
            onClick  = onReady,
            enabled  = if (state.isLettersRound) true else state.pickedNumbers.size == 6,
            colors   = ButtonDefaults.buttonColors(containerColor = Gold),
            shape    = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth(0.6f).height(52.dp)
        ) {
            Text(
                if (state.isLettersRound) "Ready!" else "Start Round",
                fontWeight = FontWeight.Bold,
                color      = NavyDeep,
                fontSize   = 16.sp
            )
        }
    }
}

// ── Countdown phase ────────────────────────────────────────────────────────────

@Composable
private fun CountdownPhase(value: Int) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text       = if (value > 0) value.toString() else "GO!",
            fontSize   = 96.sp,
            fontWeight = FontWeight.Black,
            color      = Gold
        )
    }
}

// ── Letters playing phase ──────────────────────────────────────────────────────

@Composable
private fun LettersPlayingPhase(state: GameUiState, viewModel: GameViewModel) {
    Column(
        modifier            = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Letter tiles
        LetterTileRow(
            letters          = state.selectedLetters.map { it.toString() },
            selectedIndices  = state.currentWordIndices.toSet(),
            onTap            = viewModel::addLetter
        )

        // Word builder
        Card(
            modifier = Modifier.fillMaxWidth().height(64.dp),
            colors   = CardDefaults.cardColors(containerColor = NavyDark),
            shape    = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier          = Modifier.fillMaxSize().padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text       = state.currentWord.joinToString(""),
                    fontSize   = 28.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = SpaceGroteskFamily,
                    color      = if (state.currentWord.isEmpty()) TextMuted else Gold,
                    modifier   = Modifier.weight(1f)
                )
                if (state.currentWord.isNotEmpty()) {
                    IconButton(onClick = viewModel::removeLetter) {
                        Icon(Icons.Filled.Backspace, "Remove", tint = TextSecondary)
                    }
                }
            }
        }

        Row(
            modifier              = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick  = viewModel::clearWord,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                border   = androidx.compose.foundation.BorderStroke(1.dp, TextMuted)
            ) { Text("Clear") }

            Button(
                onClick  = viewModel::submitAnswer,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.buttonColors(containerColor = Gold),
                shape    = RoundedCornerShape(12.dp),
                enabled  = state.currentWord.isNotEmpty() || !state.timerEnabled
            ) { Text(
                if (state.timerEnabled) "Stop Clock" else "Done",
                color = NavyDeep, fontWeight = FontWeight.Bold
            ) }
        }
    }
}

// ── Letters submitting phase ───────────────────────────────────────────────────

@Composable
private fun LettersSubmittingPhase(state: GameUiState, onSubmitWord: (String) -> Unit) {
    var word by remember { mutableStateOf(state.currentWord.joinToString("")) }

    Column(
        modifier            = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        LetterTileRow(
            letters         = state.selectedLetters.map { it.toString() },
            selectedIndices = emptySet()
        )
        Text("Enter your best word:", color = TextSecondary, fontSize = 14.sp)
        OutlinedTextField(
            value         = word,
            onValueChange = { word = it.uppercase().filter { ch -> ch.isLetter() } },
            modifier      = Modifier.fillMaxWidth(),
            label         = { Text("Your word") },
            singleLine    = true,
            colors        = OutlinedTextFieldDefaults.colors(
                focusedBorderColor   = Gold,
                unfocusedBorderColor = TileBlueBorder,
                focusedTextColor     = TextPrimary,
                unfocusedTextColor   = TextPrimary
            )
        )
        Button(
            onClick  = { onSubmitWord(word) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors   = ButtonDefaults.buttonColors(containerColor = Gold),
            shape    = RoundedCornerShape(12.dp),
            enabled  = word.length >= 2
        ) { Text("Submit Word", color = NavyDeep, fontWeight = FontWeight.Bold) }
    }
}

// ── Numbers playing phase ──────────────────────────────────────────────────────

@Composable
private fun NumbersPlayingPhase(state: GameUiState, viewModel: GameViewModel) {
    Column(
        modifier            = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Target
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors   = CardDefaults.cardColors(containerColor = NavyDark),
            shape    = RoundedCornerShape(12.dp)
        ) {
            Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Target", color = TextSecondary, fontSize = 12.sp)
                Text(
                    text       = state.target.toString(),
                    fontSize   = 48.sp,
                    fontWeight = FontWeight.Black,
                    color      = Gold
                )
            }
        }

        // Available numbers
        NumberTileRow(
            numbers     = state.availableNums,
            usedIndices = emptySet(),
            onTap       = viewModel::selectNumber
        )

        // Operation buttons
        Row(
            modifier              = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Operation.entries.forEach { op ->
                OutlinedButton(
                    onClick   = { viewModel.selectOperation(op) },
                    modifier  = Modifier.weight(1f).height(48.dp),
                    shape     = RoundedCornerShape(8.dp),
                    colors    = ButtonDefaults.outlinedButtonColors(
                        contentColor = if (state.currentOp == op) NavyDeep else Gold,
                        containerColor = if (state.currentOp == op) Gold else NavyDark
                    ),
                    border   = androidx.compose.foundation.BorderStroke(1.dp,
                        if (state.currentOp == op) Gold else TileBlueBorder)
                ) { Text(op.symbol, fontWeight = FontWeight.Bold, fontSize = 18.sp) }
            }
        }

        // Current step display
        if (state.currentLeft != null || state.equationSteps.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors   = CardDefaults.cardColors(containerColor = TileBlue),
                shape    = RoundedCornerShape(12.dp)
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    state.equationSteps.forEach { step ->
                        Text(
                            "${step.left} ${step.op.symbol} ${step.right} = ${step.result}",
                            color = TextPrimary, fontSize = 14.sp
                        )
                    }
                    if (state.currentLeft != null) {
                        Text(
                            "${state.currentLeft} ${state.currentOp?.symbol ?: "?"} …",
                            color = Gold, fontSize = 14.sp
                        )
                    }
                }
            }
        }

        Row(
            modifier              = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedButton(
                onClick  = viewModel::undoNumberStep,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                border   = androidx.compose.foundation.BorderStroke(1.dp, TextMuted)
            ) { Text("Undo") }
            OutlinedButton(
                onClick  = viewModel::clearNumberSteps,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary),
                border   = androidx.compose.foundation.BorderStroke(1.dp, TextMuted)
            ) { Text("Clear") }
            Button(
                onClick  = viewModel::submitAnswer,
                modifier = Modifier.weight(1f),
                colors   = ButtonDefaults.buttonColors(containerColor = Gold),
                shape    = RoundedCornerShape(12.dp)
            ) { Text("Stop Clock", color = NavyDeep, fontWeight = FontWeight.Bold, fontSize = 12.sp) }
        }
    }
}

// ── Numbers submitting phase ───────────────────────────────────────────────────

@Composable
private fun NumbersSubmittingPhase(state: GameUiState, onSubmitNumbers: () -> Unit) {
    Column(
        modifier            = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text       = "Target: ${state.target}",
            fontSize   = 32.sp,
            fontWeight = FontWeight.Black,
            color      = Gold
        )
        if (state.equationSteps.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors   = CardDefaults.cardColors(containerColor = TileBlue),
                shape    = RoundedCornerShape(12.dp)
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    state.equationSteps.forEach { step ->
                        Text("${step.left} ${step.op.symbol} ${step.right} = ${step.result}", color = TextPrimary)
                    }
                }
            }
        } else {
            Text("No answer submitted", color = TextMuted, fontSize = 14.sp)
        }
        Button(
            onClick  = onSubmitNumbers,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors   = ButtonDefaults.buttonColors(containerColor = Gold),
            shape    = RoundedCornerShape(12.dp)
        ) { Text("Submit Answer", color = NavyDeep, fontWeight = FontWeight.Bold) }
    }
}

// ── Round results phase ────────────────────────────────────────────────────────

@Composable
private fun RoundResultsPhase(state: GameUiState, onNext: () -> Unit) {
    val isLast = state.currentRound == 2
    Column(
        modifier            = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        if (state.isLettersRound) {
            // Letters result
            val valid = state.wordIsValid == true
            Text(
                text       = if (state.submittedWord.isEmpty()) "No word submitted" else state.submittedWord,
                fontSize   = 36.sp,
                fontWeight = FontWeight.Black,
                color      = if (valid) Success else if (state.submittedWord.isEmpty()) TextMuted else Error
            )
            Text(
                text  = if (!valid && state.submittedWord.isNotEmpty()) "Not in dictionary"
                        else if (valid) "+${state.wordScore} pts" else "",
                color = if (valid) Success else Error,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
            if (state.bestWords.isNotEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text("Best possible:", color = TextSecondary, fontSize = 13.sp)
                state.bestWords.take(3).forEach { w ->
                    Text(
                        text       = "$w  (${LettersEngine.scoreLetterRound(w)} pts)",
                        color      = if (w == state.submittedWord && valid) Success else Gold,
                        fontSize   = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        } else {
            // Numbers result
            val diff = if (state.numbersResult != null) kotlin.math.abs(state.numbersResult - state.target) else null
            Text(
                text       = if (state.numbersResult != null) state.numbersResult.toString() else "—",
                fontSize   = 48.sp,
                fontWeight = FontWeight.Black,
                color      = when {
                    diff == null  -> TextMuted
                    diff == 0     -> Success
                    diff <= 10    -> Warning
                    else          -> Error
                }
            )
            Text(
                text  = when {
                    diff == null  -> "No answer"
                    diff == 0     -> "Exact! +10 pts"
                    diff <= 5     -> "Within 5 (+7 pts)"
                    diff <= 10    -> "Within 10 (+5 pts)"
                    else          -> "Too far off (0 pts)"
                },
                color = when {
                    diff == null  -> TextMuted
                    diff == 0     -> Success
                    diff <= 10    -> Warning
                    else          -> Error
                },
                fontSize   = 16.sp,
                fontWeight = FontWeight.SemiBold
            )
            if (!state.solution.isNullOrEmpty()) {
                Spacer(Modifier.height(8.dp))
                Text("Solution:", color = TextSecondary, fontSize = 13.sp)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = TileBlue),
                    shape    = RoundedCornerShape(12.dp)
                ) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        state.solution.forEach { step ->
                            Text("${step.left} ${step.op.symbol} ${step.right} = ${step.result}",
                                color = Gold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.weight(1f))

        Button(
            onClick  = onNext,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors   = ButtonDefaults.buttonColors(containerColor = Gold),
            shape    = RoundedCornerShape(16.dp)
        ) {
            Text(
                if (isLast) "See Summary" else "Next Round →",
                color      = NavyDeep,
                fontWeight = FontWeight.Bold,
                fontSize   = 16.sp
            )
        }
    }
}

// ── Times Up dialog ────────────────────────────────────────────────────────────

@Composable
private fun TimesUpDialog(state: GameUiState, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape  = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = NavyDark),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, Gold.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
        ) {
            Column(
                modifier            = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Text("⏰", fontSize = 40.sp)
                Text(
                    "Time's Up!",
                    fontSize   = 28.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = RajdhaniFamily,
                    color      = Gold
                )
                Text(
                    if (state.isLettersRound) "Best words available" else "The solution",
                    fontSize = 13.sp,
                    color    = TextSecondary
                )

                HorizontalDivider(color = TileBlueBorder.copy(alpha = 0.5f))

                if (state.isLettersRound) {
                    TimesUpLettersContent(state)
                } else {
                    TimesUpNumbersContent(state)
                }

                Button(
                    onClick  = onDismiss,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors   = ButtonDefaults.buttonColors(containerColor = Gold),
                    shape    = RoundedCornerShape(14.dp)
                ) {
                    Text("See Results", color = NavyDeep, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}

@Composable
private fun TimesUpLettersContent(state: GameUiState) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Player's word
        Card(
            colors = CardDefaults.cardColors(containerColor = Navy),
            shape  = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier          = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Your word", fontSize = 11.sp, color = TextMuted)
                    Text(
                        state.submittedWord.ifEmpty { "—" },
                        fontSize   = 20.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = SpaceGroteskFamily,
                        color      = TextPrimary
                    )
                }
                when {
                    state.wordIsValid == true ->
                        Text("+${state.wordScore} pts", color = Success, fontWeight = FontWeight.Bold)
                    state.submittedWord.isNotEmpty() ->
                        Text("✗ Invalid", color = Error, fontSize = 12.sp)
                    else ->
                        Text("No word", color = TextMuted, fontSize = 12.sp)
                }
            }
        }

        // Best words
        if (state.bestWords.isNotEmpty()) {
            Text("Best available", fontSize = 11.sp, color = TextMuted)
            state.bestWords.take(3).forEachIndexed { i, word ->
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (i == 0) Gold.copy(alpha = 0.08f) else TileBlue
                    ),
                    shape    = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier          = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            word,
                            fontSize   = 18.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = SpaceGroteskFamily,
                            color      = Gold
                        )
                        val score = LettersEngine.scoreLetterRound(word)
                        Text(
                            if (word.length == 9) "FULL HOUSE!" else "$score pts",
                            fontSize   = 12.sp,
                            color      = if (word.length == 9) Gold else TextSecondary,
                            fontWeight = if (word.length == 9) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TimesUpNumbersContent(state: GameUiState) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        // Target
        Row(
            modifier              = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment     = Alignment.CenterVertically
        ) {
            Text("Target: ", fontSize = 14.sp, color = TextSecondary)
            Text(
                state.target.toString(),
                fontSize   = 28.sp,
                fontWeight = FontWeight.Black,
                color      = Gold
            )
        }

        // Player answer
        val diff = if (state.numbersResult != null) kotlin.math.abs(state.numbersResult - state.target) else null
        Card(
            colors = CardDefaults.cardColors(containerColor = Navy),
            shape  = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier          = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Your answer", fontSize = 11.sp, color = TextMuted)
                if (state.numbersResult != null) {
                    val col = when {
                        diff == 0  -> Success
                        diff != null && diff <= 10 -> Warning
                        else -> Error
                    }
                    Text(
                        text = "${state.numbersResult}${if (diff != null && diff > 0) " ($diff away)" else ""}" ,
                        fontSize = 18.sp, fontWeight = FontWeight.Bold, color = col
                    )
                } else {
                    Text("No answer", color = TextMuted, fontSize = 13.sp)
                }
            }
        }

        // Solution
        if (!state.solution.isNullOrEmpty()) {
            Text("Solution", fontSize = 11.sp, color = TextMuted)
            Card(
                colors = CardDefaults.cardColors(containerColor = Gold.copy(alpha = 0.06f)),
                shape  = RoundedCornerShape(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Gold.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
            ) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    state.solution.forEach { step ->
                        Text(
                            "${step.left} ${step.op.symbol} ${step.right} = ${step.result}",
                            color      = Gold,
                            fontSize   = 14.sp,
                            fontFamily = SpaceGroteskFamily
                        )
                    }
                }
            }
        }
    }
}

// ── Shared components ─────────────────────────────────────────────────────────

@Composable
private fun LetterTileRow(
    letters: List<String>,
    selectedIndices: Set<Int>,
    onTap: ((Int) -> Unit)? = null
) {
    // Use a full-width Row so tiles fill the screen (like web grid-cols-9)
    Row(
        modifier              = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        letters.forEachIndexed { idx, letter ->
            val isSelected = idx in selectedIndices
            Box(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(6.dp))
                    .background(
                        if (isSelected) TileUsed
                        else TileBlue
                    )
                    .border(
                        2.dp,
                        if (isSelected) TextMuted else TileBlueBorder,
                        RoundedCornerShape(6.dp)
                    )
                    .then(
                        if (onTap != null && !isSelected)
                            Modifier.clickable { onTap(idx) }
                        else Modifier
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text       = letter,
                    fontSize   = 14.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = SpaceGroteskFamily,
                    color      = if (isSelected) TextMuted else TextPrimary,
                    textAlign  = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun NumberTileRow(
    numbers: List<Int>,
    usedIndices: Set<Int>,
    onTap: (Int) -> Unit
) {
    val largeSet = setOf(25, 50, 75, 100)
    Row(
        modifier              = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        numbers.forEachIndexed { idx, n ->
            val isLarge = n in largeSet
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(56.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isLarge) NumberTileLarge else TileBlue)
                    .border(
                        2.dp,
                        if (isLarge) Gold.copy(alpha = 0.7f) else TileBlueBorder,
                        RoundedCornerShape(10.dp)
                    )
                    .clickable { onTap(n) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text       = n.toString(),
                    fontSize   = if (n >= 100) 14.sp else 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = SpaceGroteskFamily,
                    color      = if (isLarge) Gold else TextPrimary,
                    textAlign  = TextAlign.Center
                )
            }
        }
    }
}
