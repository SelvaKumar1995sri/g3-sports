import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../../../core/api/api_client.dart';

class OtpScreen extends ConsumerStatefulWidget {
  /// extra can be either:
  ///   String  — just the verificationId (legacy)
  ///   Map     — { verificationId, fullName, username }
  final Object? extra;
  const OtpScreen({super.key, required this.extra});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  String get _verificationId {
    final e = widget.extra;
    if (e is String) return e;
    if (e is Map) return e['verificationId'] as String? ?? '';
    return '';
  }

  String? get _fullName {
    final e = widget.extra;
    if (e is Map) return e['fullName'] as String?;
    return null;
  }

  String? get _username {
    final e = widget.extra;
    if (e is Map) return e['username'] as String?;
    return null;
  }

  Future<void> _verify() async {
    final code = _ctrl.text.trim();
    if (code.length != 6) return;
    setState(() { _loading = true; _error = null; });

    try {
      final svc = ref.read(authServiceProvider);
      final result = await svc.verifyOtp(
        verificationId: _verificationId,
        smsCode: code,
      );

      var user = result.user;

      // If name/username were collected on registration screen, save them now
      if (user.needsProfileSetup && _fullName != null && _username != null) {
        try {
          await ref.read(dioProvider).put('/users/me', data: {
            'fullName': _fullName,
            'username': _username,
          });
          // Refresh user to get updated profile
          user = await svc.fetchMe();
        } catch (e) {
          // Save failed — go to profile setup as fallback
          ref.read(currentUserProvider.notifier).state = result.user;
          if (mounted) context.go('/profile-setup');
          return;
        }
      }

      ref.read(currentUserProvider.notifier).state = user;

      if (mounted) {
        if (user.needsProfileSetup) {
          // Fallback: no name collected, show profile setup
          context.go('/profile-setup');
        } else if (user.isOrganizer) {
          context.go('/my-tournaments');
        } else {
          context.go('/tournaments');
        }
      }
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter OTP',
                style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('6-digit code sent to your phone',
                style: TextStyle(color: Colors.white38)),
            const SizedBox(height: 32),
            TextField(
              controller: _ctrl,
              keyboardType: TextInputType.number,
              maxLength: 6,
              autofocus: true,
              style: const TextStyle(
                  color: Colors.white, fontSize: 28, letterSpacing: 8, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
              onChanged: (v) { if (v.length == 6) _verify(); },
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: const Color(0xFF111118),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFF00E5FF))),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _verify,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                    : const Text('Verify',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
