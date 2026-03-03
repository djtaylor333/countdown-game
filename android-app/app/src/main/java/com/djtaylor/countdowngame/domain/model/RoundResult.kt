package com.djtaylor.countdowngame.domain.model

import kotlinx.serialization.Serializable

// ── Equation step (one arithmetic operation by the user) ─────────────────────

@Serializable
data class EquationStep(
    val left: Int,
    val op: Operation,
    val right: Int,
    val result: Int
)

// ── Letters round result ─────────────────────────────────────────────────────

data class BestWord(
    val word: String
)

data class LetterRoundResult(
    val userWord: String,
    val userWordValid: Boolean,
    val userScore: Int,           // 0 if invalid, else word.length
    val bestWords: List<BestWord>,
    val maxPossibleScore: Int     // length of the longest valid word
)

// ── Numbers round result ─────────────────────────────────────────────────────

data class SolverResult(
    val exact: Boolean,
    val closest: Int,
    val diff: Int,
    val steps: List<EquationStep>
)

data class NumberRoundResult(
    val userResult: Int?,          // final value from user's steps; null if no steps
    val userSteps: List<EquationStep>,
    val userScore: Int,            // 10 / 7 / 5 / 0
    val solution: List<EquationStep>?,
    val target: Int
)
