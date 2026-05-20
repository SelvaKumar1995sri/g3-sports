import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class PublicProfileScreen extends ConsumerWidget {
  final String userId;
  const PublicProfileScreen({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Player Profile', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/users/$userId'),
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          if (snap.hasError) return Center(child: Text('${snap.error}', style: const TextStyle(color: Colors.redAccent)));
          final u = snap.data?.data as Map<String, dynamic>? ?? {};
          final name = (u['fullName'] ?? u['username'] ?? 'Player') as String;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              CircleAvatar(
                radius: 40,
                backgroundColor: const Color(0xFF00E5FF),
                child: Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.black, fontSize: 32, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              Text(name, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              Text((u['role'] as String? ?? 'player').toUpperCase(), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12, letterSpacing: 2)),
            ],
          );
        },
      ),
    );
  }
}
