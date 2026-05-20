import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../repositories/score_repository.dart';

class StartMatchScreen extends ConsumerStatefulWidget {
  final String matchId;
  const StartMatchScreen({super.key, required this.matchId});

  @override
  ConsumerState<StartMatchScreen> createState() => _StartMatchScreenState();
}

class _StartMatchScreenState extends ConsumerState<StartMatchScreen> {
  int _points = 21;
  String _deuceRule = 'STANDARD';
  bool _loading = false;
  String? _error;

  Future<void> _start() async {
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(scoreRepoProvider).startMatch(widget.matchId, _points, _deuceRule);
      if (mounted) context.pushReplacement('/matches/${widget.matchId}/score');
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Start Match', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('POINTS PER SET', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            Row(children: [
              _choiceButton('11', _points == 11, () => setState(() => _points = 11)),
              const SizedBox(width: 12),
              _choiceButton('21', _points == 21, () => setState(() => _points = 21)),
            ]),
            const SizedBox(height: 28),
            const Text('DEUCE RULE (AT TIE)', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            _deuceOption('GOLDEN_POINT', 'Golden Point', 'Next point wins the set'),
            const SizedBox(height: 8),
            _deuceOption('STANDARD', 'Standard', 'First to lead by 2 points wins'),
            const Spacer(),
            if (_error != null) ...[
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              const SizedBox(height: 12),
            ],
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _start,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                    : const Text('Start Match', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _choiceButton(String label, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 80,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF00E5FF).withOpacity(0.15) : const Color(0xFF111118),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? const Color(0xFF00E5FF) : Colors.white.withOpacity(0.1)),
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: selected ? const Color(0xFF00E5FF) : Colors.white54, fontWeight: FontWeight.bold, fontSize: 18)),
      ),
    );
  }

  Widget _deuceOption(String value, String title, String subtitle) {
    final selected = _deuceRule == value;
    return GestureDetector(
      onTap: () => setState(() => _deuceRule = value),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF00E5FF).withOpacity(0.1) : const Color(0xFF111118),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? const Color(0xFF00E5FF) : Colors.white.withOpacity(0.1)),
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: TextStyle(color: selected ? const Color(0xFF00E5FF) : Colors.white, fontWeight: FontWeight.bold)),
            Text(subtitle, style: const TextStyle(color: Colors.white38, fontSize: 12)),
          ])),
          if (selected) const Icon(Icons.check_circle, color: Color(0xFF00E5FF), size: 20),
        ]),
      ),
    );
  }
}
