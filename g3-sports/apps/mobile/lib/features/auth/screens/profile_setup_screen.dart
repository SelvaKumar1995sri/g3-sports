import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../providers/auth_provider.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  final _nameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();

  bool _loading = false;
  bool _checkingUsername = false;
  bool? _usernameAvailable; // null = not checked, true = available, false = taken
  List<String> _suggestions = [];
  String? _error;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    super.dispose();
  }

  void _onUsernameChanged(String value) {
    _debounce?.cancel();
    final clean = value.trim().toLowerCase();

    if (clean.isEmpty) {
      setState(() { _usernameAvailable = null; _suggestions = []; });
      return;
    }

    if (clean.length < 3) {
      setState(() { _usernameAvailable = false; _suggestions = []; });
      return;
    }

    setState(() { _checkingUsername = true; _usernameAvailable = null; });

    _debounce = Timer(const Duration(milliseconds: 600), () async {
      try {
        final dio = ref.read(dioProvider);
        final resp = await dio.get('/auth/check-username?username=$clean');
        final available = resp.data['available'] as bool? ?? false;

        List<String> suggestions = [];
        if (!available) {
          final sResp = await dio.get('/auth/suggest-usernames?base=$clean');
          suggestions = List<String>.from(sResp.data['suggestions'] ?? []);
        }

        if (mounted) {
          setState(() {
            _usernameAvailable = available;
            _suggestions = suggestions;
            _checkingUsername = false;
          });
        }
      } catch (_) {
        if (mounted) setState(() { _checkingUsername = false; });
      }
    });
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    final username = _usernameCtrl.text.trim().toLowerCase();

    if (name.isEmpty) {
      setState(() { _error = 'Please enter your display name'; });
      return;
    }
    if (username.length < 3) {
      setState(() { _error = 'Username must be at least 3 characters'; });
      return;
    }
    if (_usernameAvailable == false) {
      setState(() { _error = 'Username is already taken'; });
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      await dio.put('/users/me', data: {
        'fullName': name,
        'username': username,
      });
      final user = await ref.read(authServiceProvider).fetchMe();
      ref.read(currentUserProvider.notifier).state = user;
      if (mounted) context.go('/tournaments');
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              const Text(
                'Set up your profile',
                style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Choose a unique username and display name',
                style: TextStyle(color: Colors.white38),
              ),
              const SizedBox(height: 40),

              // Display Name
              const Text('DISPLAY NAME', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 8),
              TextField(
                controller: _nameCtrl,
                style: const TextStyle(color: Colors.white),
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  hintText: 'e.g. Selva Kumar',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFF00E5FF)),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Username
              const Text('USERNAME', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 4),
              const Text(
                'Minimum 3 characters, letters and numbers only',
                style: TextStyle(color: Colors.white24, fontSize: 11),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _usernameCtrl,
                style: const TextStyle(color: Colors.white),
                onChanged: _onUsernameChanged,
                decoration: InputDecoration(
                  hintText: 'e.g. selva_g3',
                  hintStyle: const TextStyle(color: Colors.white24),
                  prefixText: '@',
                  prefixStyle: const TextStyle(color: Color(0xFF00E5FF)),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: _usernameAvailable == true
                          ? const Color(0xFFA3E635)
                          : _usernameAvailable == false
                              ? Colors.redAccent
                              : const Color(0xFF00E5FF),
                    ),
                  ),
                  suffixIcon: _checkingUsername
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)),
                          ),
                        )
                      : _usernameAvailable == true
                          ? const Icon(Icons.check_circle, color: Color(0xFFA3E635))
                          : _usernameAvailable == false
                              ? const Icon(Icons.cancel, color: Colors.redAccent)
                              : null,
                ),
              ),

              // Username feedback
              if (_usernameAvailable == false) ...[
                const SizedBox(height: 8),
                const Text(
                  'Username already taken.',
                  style: TextStyle(color: Colors.redAccent, fontSize: 12),
                ),
                if (_suggestions.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  const Text('Try one of these:', style: TextStyle(color: Colors.white38, fontSize: 12)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: _suggestions.map((s) => GestureDetector(
                      onTap: () {
                        _usernameCtrl.text = s;
                        _onUsernameChanged(s);
                      },
                      child: Chip(
                        label: Text('@$s', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12)),
                        backgroundColor: const Color(0xFF111118),
                        side: const BorderSide(color: Color(0xFF00E5FF), width: 0.5),
                        padding: EdgeInsets.zero,
                      ),
                    )).toList(),
                  ),
                ],
              ],
              if (_usernameAvailable == true) ...[
                const SizedBox(height: 8),
                const Text(
                  '✓ Username is available!',
                  style: TextStyle(color: Color(0xFFA3E635), fontSize: 12),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
              ],

              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    disabledBackgroundColor: const Color(0xFF00E5FF).withOpacity(0.4),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                      : const Text('Save & Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
