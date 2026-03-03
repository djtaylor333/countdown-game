package com.djtaylor.countdowngame.data

import android.content.Context
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Loads the word list from [assets/wordlist.txt] on first access and caches it.
 *
 * wordlist.txt is generated from the web-app wordlist, filtered to words
 * of 2–9 alphabetic characters (uppercase, one word per line).
 */
@Singleton
class WordRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {

    @Volatile
    private var wordSet: Set<String>? = null

    /** Load and cache the word set (lazy, IO dispatcher). */
    suspend fun getWordSet(): Set<String> {
        return wordSet ?: withContext(Dispatchers.IO) {
            context.assets.open("wordlist.txt")
                .bufferedReader()
                .readLines()
                .map { it.trim().uppercase() }
                .filter { it.isNotEmpty() }
                .toHashSet()
                .also { wordSet = it }
        }
    }

    /** Returns true if [word] is in the dictionary and can potentially be a valid play. */
    suspend fun isValidWord(word: String): Boolean {
        if (word.length < 2) return false
        return getWordSet().contains(word.uppercase())
    }
}
