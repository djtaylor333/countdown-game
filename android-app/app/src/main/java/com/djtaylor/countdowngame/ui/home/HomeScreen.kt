package com.djtaylor.countdowngame.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
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
import com.djtaylor.countdowngame.ui.theme.RajdhaniFamily
import com.djtaylor.countdowngame.ui.theme.SpaceGroteskFamily
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun HomeScreen(
    onPlayClick: () -> Unit,
    onPracticeClick: () -> Unit = {},
    onFullGameClick: () -> Unit = {},
    onViewResults: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(listOf(NavyDeep, Navy))
            )
    ) {
        if (uiState.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color    = Gold
            )
        } else {
            Column(
                modifier            = Modifier
                    .fillMaxSize()
                    .systemBarsPadding()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // ── Header ────────────────────────────────────────────────────
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text          = "COUNTDOWN",
                        fontSize      = 36.sp,
                        fontWeight    = FontWeight.Black,
                        fontFamily    = RajdhaniFamily,
                        color         = Gold,
                        letterSpacing = 4.sp,
                        textAlign     = TextAlign.Center
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text     = "Daily Puzzle",
                        fontSize = 14.sp,
                        color    = TextSecondary,
                        letterSpacing = 2.sp
                    )
                    Spacer(Modifier.height(8.dp))
                    val friendlyDate = runCatching {
                        LocalDate.parse(uiState.todayKey)
                            .format(DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy"))
                    }.getOrDefault(uiState.todayKey)
                    Text(
                        text     = friendlyDate,
                        fontSize = 12.sp,
                        color    = TextMuted
                    )
                }

                // ── Streak cards ──────────────────────────────────────────────
                Row(
                    modifier            = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StreakCard(
                        modifier  = Modifier.weight(1f),
                        label     = "Play Streak",
                        value     = uiState.currentPlayStreak,
                        emoji     = "🔥"
                    )
                    StreakCard(
                        modifier  = Modifier.weight(1f),
                        label     = "Perfect Streak",
                        value     = uiState.currentCompleteStreak,
                        emoji     = "⭐"
                    )
                }

                // ── Round preview ─────────────────────────────────────────────
                uiState.challenge?.let { challenge ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors   = CardDefaults.cardColors(containerColor = NavyDark),
                        shape    = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text       = "Today's Puzzle",
                                fontSize   = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color      = TextSecondary,
                                letterSpacing = 1.sp
                            )
                            RoundPreviewRow(
                                label   = "Letters 1",
                                letters = challenge.letterRound1.joinToString(" ")
                            )
                            RoundPreviewRow(
                                label   = "Letters 2",
                                letters = challenge.letterRound2.joinToString(" ")
                            )
                            RoundPreviewRow(
                                label   = "Numbers",
                                letters = "${challenge.numbers.joinToString(", ")}  →  ${challenge.target}"
                            )
                        }
                    }
                }

                // ── Action buttons ────────────────────────────────────────────
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier            = Modifier.fillMaxWidth()
                ) {
                    if (!uiState.hasCompletedToday) {
                        Button(
                            onClick  = onPlayClick,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp),
                            shape    = RoundedCornerShape(16.dp),
                            colors   = ButtonDefaults.buttonColors(containerColor = Gold)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = NavyDeep
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text       = if (uiState.hasPlayedToday) "Continue" else "Play Today",
                                fontWeight = FontWeight.Bold,
                                color      = NavyDeep,
                                fontSize   = 16.sp
                            )
                        }
                    } else {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors   = CardDefaults.cardColors(containerColor = Success.copy(alpha = 0.15f)),
                            shape    = RoundedCornerShape(16.dp)
                        ) {
                            Text(
                                text      = "✓  Today's puzzle complete!",
                                modifier  = Modifier.padding(16.dp).fillMaxWidth(),
                                color     = Success,
                                fontWeight = FontWeight.SemiBold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }

                    if (uiState.hasPlayedToday) {
                        OutlinedButton(
                            onClick   = onViewResults,
                            modifier  = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape     = RoundedCornerShape(16.dp),
                            colors    = ButtonDefaults.outlinedButtonColors(contentColor = Gold),
                            border    = androidx.compose.foundation.BorderStroke(1.dp, Gold.copy(alpha = 0.5f))
                        ) {
                            Text("View Results", fontWeight = FontWeight.SemiBold)
                        }
                    }

                    // ── More modes ───────────────────────────────────────────
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text          = "MORE MODES",
                        fontSize      = 10.sp,
                        color         = TextMuted,
                        letterSpacing = 2.sp,
                        modifier      = Modifier.fillMaxWidth(),
                        textAlign     = TextAlign.Center
                    )
                    OutlinedButton(
                        onClick  = onPracticeClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape    = RoundedCornerShape(16.dp),
                        colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        border   = androidx.compose.foundation.BorderStroke(1.dp, TextSecondary.copy(alpha = 0.4f))
                    ) {
                        Text("🎯  Practice Mode (No Timer)", fontWeight = FontWeight.SemiBold)
                    }
                    OutlinedButton(
                        onClick  = onFullGameClick,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape    = RoundedCornerShape(16.dp),
                        colors   = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                        border   = androidx.compose.foundation.BorderStroke(1.dp, TextSecondary.copy(alpha = 0.4f))
                    ) {
                        Text("🏆  Full Game (9 Rounds)", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun StreakCard(
    modifier: Modifier,
    label: String,
    value: Int,
    emoji: String
) {
    Card(
        modifier = modifier,
        colors   = CardDefaults.cardColors(containerColor = NavyDark),
        shape    = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier            = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(text = emoji, fontSize = 24.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                text       = value.toString(),
                fontSize   = 28.sp,
                fontWeight = FontWeight.Black,
                color      = Gold
            )
            Text(
                text      = label,
                fontSize  = 11.sp,
                color     = TextSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun RoundPreviewRow(label: String, letters: String) {
    Row(
        modifier            = Modifier.fillMaxWidth(),
        verticalAlignment   = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, fontSize = 12.sp, color = TextMuted, modifier = Modifier.width(72.dp))
        Text(
            text          = letters,
            fontSize      = 13.sp,
            fontWeight    = FontWeight.SemiBold,
            fontFamily    = SpaceGroteskFamily,
            color         = TextPrimary,
            letterSpacing = 1.sp
        )
    }
}
