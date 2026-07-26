import 'package:flutter/material.dart';

/// Sampled from the logo: charcoal backdrop, gold, crimson.
/// Cream on this charcoal clears 15:1, which keeps the phone readable at
/// arm's length on a sunny terrace.
class C {
  static const bg = Color(0xFF141416);
  static const surface = Color(0xFF1C1C20);
  static const surfaceRaised = Color(0xFF26262C);
  static const border = Color(0xFF3A3A42);

  static const text = Color(0xFFF3ECE0);
  static const textDim = Color(0xFFA09A90);

  static const accent = Color(0xFFE3C573); // logo gold
  static const accentText = Color(0xFF121214);

  static const secondary = Color(0xFFE0A34A); // warm amber, inline notices
  static const danger = Color(0xFFF03345); // logo crimson
}

/// One phone-shaped column, centred on tablets and in landscape.
const double kContentMax = 544;
const double kTapMin = 56;

ThemeData buildTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: C.bg,
    colorScheme: base.colorScheme.copyWith(
      surface: C.bg,
      primary: C.accent,
      onPrimary: C.accentText,
      error: C.danger,
    ),
    textTheme: base.textTheme
        .apply(
          fontFamily: 'Cairo',
          bodyColor: C.text,
          displayColor: C.text,
        )
        .copyWith(
          headlineLarge: const TextStyle(fontWeight: FontWeight.w700, height: 1.15),
          headlineMedium: const TextStyle(fontWeight: FontWeight.w700, height: 1.2),
          titleLarge: const TextStyle(fontWeight: FontWeight.w700),
        ),
  );
}
