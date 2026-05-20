import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../repositories/score_repository.dart';
import '../../../core/api/api_client.dart';

class LiveScoringScreen extends ConsumerStatefulWidget {
  final String matchId;
  const LiveScoringScreen({super.key, required this.matchId});

  @override
  ConsumerState<LiveScoringScreen> createState() => _LiveScoringScreenState();
}

class _LiveScoringScreenState extends ConsumerState<LiveScoringScreen> {
  Map<String, dynamic>? _match;
  List<dynamic> _sets = [];
  int _currentSet = 1;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadMatch();
    _loadScore();
  }

  Future<void> _loadMatch() async {
    final dio = ref.read(dioProvider);
    final resp = await dio.get('/matches/${widget.matchId}');
    setState(() => _match = resp.data as Map<String, dynamic>);
  }

  Future<void> _loadScore() async {
    final sets = await ref.read(scoreRepoProvider).getScore(widget.matchId);
    setState(() {
      _sets = sets;
      final incomplete = sets.where((s) => s['isCompleted'] == false);
      if (incomplete.isNotEmpty) _currentSet = incomplete.first['setNumber'] as int;
      else _currentSet = sets.length + 1;
    });
  }

  Future<void> _recordPoint(String team) async {
    setState(() => _loading = true);
    try {
      await ref.read(scoreRepoProvider).recordPoint(widget.matchId, team, _currentSet);
      await _loadScore();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _undo() async {
    setState(() => _loading = true);
    try {
      await ref.read(scoreRepoProvider).undoPoint(widget.matchId);
      await _loadScore();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _endMatch(String winnerTeamId) async {
    await ref.read(scoreRepoProvider).completeMatch(widget.matchId, winnerTeamId);
    if (mounted) context.pop();
  }

  void _showEndMatchDialog() {
    final teamA = _match?['teamA'];
    final teamB = _match?['teamB'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF111118),
        title: const Text('End Match', style: TextStyle(color: Colors.white)),
        content: const Text('Who won the match?', style: TextStyle(color: Colors.white54)),
        actions: [
          TextButton(onPressed: () { Navigator.pop(context); _endMatch(teamA['id']); }, child: Text(teamA?['name'] ?? 'Team A', style: const TextStyle(color: Color(0xFF00E5FF)))),
          TextButton(onPressed: () { Navigator.pop(context); _endMatch(teamB['id']); }, child: Text(teamB?['name'] ?? 'Team B', style: const TextStyle(color: Color(0xFF00E5FF)))),
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel', style: TextStyle(color: Colors.white38))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final teamAName = _match?['teamA']?['name'] ?? 'Team A';
    final teamBName = _match?['teamB']?['name'] ?? 'Team B';
    final currentSetData = _sets.where((s) => s['setNumber'] == _currentSet).firstOrNull;
    final aPoints = currentSetData?['teamAPoints'] ?? 0;
    final bPoints = currentSetData?['teamBPoints'] ?? 0;

    int aWins = 0, bWins = 0;
    for (final s in _sets) {
      if (s['isCompleted'] == true) {
        final w = s['setWinner']?['id'];
        if (w == _match?['teamA']?['id']) aWins++;
        else bWins++;
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: Text('Set $_currentSet · Scoring', style: const TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          TextButton(
            onPressed: _showEndMatchDialog,
            child: const Text('End Match', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: const Color(0xFF111118),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Sets: $aWins', style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
              const Text('Best of 3', style: TextStyle(color: Colors.white38, fontSize: 12)),
              Text('Sets: $bWins', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ]),
          ),
          Expanded(
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: _loading ? null : () => _recordPoint('A'),
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E5FF).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF00E5FF).withOpacity(0.3)),
                      ),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(teamAName, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        Text('$aPoints', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 72, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(color: const Color(0xFF00E5FF), borderRadius: BorderRadius.circular(10)),
                          child: const Text('+ POINT', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ]),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: _loading ? null : () => _recordPoint('B'),
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(teamBName, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        Text('$bPoints', style: const TextStyle(color: Colors.white, fontSize: 72, fontWeight: FontWeight.w900)),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                          child: const Text('+ POINT', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ]),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading ? null : () {/* Let = no point */},
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.white54, side: BorderSide(color: Colors.white.withOpacity(0.15)), padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: const Text('Let / Replay'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading ? null : _undo,
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent), padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: const Text('↩ Undo'),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}
