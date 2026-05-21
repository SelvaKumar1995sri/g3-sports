import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ManageRegistrationsScreen extends ConsumerStatefulWidget {
  final String tournamentId;
  const ManageRegistrationsScreen({super.key, required this.tournamentId});

  @override
  ConsumerState<ManageRegistrationsScreen> createState() => _ManageRegistrationsScreenState();
}

class _ManageRegistrationsScreenState extends ConsumerState<ManageRegistrationsScreen> {
  List<Map<String, dynamic>> _requests = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final resp = await ref.read(dioProvider).get('/tournaments/${widget.tournamentId}/join-requests');
      final list = resp.data as List? ?? [];
      setState(() {
        _requests = list.map((e) => e as Map<String, dynamic>).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _review(String reqId, String action) async {
    try {
      await ref.read(dioProvider).patch(
        '/tournaments/${widget.tournamentId}/join-requests/$reqId',
        data: {'action': action},
      );
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pending = _requests.where((r) => r['status'] == 'pending').toList();
    final reviewed = _requests.where((r) => r['status'] != 'pending').toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Join Requests', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.redAccent)))
              : _requests.isEmpty
                  ? const Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.inbox_outlined, color: Colors.white24, size: 48),
                        SizedBox(height: 12),
                        Text('No join requests yet', style: TextStyle(color: Colors.white38)),
                      ]),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (pending.isNotEmpty) ...[
                          _sectionHeader('Pending (${pending.length})'),
                          ...pending.map((r) => _requestCard(r, showActions: true)),
                        ],
                        if (reviewed.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          _sectionHeader('Reviewed (${reviewed.length})'),
                          ...reviewed.map((r) => _requestCard(r, showActions: false)),
                        ],
                      ],
                    ),
    );
  }

  Widget _sectionHeader(String title) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Text(title, style: const TextStyle(color: Colors.white38, fontSize: 12, letterSpacing: 1.5, fontWeight: FontWeight.bold)),
  );

  Widget _requestCard(Map<String, dynamic> req, {required bool showActions}) {
    final player = req['player'] as Map<String, dynamic>? ?? {};
    final name = player['fullName'] ?? player['username'] ?? player['phone'] ?? 'Player';
    final phone = player['phone'] ?? '';
    final type = req['type'] as String? ?? 'singles';
    final partnerPhone = req['partnerPhone'] as String?;
    final status = req['status'] as String? ?? 'pending';

    final statusColor = status == 'approved'
        ? Colors.greenAccent
        : status == 'denied'
            ? Colors.redAccent
            : Colors.orange;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111118),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            backgroundColor: const Color(0xFF00E5FF).withOpacity(0.15),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            if (phone.isNotEmpty)
              Text(phone, style: const TextStyle(color: Colors.white38, fontSize: 12)),
          ])),
          // Status badge
          if (!showActions)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
        ]),
        const SizedBox(height: 10),

        // Type badge
        Row(children: [
          Icon(type == 'doubles' ? Icons.people : Icons.person, color: Colors.white38, size: 15),
          const SizedBox(width: 6),
          Text(type.toUpperCase(), style: const TextStyle(color: Colors.white38, fontSize: 12)),
          if (partnerPhone != null && partnerPhone.isNotEmpty) ...[
            const Text(' · Partner: ', style: TextStyle(color: Colors.white24, fontSize: 12)),
            Text(partnerPhone, style: const TextStyle(color: Colors.white54, fontSize: 12)),
          ],
        ]),

        // Approve / Deny buttons
        if (showActions) ...[
          const SizedBox(height: 14),
          Row(children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _review(req['id'] as String, 'deny'),
                icon: const Icon(Icons.close, size: 16),
                label: const Text('Deny'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.redAccent,
                  side: const BorderSide(color: Colors.redAccent),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _review(req['id'] as String, 'approve'),
                icon: const Icon(Icons.check, size: 16),
                label: const Text('Approve'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.greenAccent,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ]),
        ],
      ]),
    );
  }
}
