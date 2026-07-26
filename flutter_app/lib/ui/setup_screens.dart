import 'package:flutter/material.dart';

import '../content/packs.dart';
import '../content/types.dart';
import '../engine/round.dart';
import '../engine/types.dart';
import '../state/phase.dart';
import '../state/store.dart';
import '../strings.dart';
import '../theme.dart';
import 'widgets.dart';

const kTimerChoices = <int?>[60, 120, 180, 300, null];

class HomeScreen extends StatelessWidget {
  final SessionStore store;
  const HomeScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final ready = canStart(s.players.length, s.impostorCount);
    final hasPacks = s.selectedPackIds.isNotEmpty;

    return Screen(
      centered: true,
      children: [
        ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 300),
          child: Image.asset('assets/logo.webp', fit: BoxFit.contain),
        ),
        const SizedBox(height: 8),
        const Text(S.tagline,
            textAlign: TextAlign.center, style: TextStyle(color: C.textDim, fontSize: 17)),
        const SizedBox(height: 16),
        Btn(S.start, onPressed: ready && hasPacks ? store.startRound : null),
        if (!ready) const _Notice(S.needMorePlayers),
        if (!hasPacks) const _Notice(S.needOnePack),
        const SizedBox(height: 8),
        Btn(S.players,
            variant: BtnVariant.ghost,
            onPressed: () => store.navigate(const PlayersPhase())),
        Btn(S.packs,
            variant: BtnVariant.ghost, onPressed: () => store.navigate(const PacksPhase())),
        Btn(S.options,
            variant: BtnVariant.ghost, onPressed: () => store.navigate(const OptionsPhase())),
        Btn(S.rules,
            variant: BtnVariant.ghost, onPressed: () => store.navigate(const RulesPhase())),
      ],
    );
  }
}

class _Notice extends StatelessWidget {
  final String text;
  const _Notice(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(text,
            textAlign: TextAlign.center,
            style: const TextStyle(color: C.secondary, fontWeight: FontWeight.w700)),
      );
}

class _Heading extends StatelessWidget {
  final String text;
  const _Heading(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(text,
            style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: C.text)),
      );
}

class PlayersScreen extends StatefulWidget {
  final SessionStore store;
  const PlayersScreen(this.store, {super.key});

  @override
  State<PlayersScreen> createState() => _PlayersScreenState();
}

class _PlayersScreenState extends State<PlayersScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _add() {
    if (_controller.text.trim().isEmpty) return;
    widget.store.addPlayer(_controller.text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.store.session;
    final full = s.players.length >= maxPlayers;

    return Screen(
      children: [
        const _Heading(S.players),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                enabled: !full,
                maxLength: 16,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _add(),
                style: const TextStyle(color: C.text, fontSize: 18),
                decoration: InputDecoration(
                  hintText: S.playerNameHint,
                  counterText: '',
                  hintStyle: const TextStyle(color: C.textDim),
                  filled: true,
                  fillColor: C.surface,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: C.border, width: 2),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: C.border, width: 2),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: C.accent, width: 2),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 100,
              child: Btn(S.addPlayer, onPressed: full ? null : _add),
            ),
          ],
        ),
        if (full) const _Notice(S.tableFull),
        const SizedBox(height: 8),
        for (final p in s.players)
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.only(left: 8, right: 16, top: 6, bottom: 6),
            decoration: BoxDecoration(
              color: C.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(p.name,
                      style: const TextStyle(fontSize: 18, color: C.text)),
                ),
                TextButton(
                  onPressed: () => widget.store.removePlayer(p.id),
                  child: const Text(S.removePlayer,
                      style: TextStyle(color: C.danger, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        const SizedBox(height: 8),
        Btn(S.back,
            variant: BtnVariant.ghost,
            onPressed: () => widget.store.navigate(const HomePhase())),
      ],
    );
  }
}

class PacksScreen extends StatelessWidget {
  final SessionStore store;
  const PacksScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final visible =
        allPacks.where((p) => p.tier == Tier.family || s.friendsUnlocked);

