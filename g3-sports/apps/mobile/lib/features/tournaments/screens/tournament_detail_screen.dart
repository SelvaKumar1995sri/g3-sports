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
  Map<String, dynamic>? _myMatch;
  bool _loadingRequest = false;

  @override
  void initState() {
    super.initState();
    _loadMyRequest();
  }

  Future<void> _loadMyRequest() async {
    setState(() => _loadingRequest = true);
    try {
      final resp = await ref.read(dioProvider).get('/tournaments/${widget.id}/join-requests/mine');
      if (mounted) {
        final req = resp.data as Map<String, dynamic>?;
        setState(() {
          _myRequest = req;
          _loadingRequest = false;
        });
        // If approved, also load match info
        if (req != null && req['status'] == 'approved') {
          _loadMyMatch();
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loadingRequest = false);
      // Not joined yet — that's fine
    }
  }

  Future<void> _loadMyMatch() async {
    try {
      final resp = await ref.read(dioProvider).get('/tournaments/${widget.id}/my-match');
      if (mounted) setState(() => _myMatch = resp.data as Map<String, dynamic>?);
    } catch (_) {}
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
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(t.status).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _statusLabel(t.status),
                  style: TextStyle(
                    color: _statusColor(t.status),
                    fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1,
                  ),
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

            const SizedBox(height: 16),

            // ── Cancelled banner ────────────────────────────────────────────
            if (t.status == 'cancelled') ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(children: [
                      Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 18),
                      SizedBox(width: 8),
                      Text('Tournament Cancelled',
                          style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 14)),
                    ]),
                    if (t.cancellationReason != null) ...[
                      const SizedBox(height: 8),
                      Text(t.cancellationReason!,
                          style: const TextStyle(color: Colors.white54, fontSize: 13)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            const SizedBox(height: 12),

            // Organizer actions (hide manage button if cancelled)
            if (user != null && t.organizer['id'] == user.id && t.status != 'cancelled') ...[
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

            // Player join button / status
            if (user != null && t.organizer['id'] != user.id) ...[
              if (t.isRegistrationOpen || _myRequest != null) ...[
                _buildJoinButton(context),
                const SizedBox(height: 12),
              ],
              // Match info card (only when approved)
              if (_myRequest != null && _myRequest!['status'] == 'approved') ...[
                _buildMatchInfoCard(),
                const SizedBox(height: 12),
              ],
            ],

            // View bracket — visible to organizer, or approved participants when fixtures exist
            if (user != null) ...[
              if (t.organizer['id'] == user.id ||
                  (_myRequest != null &&
                      _myRequest!['status'] == 'approved' &&
                      _myMatch != null &&
                      _myMatch!['hasFixtures'] == true)) ...[
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
            ],
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
    final isPartner = _myRequest!['isPartner'] as bool? ?? false;
    final requestType = _myRequest!['type'] as String? ?? 'singles';
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

    String statusText;
    if (status == 'pending') {
      statusText = isPartner
          ? 'You have been added as a doubles partner — waiting for organizer approval'
          : 'Join request sent — waiting for organizer approval';
    } else if (status == 'approved') {
      statusText = isPartner
          ? 'You are approved as a doubles partner! ✓'
          : 'Your request has been approved! ✓';
    } else {
      statusText = 'Your request was denied. Contact the organizer.';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: (statusColors[status] ?? Colors.orange).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: (statusColors[status] ?? Colors.orange).withOpacity(0.4)),
          ),
          child: Row(children: [
            Icon(statusIcons[status] ?? Icons.hourglass_top, color: statusColors[status] ?? Colors.orange),
            const SizedBox(width: 10),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(statusText,
                    style: TextStyle(color: statusColors[status] ?? Colors.orange, fontSize: 13)),
                if (requestType == 'doubles') ...[
                  const SizedBox(height: 4),
                  Text(
                    isPartner ? 'Doubles · (invited as partner)' : 'Doubles · (you invited a partner)',
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ],
            )),
          ]),
        ),
      ],
    );
  }

  Widget _buildMatchInfoCard() {
    final hasFixtures = _myMatch?['hasFixtures'] as bool? ?? false;
    final scheduledAt = _myMatch?['scheduledAt'] as String?;
    final round = _myMatch?['round'] as String?;
    final opponentName = _myMatch?['opponentName'] as String?;

    if (!hasFixtures) {
      // Fixtures not generated yet
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white12),
        ),
        child: const Row(children: [
          Icon(Icons.schedule, color: Colors.white38, size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Match time and date will be updated once fixtures are ready.',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            ),
          ),
        ]),
      );
    }

    if (scheduledAt == null && opponentName == null) {
      // Fixtures exist but this player's specific match isn't assigned yet
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF00E5FF).withOpacity(0.3)),
        ),
        child: const Row(children: [
          Icon(Icons.sports_score, color: Color(0xFF00E5FF), size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Fixtures are being finalized. Your match details will appear here soon.',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
          ),
        ]),
      );
    }

    // Full match details available
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.greenAccent.withOpacity(0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.greenAccent.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.emoji_events, color: Colors.greenAccent, size: 18),
            const SizedBox(width: 8),
            Text(
              round != null ? 'Your Match — $round' : 'Your Upcoming Match',
              style: const TextStyle(color: Colors.greenAccent, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ]),
          const SizedBox(height: 10),
          if (opponentName != null)
            _matchDetailRow(Icons.sports_tennis, 'Opponent', opponentName),
          if (scheduledAt != null)
            _matchDetailRow(Icons.calendar_today, 'Scheduled',
                _formatDate(scheduledAt)),
        ],
      ),
    );
  }

  Widget _matchDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Icon(icon, color: Colors.white38, size: 14),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(color: Colors.white38, fontSize: 12)),
        Text(value, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ]),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $h:$m';
    } catch (_) {
      return iso.split('T').first;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return Colors.greenAccent;
      case 'live': return Colors.greenAccent;
      case 'cancelled': return Colors.redAccent;
      case 'completed': return Colors.white38;
      case 'registration': return const Color(0xFFA3E635);
      default: return const Color(0xFF00E5FF); // draft
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'active': return '🏆 ACTIVE — FIXTURES READY';
      case 'live': return '🔴 LIVE';
      case 'cancelled': return '✕ CANCELLED';
      case 'completed': return '✓ COMPLETED';
      case 'registration': return '📋 REGISTRATION OPEN';
      default: return status.toUpperCase();
    }
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
