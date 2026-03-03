package com.djtaylor.countdowngame.data

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.djtaylor.countdowngame.domain.model.DailyResult
import com.djtaylor.countdowngame.domain.model.StreakData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.abs

@Singleton
class PreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {

    companion object {
        private val KEY_STREAK = stringPreferencesKey("streak_data_v1")
        private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    val streakDataFlow: Flow<StreakData> = dataStore.data.map { prefs ->
        prefs[KEY_STREAK]?.let { raw ->
            runCatching { json.decodeFromString<StreakData>(raw) }.getOrNull()
        } ?: StreakData()
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * Record a completed daily play.
     * Updates play/complete streaks and saves the result to history.
     */
    suspend fun recordDailyPlay(result: DailyResult) {
        dataStore.edit { prefs ->
            val current = prefs[KEY_STREAK]?.let {
                runCatching { json.decodeFromString<StreakData>(it) }.getOrNull()
            } ?: StreakData()

            val updated = mergeResult(current, result)
            prefs[KEY_STREAK] = json.encodeToString(updated)
        }
    }

    /** Clear all saved data (for testing / reset). */
    suspend fun clearAll() {
        dataStore.edit { it.clear() }
    }

    // ── Business logic ────────────────────────────────────────────────────────

    private fun mergeResult(data: StreakData, result: DailyResult): StreakData {
        val dateKey = result.dateKey

        // Update or insert history entry
        val existingIdx = data.history.indexOfFirst { it.dateKey == dateKey }
        val newHistory = data.history.toMutableList()
        val merged = if (existingIdx >= 0) {
            val existing = newHistory[existingIdx]
            existing.copy(
                lettersScore1 = maxOf(existing.lettersScore1, result.lettersScore1),
                lettersMax1   = maxOf(existing.lettersMax1, result.lettersMax1),
                letterWord1   = if (result.letterWord1.isNotEmpty()) result.letterWord1 else existing.letterWord1,
                lettersScore2 = maxOf(existing.lettersScore2, result.lettersScore2),
                lettersMax2   = maxOf(existing.lettersMax2, result.lettersMax2),
                letterWord2   = if (result.letterWord2.isNotEmpty()) result.letterWord2 else existing.letterWord2,
                numbersScore  = maxOf(existing.numbersScore, result.numbersScore),
                completed     = existing.completed || result.completed
            )
        } else {
            result
        }

        if (existingIdx >= 0) newHistory[existingIdx] = merged
        else newHistory.add(merged)

        // Only update streaks on new plays (not updates)
        if (existingIdx >= 0) {
            return data.copy(history = newHistory)
        }

        // Update play streak
        val playStreak = calculateStreak(data.lastPlayDate, dateKey, data.currentPlayStreak)
        val completeStreak = if (result.completed)
            calculateStreak(data.lastCompleteDate, dateKey, data.currentCompleteStreak)
        else
            0

        return data.copy(
            currentPlayStreak     = playStreak,
            currentCompleteStreak = if (result.completed) completeStreak else data.currentCompleteStreak,
            bestPlayStreak        = maxOf(data.bestPlayStreak, playStreak),
            bestCompleteStreak    = if (result.completed) maxOf(data.bestCompleteStreak, completeStreak) else data.bestCompleteStreak,
            lastPlayDate          = dateKey,
            lastCompleteDate      = if (result.completed) dateKey else data.lastCompleteDate,
            totalGamesPlayed      = data.totalGamesPlayed + 1,
            totalGamesCompleted   = data.totalGamesCompleted + if (result.completed) 1 else 0,
            history               = newHistory
        )
    }

    private fun calculateStreak(lastDate: String?, newDate: String, currentStreak: Int): Int {
        if (lastDate == null) return 1
        val days = daysBetween(lastDate, newDate)
        return when {
            days == 0 -> currentStreak           // same day, no change
            days == 1 -> currentStreak + 1       // consecutive day
            else      -> 1                       // streak broken
        }
    }

    private fun daysBetween(a: String, b: String): Int {
        // Parse "YYYY-MM-DD" manually to avoid java.time API level issues
        fun toDays(s: String): Long {
            val year  = s.substring(0, 4).toLong()
            val month = s.substring(5, 7).toLong()
            val day   = s.substring(8, 10).toLong()
            // Approximate: use total days since epoch formula
            val y = if (month < 3) year - 1 else year
            val m = if (month < 3) month + 12 else month
            return 365 * y + y / 4 - y / 100 + y / 400 + (306 * (m + 1)) / 10 + day - 719469
        }
        return abs((toDays(a) - toDays(b))).toInt()
    }
}
