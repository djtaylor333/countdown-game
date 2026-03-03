package com.djtaylor.countdowngame.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.djtaylor.countdowngame.data.GameResultStore
import com.djtaylor.countdowngame.domain.model.AppMode
import com.djtaylor.countdowngame.domain.model.GameMode
import com.djtaylor.countdowngame.domain.model.LetterRoundResult
import com.djtaylor.countdowngame.domain.model.NumberRoundResult
import com.djtaylor.countdowngame.domain.model.RoundDef
import com.djtaylor.countdowngame.ui.theme.*

@Composable
fun GameSummaryScreen(
    onPlayAgain: () -> Unit,
    onHome: () -> Unit,
    viewModel: GameSummaryViewModel = hiltViewModel()
) {
    val summary by viewModel.summary.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(NavyDeep, Navy)))
    ) {
        Column(
            modifier            = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            if (summary == null) {
                Text(
                    text  = "No results available",
                    color = TextSecondary,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            } else {
                val s = summary!!
                val mode = when (s.mode) {
                    AppMode.PRACTICE -> "Practice Mode"
                    AppMode.FULL     -> "Full Game"
                    else             -> "Game"
                }

                // Header
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text          = mode.uppercase(),
                        fontSize      = 28.sp,
                        fontWeight    = FontWeight.Black,
                        color         = Gold,
                        letterSpacing = 3.sp
                    )
                    Text(
                        text  = "COMPLETE",
                        fontSize = 14.sp,
                        color = TextSecondary,
                        letterSpacing = 2.sp
                    )
                }

                // Score summary card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = NavyDark),
                    shape    = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier            = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text       = viewModel.totalScore.toString(),
                            fontSize   = 56.sp,
                            fontWeight = FontWeight.Black,
                            color      = Gold
                        )
                        Text(
                            text  = "/ ${viewModel.maxScore} possible",
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }

                // Per-round results list
                LazyColumn(
                    modifier            = Modifier.weight(1f).fillMaxWidth(),
                    contentPadding      = PaddingValues(vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    itemsIndexed(s.roundDefs) { idx, def ->
                        val result = s.roundResults.getOrNull(idx)
                        RoundSummaryRow(index = idx, def = def, result = result)
                    }
                }

                // Action buttons
                Column(
                    modifier            = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick  = onPlayAgain,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape    = RoundedCornerShape(16.dp),
                        colors   = ButtonDefaults.buttonColors(containerColor = Gold)
                    ) {
                        Text("Play Again", fontWeight = FontWeight.Bold, color = NavyDeep, fontSize = 16.sp)
                    }
                    OutlinedButton(
                        onClick  = onHome,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape    = RoundedCornerShape(16.dp),
                        colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        border   = androidx.compose.foundation.BorderStroke(1.dp, TextSecondary.copy(alpha = 0.4f))
                    ) {
                        Text("Home", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun RoundSummaryRow(index: Int, def: RoundDef, result: Any?) {
    val roundLabel = if (def.type == GameMode.LETTERS) "Letters ${index + 1}" else "Numbers ${index + 1}"
    val (label, scoreText, detailText, scoreColor) = when (result) {
        is LetterRoundResult -> {
            val valid = result.userWordValid
            val word  = result.userWord.ifEmpty { "(no word)" }
            Quad(
                roundLabel,
                "${result.userScore} pts",
                if (valid) "\"$word\"" else "\"$word\" — invalid",
                if (valid && result.userScore > 0) Success else Error
            )
        }
        is NumberRoundResult -> {
            val score = result.userScore
            Quad(
                roundLabel,
                "$score pts",
                "Target: ${result.target}" + (result.userResult?.let { "  →  Got $it" } ?: "  (not attempted)"),
                when {
                    score >= 10 -> Success
                    score > 0   -> Warning
                    else        -> Error
                }
            )
        }
        else -> Quad(
            roundLabel,
            "0 pts", "—", TextMuted
        )
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = NavyDark),
        shape    = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier          = Modifier.padding(horizontal = 16.dp, vertical = 12.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = label, fontSize = 13.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                Text(text = detailText, fontSize = 13.sp, color = TextPrimary)
            }
            Text(
                text       = scoreText,
                fontSize   = 16.sp,
                fontWeight = FontWeight.Bold,
                color      = scoreColor,
                textAlign  = TextAlign.End
            )
        }
    }
}

/** Simple 4-tuple for destructuring. */
private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
private operator fun <A, B, C, D> Quad<A, B, C, D>.component1() = first
private operator fun <A, B, C, D> Quad<A, B, C, D>.component2() = second
private operator fun <A, B, C, D> Quad<A, B, C, D>.component3() = third
private operator fun <A, B, C, D> Quad<A, B, C, D>.component4() = fourth
