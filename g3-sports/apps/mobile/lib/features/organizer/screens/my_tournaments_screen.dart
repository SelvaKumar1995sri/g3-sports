import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class MyTournamentsScreen extends ConsumerWidget {
  const MyTournamentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Tournaments', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/create-tournament'),
        backgroundColor: const Color(0xFF00E5FF),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('New'),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/tournaments/mine'),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          final list = (snap.data?.data as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No tournaments yet', style: TextStyle(color: Colors.white54)));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (ctx, i) {
              final t = list[i] as Map<String, dynamic>;
              return ListTile(
                title: Text(t['name'] as String? ?? '', style: const TextStyle(color: Colors.white)),
                subtitle: Text('${t['status']}', style: const TextStyle(color: Colors.white38)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () => context.push('/tournaments/${t['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
