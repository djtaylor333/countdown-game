package com.djtaylor.countdowngame.domain.model

/** Top-level game modes exposed to the UI and ViewModel. */
enum class AppMode { DAILY, PRACTICE, FULL }

/** Type of a single round within a multi-round game session. */
enum class GameMode { LETTERS, NUMBERS }

/**
 * Descriptor for one round within a game session.
 * For letters rounds: [deckSeed] drives the letter pool shuffle.
 * For numbers rounds: [target] and [numsSeed] drive number generation.
 */
data class RoundDef(
    val type: GameMode,
    val deckSeed: Long   = 0L,   // for LETTERS
    val target:   Int    = 0,    // for NUMBERS
    val numsSeed: Long   = 0L,   // for NUMBERS
    val largeCount: Int  = 2     // for NUMBERS
)

enum class GamePhase {
    SELECTING,   // user picks letters / number category
    COUNTDOWN,   // 3-2-1 animation before timer
    PLAYING,     // 30-second timer running
    SUBMITTING,  // user selects their best answer after timer
    RESULTS,     // showing round result
    COMPLETE     // all rounds finished
}

enum class Operation(val symbol: String) {
    PLUS("+"),
    MINUS("-"),
    TIMES("×"),
    DIVIDE("÷")
}
