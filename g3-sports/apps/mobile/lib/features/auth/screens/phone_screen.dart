import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/api/api_client.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _phoneCtrl    = TextEditingController();
  final _nameCtrl     = TextEditingController();
  final _usernameCtrl = TextEditingController();

  bool _loading          = false;
  bool _checkingUsername = false;
  bool _checkingPhone    = false;
  bool? _usernameAvailable;
  bool? _phoneAvailable;
  String? _error;
  Timer? _debounce;
  Timer? _phoneDebounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _phoneDebounce?.cancel();
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    super.dispose();
  }

  void _onPhoneChanged(String value) {
    _phoneDebounce?.cancel();
    final clean = value.trim();
    final normalized = clean.startsWith('+') ? clean : '+91$clean';

    if (normalized.length < 10) {
      setState(() { _phoneAvailable = null; });
      return;
    }

    setState(() { _checkingPhone = true; _phoneAvailable = null; });
    _phoneDebounce = Timer(const Duration(milliseconds: 700), () async {
      try {
        final encoded = Uri.encodeComponent(normalized);
        final resp = await ref.read(dioProvider).get('/auth/check-phone?phone=$encoded');
        final available = resp.data['available'] as bool? ?? true;
        if (mounted) setState(() { _phoneAvailable = available; _checkingPhone = false; });
      } catch (_) {
        if (mounted) setState(() { _checkingPhone = false; });
      }
    });
  }

  void _onUsernameChanged(String value) {
    _debounce?.cancel();
    final clean = value.trim().toLowerCase();

    if (clean.isEmpty) {
      setState(() { _usernameAvailable = null; });
      return;
    }
    if (clean.length < 3) {
      setState(() { _usernameAvailable = false; });
      return;
    }

    setState(() { _checkingUsername = true; _usernameAvailable = null; });

    _debounce = Timer(const Duration(milliseconds: 600), () async {
      try {
        final resp = await ref.read(dioProvider).get('/auth/check-username?username=$clean');
        final available = resp.data['available'] as bool? ?? false;
        if (mounted) setState(() { _usernameAvailable = available; _checkingUsername = false; });
      } catch (_) {
        if (mounted) setState(() { _checkingUsername = false; });
      }
    });
  }

  Future<void> _sendOtp() async {
    final phone    = _phoneCtrl.text.trim();
    final name     = _nameCtrl.text.trim();
    final username = _usernameCtrl.text.trim().toLowerCase();

    if (phone.isEmpty) {
      setState(() => _error = 'Please enter your phone number');
      return;
    }
    // Basic phone format validation
    final normalized = phone.startsWith('+') ? phone : '+91$phone';
    final digits = normalized.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 10 || digits.length > 15) {
      setState(() => _error = 'Enter a valid phone number (e.g. +91 9876543210)');
      return;
    }
    if (_phoneAvailable == false) {
      setState(() => _error = 'This phone number is already registered. Use "Login with username" instead.');
      return;
    }
    if (name.isEmpty) {
      setState(() => _error = 'Please enter your display name');
      return;
    }
    if (username.length < 3) {
      setState(() => _error = 'Username must be at least 3 characters');
      return;
    }
    if (_usernameAvailable == false) {
      setState(() => _error = 'That username is already taken');
      return;
    }
    if (_usernameAvailable == null && _usernameCtrl.text.trim().length >= 3) {
      setState(() => _error = 'Please wait for username check to complete');
      return;
    }

    setState(() { _loading = true; _error = null; });

    final svc = ref.read(authServiceProvider);
    await svc.sendOtp(
      phoneNumber: phone.startsWith('+') ? phone : '+91$phone',
      onCodeSent: (vid) {
        if (mounted) {
          setState(() => _loading = false);
          // Pass name + username to OTP screen so it can save them after verification
          context.push('/otp', extra: {
            'verificationId': vid,
            'fullName': name,
            'username': username,
          });
        }
      },
      onError: (e) {
        if (mounted) setState(() { _error = e; _loading = false; });
      },
    );
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
              const SizedBox(height: 40),
              const Text('G3',
                  style: TextStyle(color: Color(0xFF00E5FF), fontSize: 40, fontWeight: FontWeight.w900)),
              const Text('Sports',
                  style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              const Text('Create your account',
                  style: TextStyle(color: Colors.white38, fontSize: 14)),
              const SizedBox(height: 36),

              // ── Display Name ──────────────────────────────────────────
              const Text('YOUR NAME',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 8),
              TextField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'e.g. Selva Kumar',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFF00E5FF)),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ── Username ──────────────────────────────────────────────
              const Text('USERNAME',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 4),
              const Text('Min 3 characters, letters and numbers only',
                  style: TextStyle(color: Colors.white24, fontSize: 11)),
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
                      borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
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
                            width: 16, height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Color(0xFF00E5FF)),
                          ),
                        )
                      : _usernameAvailable == true
                          ? const Icon(Icons.check_circle, color: Color(0xFFA3E635))
                          : _usernameAvailable == false
                              ? const Icon(Icons.cancel, color: Colors.redAccent)
                              : null,
                ),
              ),
              if (_usernameAvailable == false) ...[
                const SizedBox(height: 6),
                const Text('Username already taken — try another',
                    style: TextStyle(color: Colors.redAccent, fontSize: 12)),
              ],
              if (_usernameAvailable == true) ...[
                const SizedBox(height: 6),
                const Text('✓ Username is available!',
                    style: TextStyle(color: Color(0xFFA3E635), fontSize: 12)),
              ],
              const SizedBox(height: 20),

              // ── Phone Number ──────────────────────────────────────────
              const Text('PHONE NUMBER',
                  style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 8),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white, fontSize: 18),
                onChanged: _onPhoneChanged,
                decoration: InputDecoration(
                  hintText: '+91 9876543210',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(
                      color: _phoneAvailable == false
                          ? Colors.redAccent
                          : const Color(0xFF00E5FF),
                    ),
                  ),
                  suffixIcon: _checkingPhone
                      ? const Padding(
                          padding: EdgeInsets.all(14),
                          child: SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)),
                          ),
                        )
                      : _phoneAvailable == false
                          ? const Icon(Icons.cancel, color: Colors.redAccent)
                          : null,
                ),
              ),
              if (_phoneAvailable == false) ...[
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () => context.go('/login-username'),
                  child: const Text.rich(TextSpan(children: [
                    TextSpan(text: 'Phone already registered. ', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                    TextSpan(text: 'Login with username →', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 12, fontWeight: FontWeight.bold)),
                  ])),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ],
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _sendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    disabledBackgroundColor: const Color(0xFF00E5FF).withOpacity(0.4),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                      : const Text('Send OTP',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),

              const SizedBox(height: 28),
              const Divider(color: Colors.white12),
              const SizedBox(height: 20),
              Center(
                child: GestureDetector(
                  onTap: () => context.go('/login-username'),
                  child: const Text.rich(TextSpan(children: [
                    TextSpan(
                        text: 'Already registered? ',
                        style: TextStyle(color: Colors.white38)),
                    TextSpan(
                        text: 'Login with username →',
                        style: TextStyle(
                            color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
                  ])),
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
