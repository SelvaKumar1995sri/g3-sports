import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';

class BracketScreen extends ConsumerWidget {
  final String tournamentId;
  const BracketScreen({super.key, required this.tournamentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bracketAsync = ref.watch(bracketProvider(tournamentId));

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Bracket', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: bracketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: Colors.redAccent))),
        data: (bracket) {
          final Map<String, List<dynamic>> rounds = {};
          for (final bm in bracket) {
            final round = bm['round'] as String? ?? '1';
            rounds.putIfAbsent(round, () => []).add(bm);
          }
          final sortedRounds = rounds.keys.toList()..sort();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: sortedRounds.map((round) {
              final matches = rounds[round]!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Round $round', style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  ...matches.map((bm) {
                    final match = bm['match'];
                    if (match == null) {
                      return const Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: Text('BYE', style: TextStyle(color: Colors.white38, fontSize: 12)),
                      );
                    }
                    final teamA = match['teamA']?['name'] ?? 'TBD';
                    final teamB = match['teamB']?['name'] ?? 'TBD';
                    final status = match['status'] as String? ?? '';
                    final winnerId = match['winner']?['id'];
                    final teamAId = match['teamA']?['id'];
                    return GestureDetector(
                      onTap: status == 'live'
                          ? () => context.push('/matches/${match['id']}/live')
                          : null,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111118),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: status == 'live' ? Colors.greenAccent.withOpacity(0.4) : Colors.white.withOpacity(0.05),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(child: Text(teamA, style: TextStyle(color: winnerId == teamAId ? const Color(0xFF00E5FF) : Colors.white, fontWeight: FontWeight.w600))),
                            const Text('vs', style: TextStyle(color: Colors.white38)),
                            Expanded(child: Text(teamB, textAlign: TextAlign.right, style: TextStyle(color: winnerId != null && winnerId != teamAId ? const Color(0xFF00E5FF) : Colors.white, fontWeight: FontWeight.w600))),
                            const SizedBox(width: 8),
                            if (status == 'live')
                              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle)),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 16),
                ],
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
