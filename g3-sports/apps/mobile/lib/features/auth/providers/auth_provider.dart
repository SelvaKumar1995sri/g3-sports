import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/auth_service.dart';
import '../../../shared/models/user.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(dioProvider));
});

final currentUserProvider = StateProvider<AppUser?>((ref) => null);

final authInitProvider = FutureProvider<void>((ref) async {
  final svc = ref.read(authServiceProvider);
  final jwt = await svc.loadStoredJwt();
  if (jwt != null) {
    try {
      final user = await svc.fetchMe();
      ref.read(currentUserProvider.notifier).state = user;
    } catch (_) {
      await svc.clearJwt();
    }
  }
});
