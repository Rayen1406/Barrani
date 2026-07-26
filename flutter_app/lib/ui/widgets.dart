import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../strings.dart';
import '../theme.dart';

/// One phone-shaped, scrollable column. `safe` centring: content centres when
/// it fits and scrolls from the top when it does not, so a short landscape
/// screen never clips the top out of reach.
class Screen extends StatelessWidget {
  final List<Widget> children;
  final bool centered;

  const Screen({super.key, required this.children, this.centered = false});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: kContentMax),
          child: LayoutBuilder(
            builder: (context, constraints) => SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - 40),
                child: Column(
                  mainAxisAlignment:
                      centered ? MainAxisAlignment.center : MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: children,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

enum BtnVariant { primary, ghost, danger }

class Btn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final BtnVariant variant;

  const Btn(this.label, {super.key, this.onPressed, this.variant = BtnVariant.primary});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (variant) {
      BtnVariant.primary => (C.accent, C.accentText),
      BtnVariant.ghost => (C.surfaceRaised, C.text),
      BtnVariant.danger => (C.danger, C.text),
    };
    final disabled = onPressed == null;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Opacity(
        opacity: disabled ? 0.4 : 1,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: onPressed,
            child: Container(
              constraints: const BoxConstraints(minHeight: kTapMin),
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 18),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class WordCard extends StatelessWidget {
  final String? label;
  final String title;
  final String? hint;
  final bool impostor;

  const WordCard({
    super.key,
    this.label,
    required this.title,
    this.hint,
    this.impostor = false,
  });

  @override
  Widget build(BuildContext context) {
    final fg = impostor ? C.text : C.accentText;
    final dim = impostor
        ? C.text.withValues(alpha: 0.88)
        : C.accentText.withValues(alpha: 0.72);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      decoration: BoxDecoration(
        color: impostor ? C.danger : C.accent,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          if (label != null) ...[
            Text(label!, style: TextStyle(color: dim, fontSize: 16)),
            const SizedBox(height: 12),
          ],
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: fg,
              fontSize: impostor ? 34 : 46,
              fontWeight: FontWeight.w700,
              height: 1.15,
            ),
          ),
          if (hint != null) ...[
            const SizedBox(height: 12),
            Text(hint!, textAlign: TextAlign.center, style: TextStyle(color: dim, fontSize: 16)),
          ],
        ],
      ),
    );
  }
}

/// The single most important widget in the app.
///
/// Its contract is not "hide the word" — it is that the word **is not built
/// into the widget tree at all** until a deliberate hold completes. A word that
/// was never laid out cannot be screenshotted, flashed during a rebuild, or
/// read by someone tilting the phone. Leaving the foreground clears it too.
class HoldToReveal extends StatefulWidget {
  final Duration holdFor;
  final WidgetBuilder builder;

  const HoldToReveal({
    super.key,
    this.holdFor = const Duration(milliseconds: 600),
    required this.builder,
  });

  @override
  State<HoldToReveal> createState() => _HoldToRevealState();
}

class _HoldToRevealState extends State<HoldToReveal> with WidgetsBindingObserver {
  bool _revealed = false;
  bool _holding = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Backgrounded, locked, or handed over mid-animation: drop the word.
    if (state != AppLifecycleState.resumed) _cancel(clearReveal: true);
  }

  void _start() {
    if (_revealed || _timer != null) return;
    setState(() => _holding = true);
    _timer = Timer(widget.holdFor, () {
      _timer = null;
      HapticFeedback.lightImpact();
      setState(() {
        _holding = false;
        _revealed = true;
      });
    });
  }

  void _cancel({bool clearReveal = false}) {
    _timer?.cancel();
    _timer = null;
    if (!mounted) return;

    // Revealing swaps this widget out, which makes the tap recognizer fire
    // onTapCancel during the locked build phase. Only rebuild if something
    // actually changes, otherwise that stray cancel throws.
    final nextRevealed = clearReveal ? false : _revealed;
    if (!_holding && nextRevealed == _revealed) return;

    setState(() {
      _holding = false;
      _revealed = nextRevealed;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_revealed) return widget.builder(context);

    return GestureDetector(
      onTapDown: (_) => _start(),
      onTapUp: (_) => _cancel(),
      onTapCancel: _cancel,
      child: Container(
        constraints: const BoxConstraints(minHeight: 260),
        alignment: Alignment.center,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: C.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _holding ? C.accent : C.border,
            width: 3,
          ),
        ),
        child: Text(
          _holding ? S.holdingHint : S.holdToReveal,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: _holding ? C.accent : C.textDim,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

/// Counts down and keeps the screen awake for the duration.
class CountdownTimer extends StatefulWidget {
  final int seconds;
  final VoidCallback onComplete;

  const CountdownTimer({super.key, required this.seconds, required this.onComplete});

  @override
  State<CountdownTimer> createState() => _CountdownTimerState();
}

class _CountdownTimerState extends State<CountdownTimer> {
  late int _remaining = widget.seconds;
  Timer? _ticker;
  bool _fired = false;

  @override
  void initState() {
    super.initState();
    // The phone must not sleep during a three-minute discussion.
    unawaited(WakelockPlus.enable());
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _remaining = _remaining > 0 ? _remaining - 1 : 0);
      if (_remaining == 0 && !_fired) {
        _fired = true;
        widget.onComplete();
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    unawaited(WakelockPlus.disable());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final m = _remaining ~/ 60;
    final s = (_remaining % 60).toString().padLeft(2, '0');
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Text(
        '$m:$s',
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: C.accent,
          fontSize: 44,
          fontWeight: FontWeight.w700,
          fontFeatures: [FontFeature.tabularFigures()],
        ),
      ),
    );
  }
}
