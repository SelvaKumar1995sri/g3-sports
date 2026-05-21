import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/auth_service.dart';
import '../providers/auth_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class UsernameLoginScreen extends ConsumerStatefulWidget {
  const UsernameLoginScreen({super.key});

  @override
  ConsumerState<UsernameLoginScreen> createState() => _UsernameLoginScreenState();
}

class _UsernameLoginScreenState extends ConsumerState<UsernameLoginScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final username = _ctrl.text.trim().toLowerCase();
    if (username.length < 3) {
      setState(() => _error = 'Enter your username (min 3 characters)');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      final resp = await dio.post('/auth/login-username', data: {'username': username});
      final data = resp.data as Map<String, dynamic>;
      final token = data['accessToken'] as String? ?? data['access_token'] as String? ?? '';
      const storage = FlutterSecureStorage();
      await storage.write(key: 'g3_jwt', value: token);

      final user = await ref.read(authServiceProvider).fetchMe();
      ref.read(currentUserProvider.notifier).state = user;

      if (mounted) {
        if (user.isOrganizer) {
          context.go('/my-tournaments');
        } else {
          context.go('/tournaments');
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString().contains('not found')
            ? 'Username not found. Please register with your phone number first.'
            : e.toString();
        _loading = false;
      });
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
            const SizedBox(height: 24),
            const Text('Welcome back!',
                style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Enter your username to continue',
                style: TextStyle(color: Colors.white38)),
            const SizedBox(height: 40),

            const Text('USERNAME', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
            const SizedBox(height: 8),
            TextField(
              controller: _ctrl,
              autofocus: true,
              style: const TextStyle(color: Colors.white),
              onSubmitted: (_) => _login(),
              decoration: InputDecoration(
                hintText: 'e.g. selva_g3',
                hintStyle: const TextStyle(color: Colors.white24),
                prefixText: '@',
                prefixStyle: const TextStyle(color: Color(0xFF00E5FF)),
                filled: true,
                fillColor: const Color(0xFF111118),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFF00E5FF)),
                ),
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
            ],

            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00E5FF),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  disabledBackgroundColor: const Color(0xFF00E5FF).withOpacity(0.4),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                    : const Text('Login', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),

            const SizedBox(height: 20),
            Center(
              child: GestureDetector(
                onTap: () => context.go('/login'),
                child: const Text.rich(TextSpan(children: [
                  TextSpan(text: 'New user? ', style: TextStyle(color: Colors.white38)),
                  TextSpan(text: 'Register with phone →', style: TextStyle(color: Color(0xFF00E5FF))),
                ])),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
