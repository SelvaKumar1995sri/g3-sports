import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';
import '../../auth/providers/auth_provider.dart';

class TournamentDetailScreen extends ConsumerWidget {
  final String id;
  const TournamentDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tAsync = ref.watch(tournamentDetailProvider(id));
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Tournament', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: tAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: Colors.redAccent))),
        data: (t) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(t.name, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('${t.sport.toUpperCase()} · ${t.format}', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 14)),
            if (t.location != null) ...[
              const SizedBox(height: 4),
              Text('📍 ${t.location}', style: const TextStyle(color: Colors.white54, fontSize: 13)),
            ],
            if (t.registrationDeadline != null) ...[
              const SizedBox(height: 4),
              Text('Registration closes: ${t.registrationDeadline}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
            ],
            const SizedBox(height: 24),
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.push('/tournaments/${t.id}/bracket'),
                  style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF00E5FF), side: const BorderSide(color: Color(0xFF00E5FF))),
                  child: const Text('View Bracket'),
                ),
              ),
              if (user != null && t.isRegistrationOpen) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {/* Register team flow */},
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                    child: const Text('Register Team'),
                  ),
                ),
              ],
            ]),
          ],
        ),
      ),
    );
  }
}
