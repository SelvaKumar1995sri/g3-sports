import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../tournaments/providers/tournaments_provider.dart';

class CreateTournamentScreen extends ConsumerStatefulWidget {
  const CreateTournamentScreen({super.key});

  @override
  ConsumerState<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends ConsumerState<CreateTournamentScreen> {
  final _nameCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  String _startDate = '';
  String _endDate = '';
  String _deadline = '';
  String _sport = 'badminton';
  String _format = 'knockout';
  bool _loading = false;
  String? _error;

  static const _sports = ['badminton', 'cricket', 'football', 'basketball', 'volleyball', 'tennis', 'pickleball'];
  static const _formats = ['knockout', 'league', 'group_knockout', 'round_robin'];

  Future<void> _pickDate(void Function(String) onPicked) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) onPicked(picked.toIso8601String().split('T').first);
  }

  Future<void> _create() async {
    if (_nameCtrl.text.trim().isEmpty || _startDate.isEmpty || _endDate.isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(dioProvider).post('/tournaments', data: {
        'name': _nameCtrl.text.trim(),
        'sport': _sport,
        'format': _format,
        'startDate': _startDate,
        'endDate': _endDate,
        'registrationDeadline': _deadline.isEmpty ? null : _deadline,
        'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
      });
      ref.invalidate(tournamentsProvider);
      if (mounted) context.pop();
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Widget _dropdownField(String label, String value, List<String> options, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      dropdownColor: const Color(0xFF111118),
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white38),
        filled: true,
        fillColor: const Color(0xFF111118),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
      items: options.map((o) => DropdownMenuItem(
        value: o,
        child: Text(o.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 14)),
      )).toList(),
      onChanged: onChanged,
    );
  }

  Widget _dateField(String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(color: const Color(0xFF111118), borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Expanded(child: Text(value.isEmpty ? label : value, style: TextStyle(color: value.isEmpty ? Colors.white24 : Colors.white))),
          const Icon(Icons.calendar_today, color: Colors.white38, size: 16),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Create Tournament', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(
            controller: _nameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Tournament Name',
              labelStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF111118),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _locationCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Location (optional)',
              labelStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF111118),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
          const SizedBox(height: 12),
          _dropdownField('Sport', _sport, _sports, (v) => setState(() => _sport = v!)),
          const SizedBox(height: 12),
          _dropdownField('Format', _format, _formats, (v) => setState(() => _format = v!)),
          const SizedBox(height: 12),
          _dateField('Start Date *', _startDate, () => _pickDate((d) => setState(() => _startDate = d))),
          const SizedBox(height: 8),
          _dateField('End Date *', _endDate, () => _pickDate((d) => setState(() => _endDate = d))),
          const SizedBox(height: 8),
          _dateField('Registration Deadline', _deadline, () => _pickDate((d) => setState(() => _deadline = d))),
          if (_error != null) ...[const SizedBox(height: 12), Text(_error!, style: const TextStyle(color: Colors.redAccent))],
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _create,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00E5FF),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                : const Text('Create Tournament', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
