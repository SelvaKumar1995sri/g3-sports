import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  bool? _usernameAvailable;   // null=unchecked, true=available, false=taken (API confirmed)
  bool  _usernameTooShort = false; // true when < 3 chars typed
  bool? _phoneAvailable;
  String? _error;
  Timer? _usernameDebounce;
  Timer? _phoneDebounce;

  // Phone is always +91 + 10 digits
  String get _normalizedPhone => '+91${_phoneCtrl.text.trim()}';

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _phoneDebounce?.cancel();
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    super.dispose();
  }

  // ── Phone uniqueness check ──────────────────────────────────────────────────
  void _onPhoneChanged(String value) {
    _phoneDebounce?.cancel();
    final digits = value.trim().replaceAll(RegExp(r'\D'), '');

    if (digits.length < 10) {
      // Reset whenever incomplete
      setState(() { _phoneAvailable = null; _checkingPhone = false; });
      return;
    }

    setState(() { _checkingPhone = true; _phoneAvailable = null; });

    _phoneDebounce = Timer(const Duration(milliseconds: 700), () async {
      await _doPhoneCheck();
    });
  }

  Future<bool> _doPhoneCheck() async {
    try {
      final encoded = Uri.encodeComponent(_normalizedPhone);
      final resp = await ref.read(dioProvider).get('/auth/check-phone?phone=$encoded');
      final available = resp.data['available'] as bool? ?? true;
      if (mounted) setState(() { _phoneAvailable = available; _checkingPhone = false; });
      return available;
    } catch (_) {
      if (mounted) setState(() { _checkingPhone = false; });
      return true; // Allow on error so we don't block indefinitely
    }
  }

  // ── Username uniqueness check ───────────────────────────────────────────────
  void _onUsernameChanged(String value) {
    _usernameDebounce?.cancel();
    final clean = value.trim().toLowerCase();

    if (clean.isEmpty) {
      setState(() { _usernameAvailable = null; _usernameTooShort = false; });
      return;
    }
    if (clean.length < 3) {
      // Too short — NOT "taken", just too short
      setState(() { _usernameAvailable = null; _usernameTooShort = true; _checkingUsername = false; });
      return;
    }

    setState(() { _checkingUsername = true; _usernameAvailable = null; _usernameTooShort = false; });

    _usernameDebounce = Timer(const Duration(milliseconds: 600), () async {
      try {
        final resp = await ref.read(dioProvider).get('/auth/check-username?username=$clean');
        final available = resp.data['available'] as bool? ?? false;
        if (mounted) setState(() { _usernameAvailable = available; _checkingUsername = false; });
      } catch (_) {
        if (mounted) setState(() { _checkingUsername = false; });
      }
    });
  }

  // ── Send OTP ────────────────────────────────────────────────────────────────
  Future<void> _sendOtp() async {
    final phoneDigits = _phoneCtrl.text.trim().replaceAll(RegExp(r'\D'), '');
    final name        = _nameCtrl.text.trim();
    final username    = _usernameCtrl.text.trim().toLowerCase();

    // ── Validate name
    if (name.isEmpty) {
      setState(() => _error = 'Please enter your display name');
      return;
    }

    // ── Validate username
    if (username.length < 3) {
      setState(() => _error = 'Username must be at least 3 characters');
      return;
    }
    if (_usernameAvailable == false) {
      setState(() => _error = 'That username is already taken');
      return;
    }
    if (_checkingUsername) {
      setState(() => _error = 'Checking username… please wait');
      return;
    }

    // ── Validate phone digits
    if (phoneDigits.isEmpty) {
      setState(() => _error = 'Please enter your 10-digit mobile number');
      return;
    }
    if (phoneDigits.length != 10) {
      setState(() => _error = 'Enter exactly 10 digits (country code +91 is added automatically)');
      return;
    }

    setState(() { _loading = true; _error = null; });

    // ── Phone uniqueness: if debounce hasn't resolved yet, check now synchronously
    bool phoneOk;
    if (_phoneAvailable != null) {
      phoneOk = _phoneAvailable!;
    } else {
      phoneOk = await _doPhoneCheck();
    }

    if (!phoneOk) {
      setState(() {
        _loading = false;
        _error = 'This number is already registered. Use "Login with username" instead.';
      });
      return;
    }

    // ── Send Firebase OTP
    final svc = ref.read(authServiceProvider);
    await svc.sendOtp(
      phoneNumber: _normalizedPhone,
      onCodeSent: (vid) {
        if (mounted) {
          setState(() => _loading = false);
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

  // ── Build ───────────────────────────────────────────────────────────────────
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

              // ── YOUR NAME ─────────────────────────────────────────────
              _label('YOUR NAME'),
              const SizedBox(height: 8),
              TextField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                style: const TextStyle(color: Colors.white),
                decoration: _inputDecoration(hint: 'e.g. Selva Kumar'),
              ),
              const SizedBox(height: 20),

              // ── USERNAME ──────────────────────────────────────────────
              _label('USERNAME'),
              const SizedBox(height: 4),
              const Text('Min 3 chars · letters, numbers and _ only',
                  style: TextStyle(color: Colors.white24, fontSize: 11)),
              const SizedBox(height: 8),
              TextField(
                controller: _usernameCtrl,
                style: const TextStyle(color: Colors.white),
                onChanged: _onUsernameChanged,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9_]')),
                ],
                decoration: _inputDecoration(
                  hint: 'e.g. selva_g3',
                  prefix: '@',
                  borderColor: _usernameAvailable == true
                      ? const Color(0xFFA3E635)
                      : (_usernameAvailable == false && !_usernameTooShort)
                          ? Colors.redAccent
                          : null,
                  suffix: _checkingUsername
                      ? _spinner()
                      : _usernameAvailable == true
                          ? const Icon(Icons.check_circle, color: Color(0xFFA3E635))
                          : (_usernameAvailable == false && !_usernameTooShort)
                              ? const Icon(Icons.cancel, color: Colors.redAccent)
                              : null,
                ),
              ),
              if (_usernameTooShort)
                _hint('Minimum 3 characters required', Colors.orange),
              if (!_usernameTooShort && _usernameAvailable == false)
                _hint('Username already taken — try another', Colors.redAccent),
              if (_usernameAvailable == true)
                _hint('✓ Username available!', const Color(0xFFA3E635)),
              const SizedBox(height: 20),

              // ── PHONE NUMBER ──────────────────────────────────────────
              _label('MOBILE NUMBER'),
              const SizedBox(height: 4),
              const Text('India (+91) — enter 10 digits only',
                  style: TextStyle(color: Colors.white24, fontSize: 11)),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Fixed country code box
                  Container(
                    height: 56,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFF111118),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const Text('+91',
                        style: TextStyle(color: Color(0xFF00E5FF), fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 10),
                  // 10-digit input
                  Expanded(
                    child: TextField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.number,
                      maxLength: 10,
                      style: const TextStyle(color: Colors.white, fontSize: 18),
                      onChanged: _onPhoneChanged,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: '9876543210',
                        hintStyle: const TextStyle(color: Colors.white24),
                        filled: true,
                        fillColor: const Color(0xFF111118),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(14),
                            borderSide: BorderSide.none),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(
                            color: _phoneAvailable == false
                                ? Colors.redAccent
                                : const Color(0xFF00E5FF),
                            width: 1.5,
                          ),
                        ),
                        suffixIcon: _checkingPhone
                            ? _spinner()
                            : _phoneAvailable == false
                                ? const Icon(Icons.cancel, color: Colors.redAccent)
                                : _phoneAvailable == true
                                    ? const Icon(Icons.check_circle, color: Color(0xFFA3E635))
                                    : null,
                      ),
                    ),
                  ),
                ],
              ),
              if (_phoneAvailable == false) ...[
                const SizedBox(height: 6),
                GestureDetector(
                  onTap: () => context.go('/login-username'),
                  child: const Text.rich(TextSpan(children: [
                    TextSpan(
                        text: '⚠ Number already registered. ',
                        style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                    TextSpan(
                        text: 'Login with username →',
                        style: TextStyle(
                            color: Color(0xFF00E5FF),
                            fontSize: 12,
                            fontWeight: FontWeight.bold)),
                  ])),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ],
              const SizedBox(height: 28),

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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Widget _label(String text) => Text(text,
      style: const TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2));

  Widget _hint(String text, Color color) => Padding(
    padding: const EdgeInsets.only(top: 6),
    child: Text(text, style: TextStyle(color: color, fontSize: 12)),
  );

  Widget _spinner() => const Padding(
    padding: EdgeInsets.all(12),
    child: SizedBox(
      width: 16, height: 16,
      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)),
    ),
  );

  InputDecoration _inputDecoration({
    required String hint,
    String? prefix,
    Color? borderColor,
    Widget? suffix,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white24),
      prefixText: prefix,
      prefixStyle: const TextStyle(color: Color(0xFF00E5FF)),
      filled: true,
      fillColor: const Color(0xFF111118),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: borderColor ?? const Color(0xFF00E5FF), width: 1.5),
      ),
      suffixIcon: suffix,
    );
  }
}
