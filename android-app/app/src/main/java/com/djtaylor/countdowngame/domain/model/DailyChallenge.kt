package com.djtaylor.countdowngame.domain.model

import kotlinx.serialization.Serializable

/**
 * The complete puzzle set for a given day.
 * All users on the same date receive identical puzzles.
 */
@Serializable
data class DailyChallenge(
    val dateKey: String,           // "YYYY-MM-DD"
    val letterRound1: List<Char>,  // 9 letters
    val letterRound2: List<Char>,  // 9 letters
    val numbers: List<Int>,        // 6 numbers
    val largeCount: Int,           // how many large numbers (25/50/75/100)
    val target: Int                // 3-digit target (100-999)
)
