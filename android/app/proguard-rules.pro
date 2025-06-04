# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep,allowobfuscation @interface com.facebook.common.internal.DoNotStrip

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# JSC and Hermes
-keep class com.facebook.jni.** { *; }

# Expo and Metro
-keep class expo.modules.** { *; }

# React Navigation
-keep class com.reactnavigation.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Image Picker
-keep class com.imagepicker.** { *; }

# Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# Gesture Handler
-keep class com.swmansion.gesturehandler.** { *; }

# Linear Gradient
-keep class com.BV.LinearGradient.** { *; }

# Blur View
-keep class com.cmcewen.blurview.** { *; }

# SVG
-keep class com.horcrux.svg.** { *; }

# Paper
-keep class com.callstack.reactnativepaper.** { *; }

# Charts
-keep class com.github.mikephil.charting.** { *; }

# Add any project specific keep options here:
