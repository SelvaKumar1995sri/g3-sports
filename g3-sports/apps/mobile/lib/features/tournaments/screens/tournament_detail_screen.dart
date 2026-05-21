import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';

class TournamentDetailScreen extends ConsumerStatefulWidget {
  final String id;
  const TournamentDetailScreen({super.key, required this.id});

  @override
  ConsumerState<TournamentDetailScreen> createState() => _TournamentDetailScreenState();
}

class _TournamentDetailScreenState extends ConsumerState<TournamentDetailScreen> {
  Map<String, dynamic>? _myRequest;
  bool _loadingRequest = false;

  @override
  void initState() {
    super.initState();
    _loadMyRequest();
  }

  Future<void> _loadMyRequest() async {
    try {
      final resp = await ref.read(dioProvider).get('/tournaments/${widget.id}/join-requests/mine');
      if (mounted) setState(() => _myRequest = resp.data as Map<String, dynamic>?);
    } catch (_) {
      // Not joined yet — that's fine
    }
  }

  void _showJoinSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF111118),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      isScrollControlled: true,
      builder: (_) => _JoinRequestSheet(
        tournamentId: widget.id,
        onSuccess: () {
          Navigator.pop(context);
          _loadMyRequest();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tAsync = ref.watch(tournamentDetailProvider(widget.id));
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
            // Status badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: t.status == 'live' ? Colors.green.withOpacity(0.2) : const Color(0xFF00E5FF).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                t.status.toUpperCase(),
                style: TextStyle(
                  color: t.status == 'live' ? Colors.greenAccent : const Color(0xFF00E5FF),
                  fontSize: 11, fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(t.name, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('${t.sport.toUpperCase()} · ${t.format.replaceAll('_', ' ').toUpperCase()}',
                style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 14)),
            if (t.location != null) ...[
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.location_on, color: Colors.white38, size: 16),
                const SizedBox(width: 4),
                Text(t.location!, style: const TextStyle(color: Colors.white54, fontSize: 13)),
              ]),
            ],
            const SizedBox(height: 16),
            const Divider(color: Colors.white12),
            const SizedBox(height: 12),

            // Dates
            if (t.startDate != null) _infoRow(Icons.calendar_today, 'Start Date', t.startDate!.split('T').first),
            if (t.endDate != null) _infoRow(Icons.event, 'End Date', t.endDate!.split('T').first),
            if (t.registrationDeadline != null)
              _infoRow(Icons.timer, 'Registration Deadline', t.registrationDeadline!.split('T').first),

            // Organizer
            if ((t.organizer['fullName'] ?? t.organizer['username']) != null) ...[
              const SizedBox(height: 4),
              _infoRow(Icons.person, 'Organizer',
                  t.organizer['fullName'] ?? t.organizer['username'] ?? 'Organizer'),
            ],

            const SizedBox(height: 28),

            // Organizer actions
            if (user != null && t.organizer['id'] == user.id) ...[
              ElevatedButton.icon(
                onPressed: () => context.push('/tournaments/${t.id}/registrations'),
                icon: const Icon(Icons.people),
                label: const Text('Manage Join Requests'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Player join button
            if (user != null && t.organizer['id'] != user.id && t.isRegistrationOpen) ...[
              _buildJoinButton(context),
              const SizedBox(height: 12),
            ],

            // View bracket
            OutlinedButton.icon(
              onPressed: () => context.push('/tournaments/${t.id}/bracket'),
              icon: const Icon(Icons.account_tree),
              label: const Text('View Bracket'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF00E5FF),
                side: const BorderSide(color: Color(0xFF00E5FF)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildJoinButton(BuildContext context) {
    if (_loadingRequest) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
    }
    if (_myRequest == null) {
      return ElevatedButton.icon(
        onPressed: () => _showJoinSheet(context),
        icon: const Icon(Icons.sports),
        label: const Text('Request to Join', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFA3E635),
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
    final status = _myRequest!['status'] as String? ?? 'pending';
    final statusColors = {
      'pending': Colors.orange,
      'approved': Colors.greenAccent,
      'denied': Colors.redAccent,
    };
    final statusIcons = {
      'pending': Icons.hourglass_top,
      'approved': Icons.check_circle,
      'denied': Icons.cancel,
    };
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: (statusColors[status] ?? Colors.orange).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: (statusColors[status] ?? Colors.orange).withOpacity(0.4)),
      ),
      child: Row(children: [
        Icon(statusIcons[status] ?? Icons.hourglass_top, color: statusColors[status] ?? Colors.orange),
        const SizedBox(width: 10),
        Expanded(child: Text(
          status == 'pending' ? 'Join request sent — waiting for organizer approval'
              : status == 'approved' ? 'Your request has been approved! ✓'
              : 'Your request was denied. Contact the organizer.',
          style: TextStyle(color: statusColors[status] ?? Colors.orange, fontSize: 13),
        )),
      ]),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Icon(icon, color: Colors.white38, size: 16),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(color: Colors.white38, fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      ]),
    );
  }
}

// ─── Join Request Bottom Sheet ────────────────────────────────────────────────

class _JoinRequestSheet extends ConsumerStatefulWidget {
  final String tournamentId;
  final VoidCallback onSuccess;
  const _JoinRequestSheet({required this.tournamentId, required this.onSuccess});

  @override
  ConsumerState<_JoinRequestSheet> createState() => _JoinRequestSheetState();
}

class _JoinRequestSheetState extends ConsumerState<_JoinRequestSheet> {
  String _type = 'singles';
  final _partnerCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _partnerCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_type == 'doubles' && _partnerCtrl.text.trim().length < 10) {
      setState(() => _error = 'Please enter a valid partner phone number');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(dioProvider).post('/tournaments/${widget.tournamentId}/join-requests', data: {
        'type': _type,
        if (_type == 'doubles') 'partnerPhone': _partnerCtrl.text.trim(),
      });
      widget.onSuccess();
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Request to Join', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text('Choose how you want to participate', style: TextStyle(color: Colors.white38, fontSize: 13)),
          const SizedBox(height: 24),

          // Singles / Doubles toggle
          Row(children: [
            Expanded(child: _typeButton('singles', Icons.person, 'Singles')),
            const SizedBox(width: 12),
            Expanded(child: _typeButton('doubles', Icons.people, 'Doubles')),
          ]),

          // Partner phone (only for doubles)
          if (_type == 'doubles') ...[
            const SizedBox(height: 20),
            const Text('PARTNER PHONE NUMBER', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 1.5)),
            const SizedBox(height: 8),
            TextField(
              controller: _partnerCtrl,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'e.g. +91 98765 43210',
                hintStyle: const TextStyle(color: Colors.white24),
                prefixIcon: const Icon(Icons.phone, color: Colors.white38, size: 18),
                filled: true,
                fillColor: const Color(0xFF0A0A0F),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF00E5FF)),
                ),
              ),
            ),
          ],

          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
          ],

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00E5FF),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                  ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                  : const Text('Send Request', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _typeButton(String value, IconData icon, String label) {
    final selected = _type == value;
    return GestureDetector(
      onTap: () => setState(() => _type = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF00E5FF).withOpacity(0.15) : const Color(0xFF0A0A0F),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? const Color(0xFF00E5FF) : Colors.white12,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, color: selected ? const Color(0xFF00E5FF) : Colors.white38, size: 28),
          const SizedBox(height: 6),
          Text(label, style: TextStyle(
            color: selected ? const Color(0xFF00E5FF) : Colors.white54,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          )),
        ]),
      ),
    );
  }
}