    return Screen(
      children: [
        const _Heading(S.packs),
        if (s.selectedPackIds.isEmpty) const _Notice(S.needOnePack),
        for (final pack in visible)
          CheckboxListTile(
            value: s.selectedPackIds.contains(pack.id),
            onChanged: (_) => store.togglePack(pack.id),
            activeColor: C.accent,
            checkColor: C.accentText,
            contentPadding: EdgeInsets.zero,
            title: Text('${pack.emoji} ${pack.name}',
                style: const TextStyle(fontSize: 18, color: C.text)),
          ),
        if (!s.friendsUnlocked) ...[
          const _Notice(S.friendsWarning),
          Btn(S.unlockFriends,
              variant: BtnVariant.ghost, onPressed: store.unlockFriends),
        ],
        const SizedBox(height: 8),
        Btn(S.back,
            variant: BtnVariant.ghost,
            onPressed: () => store.navigate(const HomePhase())),
      ],
    );
  }
}

class OptionsScreen extends StatelessWidget {
  final SessionStore store;
  const OptionsScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    final s = store.session;
    final cap = maxImpostorCount(
        s.players.length < minPlayers ? minPlayers : s.players.length);

    return Screen(
      children: [
        const _Heading(S.options),
        const _Legend(S.variant),
        _Radio<VariantSetting>(
            label: S.variantRandom,
            value: null,
            group: s.variantSetting,
            onTap: () => store.setVariant(null)),
        _Radio<VariantSetting>(
            label: S.variantBarrani,
            hint: S.variantBarraniHint,
            value: Variant.barrani,
            group: s.variantSetting,
            onTap: () => store.setVariant(Variant.barrani)),
        _Radio<VariantSetting>(
            label: S.variantChbih,
            hint: S.variantChbihHint,
            value: Variant.chbih,
            group: s.variantSetting,
            onTap: () => store.setVariant(Variant.chbih)),
        const SizedBox(height: 16),
        const _Legend(S.impostorCount),
        for (var i = 1; i <= cap; i++)
          _Radio<int>(
              label: '$i',
              value: i,
              group: s.impostorCount,
              onTap: () => store.setImpostorCount(i)),
        const SizedBox(height: 16),
        const _Legend(S.discussionTime),
        for (final seconds in kTimerChoices)
          _Radio<int?>(
              label: seconds == null ? S.noTimer : '${seconds ~/ 60} ${S.minutes}',
              value: seconds,
              group: s.timerSeconds,
              onTap: () => store.setTimer(seconds)),
        const SizedBox(height: 8),
        Btn(S.back,
            variant: BtnVariant.ghost,
            onPressed: () => store.navigate(const HomePhase())),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  final String text;
  const _Legend(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(text,
            style: const TextStyle(
                color: C.accent, fontWeight: FontWeight.w700, fontSize: 19)),
      );
}

class _Radio<T> extends StatelessWidget {
  final String label;
  final String? hint;
  final T value;
  final T group;
  final VoidCallback onTap;

  const _Radio({
    required this.label,
    this.hint,
    required this.value,
    required this.group,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final selected = value == group;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                color: selected ? C.accent : C.border, size: 26),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 18, color: C.text)),
                  if (hint != null)
                    Text(hint!,
                        style: const TextStyle(fontSize: 14, color: C.textDim)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RulesScreen extends StatelessWidget {
  final SessionStore store;
  const RulesScreen(this.store, {super.key});

  @override
  Widget build(BuildContext context) {
    return Screen(
      children: [
        const _Heading(S.rules),
        for (var i = 0; i < S.rulesBody.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text('${i + 1}. ${S.rulesBody[i]}',
                style: const TextStyle(fontSize: 17, color: C.text, height: 1.5)),
          ),
        const Text('${S.version} 0.1.0', style: TextStyle(color: C.textDim)),
        const SizedBox(height: 8),
        Btn(S.back,
            variant: BtnVariant.ghost,
            onPressed: () => store.navigate(const HomePhase())),
      ],
    );
  }
}
