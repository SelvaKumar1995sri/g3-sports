import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';

// Provider to fetch the current role request status
final roleRequestStatusProvider = FutureProvider.autoDispose<String?>((ref) async {
  final dio = ref.read(dioProvider);
  try {
    final resp = await dio.get('/users/role-requests/mine');
    return resp.data?['status'] as String?;
  } catch (_) {
    return null;
  }
});

class MyProfileScreen extends ConsumerWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final roleRequestAsync = ref.watch(roleRequestStatusProvider);

    if (user == null) {
      return const Center(child: Text('Not logged in', style: TextStyle(color: Colors.white54)));
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Profile', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          // Refresh button to reload user data from server
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: () => _refreshUser(ref),
            tooltip: 'Refresh profile',
          ),
          TextButton(
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              ref.read(currentUserProvider.notifier).state = null;
              if (context.mounted) context.go('/tournaments');
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _refreshUser(ref),
        color: const Color(0xFF00E5FF),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: const Color(0xFF00E5FF),
              child: Text(
                (user.displayName ?? 'P')[0].toUpperCase(),
                style: const TextStyle(color: Colors.black, fontSize: 32, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              user.displayName ?? 'Player',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            Text(
              user.role.toUpperCase(),
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12, letterSpacing: 2),
            ),
            const SizedBox(height: 32),

            // Show organizer tools if approved
            if (user.isOrganizer) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFA3E635).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFA3E635).withOpacity(0.4)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.verified, color: Color(0xFFA3E635), size: 18),
                    SizedBox(width: 8),
                    Text('Organizer Access Granted', style: TextStyle(color: Color(0xFFA3E635), fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/my-tournaments'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('My Tournaments'),
              ),
            ],

            // Show request status for non-organizers
            if (!user.isOrganizer) ...[
              roleRequestAsync.when(
                loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
                error: (_, __) => _buildRequestButton(context, ref),
                data: (status) {
                  if (status == 'pending') {
                    return _buildPendingStatus();
                  } else if (status == 'denied') {
                    return _buildDeniedStatus(context, ref);
                  } else {
                    return _buildRequestButton(context, ref);
                  }
                },
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRequestButton(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        OutlinedButton(
          onPressed: () => _requestOrganizerAccess(context, ref),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF00E5FF),
            side: const BorderSide(color: Color(0xFF00E5FF)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: const Text('Request Organizer Access'),
        ),
        const SizedBox(height: 8),
        const Text(
          'Submit a request for the admin to review. Once approved, you can create tournaments.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white38, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildPendingStatus() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.withOpacity(0.4)),
      ),
      child: const Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_empty, color: Colors.orange, size: 18),
              SizedBox(width: 8),
              Text('Request Pending', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          SizedBox(height: 8),
          Text(
            'Your organizer request is under review. Pull down to refresh status.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white38, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildDeniedStatus(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.withOpacity(0.4)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.cancel, color: Colors.red, size: 18),
              SizedBox(width: 8),
              Text('Request Denied', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () => _requestOrganizerAccess(context, ref),
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF00E5FF),
            side: const BorderSide(color: Color(0xFF00E5FF)),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: const Text('Request Again'),
        ),
      ],
    );
  }

  Future<void> _refreshUser(WidgetRef ref) async {
    try {
      final authService = ref.read(authServiceProvider);
      final freshUser = await authService.fetchMe();
      ref.read(currentUserProvider.notifier).state = freshUser;
      // Invalidate role request status to re-fetch
      ref.invalidate(roleRequestStatusProvider);
    } catch (_) {}
  }

  Future<void> _requestOrganizerAccess(BuildContext context, WidgetRef ref) async {
    String reason = '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Request Organizer Access', style: TextStyle(color: Colors.white)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Briefly describe why you want to organize tournaments:', style: TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 12),
          TextField(
            style: const TextStyle(color: Colors.white),
            onChanged: (v) => reason = v,
            decoration: const InputDecoration(
              hintText: 'Optional reason…',
              hintStyle: TextStyle(color: Colors.white24),
              filled: true,
              fillColor: Color(0xFF0A0A0F),
              border: OutlineInputBorder(borderSide: BorderSide.none),
            ),
            maxLines: 3,
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: Colors.white38))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit', style: TextStyle(color: Color(0xFF00E5FF)))),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        await ref.read(dioProvider).post('/users/role-requests', data: {'reason': reason});
        ref.invalidate(roleRequestStatusProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Request submitted! Admin will review it.')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
        }
      }
    }
  }
}
