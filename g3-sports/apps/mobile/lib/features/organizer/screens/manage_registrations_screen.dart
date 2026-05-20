import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ManageRegistrationsScreen extends ConsumerWidget {
  final String tournamentId;
  const ManageRegistrationsScreen({super.key, required this.tournamentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Registrations', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/tournaments/$tournamentId/teams'),
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          final list = (snap.data?.data as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No registrations yet', style: TextStyle(color: Colors.white54)));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (ctx, i) {
              final reg = list[i] as Map<String, dynamic>;
              final team = reg['team'] as Map<String, dynamic>? ?? {};
              return ListTile(
                title: Text(team['name'] as String? ?? '', style: const TextStyle(color: Colors.white)),
                subtitle: Text('${team['sport'] ?? ''}', style: const TextStyle(color: Colors.white38)),
                trailing: const Icon(Icons.check_circle, color: Color(0xFF00E5FF)),
              );
            },
          );
        },
      ),
    );
  }
}
