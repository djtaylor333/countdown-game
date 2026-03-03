package com.djtaylor.countdowngame.ui.results

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
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
import com.djtaylor.countdowngame.ui.theme.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun ResultsScreen(
    onPlayAgainTomorrow: () -> Unit,
    viewModel: ResultsViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(NavyDeep, Navy)))
    ) {
        if (state.isLoading) {
            CircularProgressIndicator(Modifier.align(Alignment.Center), color = Gold)
            return@Box
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // ── Header ────────────────────────────────────────────────────────
            Icon(
                imageVector = Icons.Default.EmojiEvents,
                contentDescription = null,
                tint     = Gold,
                modifier = Modifier.size(56.dp)
            )
            Text(
                text       = "Today's Results",
                fontSize   = 26.sp,
                fontWeight = FontWeight.Black,
                color      = Gold
            )
            val friendlyDate = runCatching {
                LocalDate.parse(state.todayKey)
                    .format(DateTimeFormatter.ofPattern("EEEE, d MMMM"))
            }.getOrDefault(state.todayKey)
            Text(text = friendlyDate, color = TextSecondary, fontSize = 13.sp)

            // ── Score summary ─────────────────────────────────────────────────
            val result = state.todayResult
            if (result == null) {
                Text(
                    "No results yet — play today's puzzle!",
                    color = TextMuted,
                    textAlign = TextAlign.Center
                )
            } else {
                // Total score card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors   = CardDefaults.cardColors(containerColor = NavyDark),
                    shape    = RoundedCornerShape(20.dp)
                ) {
                    Column(
                        modifier            = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text       = "${result.totalScore}",
                            fontSize   = 64.sp,
                            fontWeight = FontWeight.Black,
                            color      = Gold
                        )
                        Text(
                            text  = "out of ${state.maxScore} pts",
                            color = TextSecondary,
                            fontSize = 14.sp
                        )
                        // Progress bar
                        LinearProgressIndicator(
                            progress = { state.percentage },
                            modifier = Modifier.fillMaxWidth().height(8.dp),
                            color    = Gold,
                            trackColor = TileBlueBorder
                        )
                    }
                }

                // ── Round breakdown ───────────────────────────────────────────
                RoundResultCard(
                    title  = "Letters Round 1",
                    score  = result.lettersScore1,
                    max    = result.lettersMax1,
                    word   = result.letterWord1.ifEmpty { "—" }
                )
                RoundResultCard(
                    title  = "Letters Round 2",
                    score  = result.lettersScore2,
                    max    = result.lettersMax2,
                    word   = result.letterWord2.ifEmpty { "—" }
                )
                RoundResultCard(
                    title = "Numbers Round",
                    score = result.numbersScore,
                    max   = 10,
                    word  = ""
                )

                // ── Streak info ───────────────────────────────────────────────
                Row(
                    modifier              = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label    = "Play Streak",
                        value    = "${state.streakData.currentPlayStreak} days",
                        emoji    = "🔥"
                    )
                    StatChip(
                        modifier = Modifier.weight(1f),
                        label    = "Best Streak",
                        value    = "${state.streakData.bestPlayStreak} days",
                        emoji    = "⭐"
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            OutlinedButton(
                onClick   = onPlayAgainTomorrow,
                modifier  = Modifier.fillMaxWidth().height(50.dp),
                shape     = RoundedCornerShape(16.dp),
                colors    = ButtonDefaults.outlinedButtonColors(contentColor = Gold),
                border    = androidx.compose.foundation.BorderStroke(1.dp, Gold.copy(alpha = 0.6f))
            ) {
                Text("← Back to Home", fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

@Composable
private fun RoundResultCard(title: String, score: Int, max: Int, word: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors   = CardDefaults.cardColors(containerColor = NavyDark),
        shape    = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier          = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold, color = TextPrimary, fontSize = 14.sp)
                if (word.isNotEmpty()) {
                    Text(word, color = Gold, fontSize = 18.sp, fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp)
                }
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text       = "$score / $max",
                    fontSize   = 20.sp,
                    fontWeight = FontWeight.Black,
                    color      = when {
                        max == 0 || score == 0 -> TextMuted
                        score == max           -> Success
                        score >= max / 2       -> Warning
                        else                   -> TextSecondary
                    }
                )
            }
        }
    }
}

@Composable
private fun StatChip(modifier: Modifier, label: String, value: String, emoji: String) {
    Card(
        modifier = modifier,
        colors   = CardDefaults.cardColors(containerColor = TileBlue),
        shape    = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier            = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(emoji, fontSize = 20.sp)
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Gold)
            Text(label, fontSize = 11.sp, color = TextSecondary, textAlign = TextAlign.Center)
        }
    }
}
