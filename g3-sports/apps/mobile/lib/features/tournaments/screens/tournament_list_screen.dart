import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';
import '../../auth/providers/auth_provider.dart';

Color _statusColor(String status) {
  switch (status) {
    case 'active': return Colors.greenAccent;
    case 'live': return Colors.greenAccent;
    case 'cancelled': return Colors.redAccent;
    case 'completed': return Colors.white38;
    case 'registration': return const Color(0xFFA3E635);
    default: return const Color(0xFF00E5FF);
  }
}

class TournamentListScreen extends ConsumerWidget {
  const TournamentListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tournamentsAsync = ref.watch(tournamentsProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('G3 Sports', style: TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.w900)),
        actions: [
          if (user == null)
            TextButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign In', style: TextStyle(color: Color(0xFF00E5FF))),
            )
          else
            GestureDetector(
              onTap: () => context.push('/my-profile'),
              child: const Padding(
                padding: EdgeInsets.all(12),
                child: Icon(Icons.person, color: Color(0xFF00E5FF)),
              ),
            ),
        ],
      ),
      floatingActionButton: user?.isOrganizer == true
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/create-tournament'),
              backgroundColor: const Color(0xFF00E5FF),
              foregroundColor: Colors.black,
              label: const Text('New Tournament'),
              icon: const Icon(Icons.add),
            )
          : null,
      body: tournamentsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.redAccent))),
        data: (tournaments) => tournaments.isEmpty
            ? const Center(child: Text('No tournaments yet', style: TextStyle(color: Colors.white54)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: tournaments.length,
                itemBuilder: (context, i) {
                  final t = tournaments[i];
                  final statusColor = _statusColor(t.status);
                  return GestureDetector(
                    onTap: () => context.push('/tournaments/${t.id}'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: t.status == 'cancelled'
                            ? const Color(0xFF1A0F0F)
                            : const Color(0xFF111118),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: t.status == 'cancelled'
                              ? Colors.redAccent.withOpacity(0.2)
                              : Colors.white.withOpacity(0.05),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(t.name,
                                    style: TextStyle(
                                      color: t.status == 'cancelled' ? Colors.white38 : Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                      decoration: t.status == 'cancelled' ? TextDecoration.lineThrough : null,
                                    )),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  t.status.toUpperCase(),
                                  style: TextStyle(
                                    color: statusColor,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('${t.sport.toUpperCase()} · ${t.format}',
                              style: const TextStyle(color: Colors.white54, fontSize: 12)),
                          if (t.location != null) ...[
                            const SizedBox(height: 4),
                            Text('📍 ${t.location}',
                                style: const TextStyle(color: Colors.white38, fontSize: 12)),
                          ],
                          if (t.status == 'cancelled' && t.cancellationReason != null) ...[
                            const SizedBox(height: 6),
                            Text('✕ ${t.cancellationReason!}',
                                style: const TextStyle(color: Colors.redAccent, fontSize: 11),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
