# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep kotlinx.serialization metadata
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep Hilt generated classes
-keep class dagger.hilt.** { *; }
-keepnames @dagger.hilt.android.lifecycle.HiltViewModel class * extends androidx.lifecycle.ViewModel

# Keep data model classes for serialization
-keep @kotlinx.serialization.Serializable class com.djtaylor.countdowngame.** { *; }
-keepclassmembers class com.djtaylor.countdowngame.** {
    kotlinx.serialization.KSerializer serializer(...);
    kotlinx.serialization.descriptors.SerialDescriptor serialDescriptor();
}
