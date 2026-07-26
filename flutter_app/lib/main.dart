import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'state/phase.dart';
import 'state/session.dart';
import 'state/store.dart';
import 'strings.dart';
import 'theme.dart';
import 'ui/round_screens.dart';
import 'ui/setup_screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(statusBarColor: Colors.transparent),
  );
  runApp(
    BarraniApp(
      store: SessionStore(
        Session.initial(seed: DateTime.now().millisecondsSinceEpoch & 0x7FFFFFFF),
      ),
    ),
  );
}

class BarraniApp extends StatelessWidget {
  final SessionStore store;
  const BarraniApp({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: S.appName,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      // The whole app is Derja; RTL is not a per-locale decision here.
      builder: (context, child) => Directionality(
        textDirection: TextDirection.rtl,
        child: child!,
      ),
      home: RootScreen(store: store),
    );
  }
}

class RootScreen extends StatelessWidget {
  final SessionStore store;
  const RootScreen({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final phase = store.session.phase;

        // The Android back gesture must never walk backwards into a screen
        // that was showing a secret word, so it is swallowed mid-round.
        return PopScope(
          canPop: phase is HomePhase,
          onPopInvokedWithResult: (didPop, _) {
            if (didPop) return;
            if (isSetupPhase(phase)) store.navigate(const HomePhase());
          },
          child: Scaffold(
            backgroundColor: C.bg,
            body: switch (phase) {
              HomePhase() => HomeScreen(store),
              PlayersPhase() => PlayersScreen(store),
              PacksPhase() => PacksScreen(store),
              OptionsPhase() => OptionsScreen(store),
              RulesPhase() => RulesScreen(store),
              HandoffPhase(:final index) => HandoffScreen(store, index),
              RevealPhase(:final index) => RevealScreen(store, index),
              QuestionsPhase() => QuestionsScreen(store),
              DiscussionPhase() => DiscussionScreen(store),
              DeclarePhase() => DeclareScreen(store),
              VotePhase() => VoteScreen(store),
              ResolutionPhase p => ResolutionScreen(store, p),
              ScoreboardPhase() => ScoreboardScreen(store),
            },
          ),
        );
      },
    );
  }
}
