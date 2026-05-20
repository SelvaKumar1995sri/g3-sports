import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/socket/socket_client.dart';
import '../../../core/api/api_client.dart';

class LiveSpectatorScreen extends ConsumerStatefulWidget {
  final String matchId;
  const LiveSpectatorScreen({super.key, required this.matchId});

  @override
  ConsumerState<LiveSpectatorScreen> createState() => _LiveSpectatorScreenState();
}

class _LiveSpectatorScreenState extends ConsumerState<LiveSpectatorScreen> {
  Map<String, dynamic>? _scoreData;
  Map<String, dynamic>? _matchData;
  StreamSubscription? _sub;
  bool _connected = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final dio = ref.read(dioProvider);
    try {
      final resp = await dio.get('/matches/${widget.matchId}');
      setState(() => _matchData = resp.data as Map<String, dynamic>);
    } catch (_) {}

    try {
      final resp = await dio.get('/score/badminton/${widget.matchId}');
      setState(() => _scoreData = {'sets': resp.data});
    } catch (_) {}

    final client = ref.read(socketClientProvider);
    await client.connect();
    client.joinRoom(widget.matchId);
    setState(() => _connected = true);
    _sub = client.scoreUpdates().listen((data) {
      if (data['match_id'] == widget.matchId) {
        setState(() => _scoreData = data);
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    ref.read(socketClientProvider).leaveRoom(widget.matchId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final teamA = _matchData?['teamA']?['name'] ?? 'Team A';
    final teamB = _matchData?['teamB']?['name'] ?? 'Team B';
    final sets = (_scoreData?['team_a_score']?['sets'] as List?) ?? [];
    final setsB = (_scoreData?['team_b_score']?['sets'] as List?) ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Live Match', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: _connected ? Colors.greenAccent : Colors.redAccent, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Text(_connected ? 'LIVE' : 'Connecting…', style: TextStyle(color: _connected ? Colors.greenAccent : Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold)),
            ]),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: Column(children: [
                  Text(teamA, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(sets.isNotEmpty ? '${sets.last}' : '0', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 64, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
                ])),
                const Text('vs', style: TextStyle(color: Colors.white38, fontSize: 20)),
                Expanded(child: Column(children: [
                  Text(teamB, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(setsB.isNotEmpty ? '${setsB.last}' : '0', style: const TextStyle(color: Colors.white, fontSize: 64, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
                ])),
              ],
            ),
            const SizedBox(height: 24),
            if (sets.length > 1)
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (int i = 0; i < sets.length - 1; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text('Set ${i+1}: ${sets[i]} – ${setsB[i]}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                  ),
              ]),
          ],
        ),
      ),
    );
  }
}
