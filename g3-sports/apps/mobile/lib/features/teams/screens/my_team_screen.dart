import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class MyTeamScreen extends ConsumerWidget {
  const MyTeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Team', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/teams/mine'),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          if (snap.hasError) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('No team yet', style: TextStyle(color: Colors.white54, fontSize: 16)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.push('/create-team'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                  child: const Text('Create Team'),
                ),
              ]),
            );
          }
          final team = snap.data?.data as Map<String, dynamic>?;
          if (team == null) return const Center(child: Text('No team', style: TextStyle(color: Colors.white54)));
          final members = (team['members'] as List?) ?? [];
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(team['name'] as String? ?? '', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('${team['sport'] ?? ''} · ${members.length} members', style: const TextStyle(color: Colors.white38, fontSize: 13)),
              const SizedBox(height: 20),
              ...members.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(backgroundColor: Color(0xFF00E5FF), child: Icon(Icons.person, color: Colors.black)),
                title: Text(m['fullName'] ?? m['username'] ?? 'Player', style: const TextStyle(color: Colors.white)),
                subtitle: Text(m['role'] ?? '', style: const TextStyle(color: Colors.white38, fontSize: 12)),
              )),
            ],
          );
        },
      ),
    );
  }
}
