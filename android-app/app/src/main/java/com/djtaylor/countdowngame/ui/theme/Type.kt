package com.djtaylor.countdowngame.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.googlefonts.Font
import androidx.compose.ui.text.googlefonts.GoogleFont
import androidx.compose.ui.unit.sp
import com.djtaylor.countdowngame.R

// ── Google Fonts provider ─────────────────────────────────────────────────────
private val provider = GoogleFont.Provider(
    providerAuthority = "com.google.android.gms.fonts",
    providerPackage   = "com.google.android.gms",
    certificates      = R.array.com_google_android_gms_fonts_certs
)

// ── Font families ─────────────────────────────────────────────────────────────
// Space Grotesk — tile text (matches web --font-tile)
val SpaceGroteskFamily: FontFamily = FontFamily(
    Font(googleFont = GoogleFont("Space Grotesk"), fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = GoogleFont("Space Grotesk"), fontProvider = provider, weight = FontWeight.Bold),
    Font(googleFont = GoogleFont("Space Grotesk"), fontProvider = provider, weight = FontWeight.Black)
)

// Rajdhani — display / heading text (matches web --font-rajdhani)
val RajdhaniFamily: FontFamily = FontFamily(
    Font(googleFont = GoogleFont("Rajdhani"), fontProvider = provider, weight = FontWeight.Medium),
    Font(googleFont = GoogleFont("Rajdhani"), fontProvider = provider, weight = FontWeight.SemiBold),
    Font(googleFont = GoogleFont("Rajdhani"), fontProvider = provider, weight = FontWeight.Bold)
)

// ── Typography ────────────────────────────────────────────────────────────────
val CountdownTypography = Typography(
    displayLarge = TextStyle(
        fontFamily    = RajdhaniFamily,
        fontWeight    = FontWeight.Bold,
        fontSize      = 57.sp,
        lineHeight    = 64.sp,
        letterSpacing = (-0.25).sp,
        color = TextPrimary
    ),
    displayMedium = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.Bold,
        fontSize   = 45.sp,
        lineHeight = 52.sp,
        color = TextPrimary
    ),
    displaySmall = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.Bold,
        fontSize   = 36.sp,
        lineHeight = 44.sp,
        color = TextPrimary
    ),
    headlineLarge = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.Bold,
        fontSize   = 32.sp,
        lineHeight = 40.sp,
        color = TextPrimary
    ),
    headlineMedium = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.Bold,
        fontSize   = 28.sp,
        lineHeight = 36.sp,
        color = TextPrimary
    ),
    titleLarge = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize   = 22.sp,
        lineHeight = 28.sp,
        color = TextPrimary
    ),
    titleMedium = TextStyle(
        fontFamily = RajdhaniFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize   = 16.sp,
        lineHeight = 24.sp,
        color = TextPrimary
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize   = 16.sp,
        lineHeight = 24.sp,
        color = TextPrimary
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize   = 14.sp,
        lineHeight = 20.sp,
        color = TextSecondary
    ),
    labelLarge = TextStyle(
        fontFamily    = RajdhaniFamily,
        fontWeight    = FontWeight.SemiBold,
        fontSize      = 14.sp,
        lineHeight    = 20.sp,
        letterSpacing = 0.5.sp,
        color = TextPrimary
    )
)