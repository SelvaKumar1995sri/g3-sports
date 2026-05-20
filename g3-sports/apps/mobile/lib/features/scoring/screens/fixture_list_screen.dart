import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../repositories/score_repository.dart';

class FixtureListScreen extends ConsumerWidget {
  const FixtureListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Fixtures', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: ref.read(scoreRepoProvider).fetchMyFixtures(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          if (snap.hasError) return Center(child: Text('${snap.error}', style: const TextStyle(color: Colors.redAccent)));
          final matches = snap.data ?? [];
          if (matches.isEmpty) return const Center(child: Text('No matches assigned', style: TextStyle(color: Colors.white54)));

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: matches.length,
            itemBuilder: (ctx, i) {
              final m = matches[i] as Map<String, dynamic>;
              final teamA = m['teamA']?['name'] ?? 'TBD';
              final teamB = m['teamB']?['name'] ?? 'TBD';
              final status = m['status'] as String;
              final matchId = m['id'] as String;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF111118),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Round ${m['round'] ?? '?'}', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text('$teamA  vs  $teamB', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 10),
                    Row(children: [
                      if (status == 'scheduled')
                        ElevatedButton(
                          onPressed: () => context.push('/fixtures/$matchId/start'),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                          child: const Text('Start Match'),
                        )
                      else if (status == 'live')
                        ElevatedButton(
                          onPressed: () => context.push('/matches/$matchId/score'),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.greenAccent, foregroundColor: Colors.black),
                          child: const Text('Continue Scoring'),
                        )
                      else
                        const Text('COMPLETED', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 12, fontWeight: FontWeight.bold)),
                    ]),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
