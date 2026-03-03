package com.djtaylor.countdowngame.domain.model

enum class GameMode { LETTERS, NUMBERS }

enum class GamePhase {
    SELECTING,   // user picks letters / number category
    COUNTDOWN,   // 3-2-1 animation before timer
    PLAYING,     // 30-second timer running
    SUBMITTING,  // user selects their best answer after timer
    RESULTS,     // showing round result
    COMPLETE     // all 3 rounds finished for the day
}

enum class Operation(val symbol: String) {
    PLUS("+"),
    MINUS("-"),
    TIMES("×"),
    DIVIDE("÷")
}
