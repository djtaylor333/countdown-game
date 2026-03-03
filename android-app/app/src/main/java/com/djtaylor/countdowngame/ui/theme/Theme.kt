package com.djtaylor.countdowngame.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary           = Gold,
    onPrimary         = NavyDeep,
    primaryContainer  = NavyDark,
    onPrimaryContainer = GoldLight,
    secondary         = GoldLight,
    onSecondary       = NavyDeep,
    secondaryContainer = TileBlue,
    onSecondaryContainer = TextPrimary,
    tertiary          = Success,
    onTertiary        = NavyDeep,
    background        = Navy,
    onBackground      = TextPrimary,
    surface           = NavyDark,
    onSurface         = TextPrimary,
    surfaceVariant    = TileBlue,
    onSurfaceVariant  = TextSecondary,
    error             = Error,
    onError           = TextPrimary,
    outline           = TileBlueBorder,
    outlineVariant    = Divider,
)

@Composable
fun CountdownGameTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography  = CountdownTypography,
        content     = content
    )
}
