import 'package:barrani/strings.dart';
import 'package:barrani/ui/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const secret = 'كسكسي';

Widget harness() => MaterialApp(
      home: Scaffold(
        body: HoldToReveal(
          holdFor: const Duration(milliseconds: 600),
          builder: (_) => const Text(secret),
        ),
      ),
    );

void main() {
  testWidgets('the secret is absent from the tree before any interaction',
      (tester) async {
    await tester.pumpWidget(harness());
    expect(find.text(secret), findsNothing);
    expect(find.text(S.holdToReveal), findsOneWidget);
  });

  testWidgets('the secret is still absent partway through the hold',
      (tester) async {
    await tester.pumpWidget(harness());
    final gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text(secret), findsNothing);
    await gesture.up();
  });

  testWidgets('the secret appears only after the full hold', (tester) async {
    await tester.pumpWidget(harness());
    final gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pump();
    expect(find.text(secret), findsOneWidget);
    await gesture.up();
  });

  testWidgets('releasing early never reveals the secret', (tester) async {
    await tester.pumpWidget(harness());
    final gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 300));
    await gesture.up();
    await tester.pump(const Duration(seconds: 2));
    expect(find.text(secret), findsNothing);
  });

  testWidgets('leaving the foreground clears a revealed secret', (tester) async {
    await tester.pumpWidget(harness());
    final gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pump();
    expect(find.text(secret), findsOneWidget);
    await gesture.up();

    // Phone locked, app backgrounded, or handed over mid-animation.
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    await tester.pump();

    expect(find.text(secret), findsNothing);
    expect(find.text(S.holdToReveal), findsOneWidget);
  });

  testWidgets('after backgrounding, a fresh full hold is required',
      (tester) async {
    await tester.pumpWidget(harness());
    var gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pump();
    await gesture.up();

    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.inactive);
    await tester.pump();
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pump();

    gesture = await tester.startGesture(
      tester.getCenter(find.text(S.holdToReveal)),
    );
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text(secret), findsNothing);

    await tester.pump(const Duration(milliseconds: 400));
    await tester.pump();
    expect(find.text(secret), findsOneWidget);
    await gesture.up();
  });
}
