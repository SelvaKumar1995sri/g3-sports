import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../shared/models/user.dart';

class AuthService {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();
  final _fb = FirebaseAuth.instance;

  AuthService(this._dio) {
    // In debug mode — disable app verification so reCAPTCHA never appears.
    // Test phone numbers (+91 8015569162 → 123456) work without any interruption.
    // This setting is ignored in release builds automatically.
    if (kDebugMode && !kIsWeb) {
      FirebaseAuth.instance.setSettings(appVerificationDisabledForTesting: true);
    }
  }

  Future<String?> loadStoredJwt() => _storage.read(key: 'g3_jwt');

  Future<void> clearJwt() => _storage.delete(key: 'g3_jwt');

  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    if (kIsWeb) {
      // Phone OTP via reCAPTCHA is not supported in the web preview.
      // Build the Android APK to test real phone auth.
      onError('Phone OTP is only available on the Android/iOS app. Please build and install the APK.');
      return;
    }

    try {
      await _fb.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Auto-retrieval on Android — sign in immediately
          try {
            final fbUser = await _fb.signInWithCredential(credential);
            final idToken = await fbUser.user!.getIdToken();
            await _dio.post('/auth/verify-otp', data: {
              'idToken': idToken,
              'phone': fbUser.user!.phoneNumber,
            });
          } catch (_) {}
        },
        verificationFailed: (FirebaseAuthException e) =>
            onError(e.message ?? 'Verification failed'),
        codeSent: (String verificationId, int? resendToken) =>
            onCodeSent(verificationId),
        codeAutoRetrievalTimeout: (_) {},
      );
    } catch (e) {
      onError(e.toString());
    }
  }

  Future<({AppUser user, bool isNewUser})> verifyOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    final fbUser = await _fb.signInWithCredential(credential);
    final idToken = await fbUser.user!.getIdToken();

    final resp = await _dio.post('/auth/verify-otp', data: {
      'idToken': idToken,
      'phone': fbUser.user!.phoneNumber,
    });

    final jwt = (resp.data['accessToken'] ?? resp.data['access_token']) as String;
    final userData = resp.data['user'] as Map<String, dynamic>;
    final isNew = resp.data['isNewUser'] as bool? ?? false;

    await _storage.write(key: 'g3_jwt', value: jwt);
    return (user: AppUser.fromJson(userData), isNewUser: isNew);
  }

  Future<AppUser> fetchMe() async {
    final resp = await _dio.get('/users/me');
    return AppUser.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<void> signOut() async {
    await _fb.signOut();
    await _storage.delete(key: 'g3_jwt');
  }
}
