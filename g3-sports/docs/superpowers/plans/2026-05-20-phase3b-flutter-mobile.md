# Phase 3B — Flutter Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the G3 Sports Flutter mobile app — Firebase OTP auth, public tournament browsing, live badminton spectating via Socket.IO, team management, scorer fixture flow, and organizer tools.

**Architecture:** Riverpod for state, Dio for HTTP, socket_io_client for live scores, go_router for navigation with role-based guards, flutter_secure_storage for JWT. Feature-first folder structure under `lib/features/`.

**Tech Stack:** Flutter 3.x, Dart 3, firebase_auth, flutter_riverpod, dio, socket_io_client, go_router, flutter_secure_storage, cached_network_image.

**Prerequisite:** Plans A and B must be complete. Backend endpoints must be live on Render.

---

## File Map

```
apps/mobile/
├── pubspec.yaml
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart          # Dio singleton + JWT interceptor
│   │   │   └── api_exception.dart       # Typed error from Dio
│   │   ├── auth/
│   │   │   └── auth_service.dart        # Firebase OTP + backend JWT exchange
│   │   └── socket/
│   │       └── socket_client.dart       # Socket.IO singleton
│   ├── features/
│   │   ├── auth/
│   │   │   ├── providers/auth_provider.dart
│   │   │   ├── screens/phone_screen.dart
│   │   │   ├── screens/otp_screen.dart
│   │   │   └── screens/profile_setup_screen.dart
│   │   ├── tournaments/
│   │   │   ├── models/tournament.dart
│   │   │   ├── repositories/tournament_repository.dart
│   │   │   ├── providers/tournaments_provider.dart
│   │   │   ├── screens/tournament_list_screen.dart
│   │   │   ├── screens/tournament_detail_screen.dart
│   │   │   └── screens/bracket_screen.dart
│   │   ├── teams/
│   │   │   ├── models/team.dart
│   │   │   ├── repositories/team_repository.dart
│   │   │   ├── providers/teams_provider.dart
│   │   │   ├── screens/my_team_screen.dart
│   │   │   └── screens/create_team_screen.dart
│   │   ├── matches/
│   │   │   ├── models/match.dart
│   │   │   ├── repositories/match_repository.dart
│   │   │   ├── providers/match_provider.dart
│   │   │   └── screens/live_spectator_screen.dart
│   │   ├── scoring/
│   │   │   ├── models/badminton_score.dart
│   │   │   ├── repositories/score_repository.dart
│   │   │   ├── providers/scoring_provider.dart
│   │   │   ├── screens/fixture_list_screen.dart
│   │   │   ├── screens/start_match_screen.dart
│   │   │   └── screens/live_scoring_screen.dart
│   │   ├── organizer/
│   │   │   ├── repositories/organizer_repository.dart
│   │   │   ├── providers/organizer_provider.dart
│   │   │   ├── screens/my_tournaments_screen.dart
│   │   │   ├── screens/create_tournament_screen.dart
│   │   │   └── screens/manage_registrations_screen.dart
│   │   └── profile/
│   │       ├── repositories/profile_repository.dart
│   │       ├── providers/profile_provider.dart
│   │       ├── screens/my_profile_screen.dart
│   │       └── screens/public_profile_screen.dart
│   ├── shared/
│   │   ├── models/user.dart
│   │   └── widgets/
│   │       ├── g3_app_bar.dart
│   │       ├── score_badge.dart
│   │       └── loading_overlay.dart
│   └── router/
│       └── app_router.dart              # go_router with role guards
```

---

### Task 1: Flutter project setup and pubspec

**Files:**
- Create: `apps/mobile/pubspec.yaml`
- Create: `apps/mobile/lib/main.dart`

- [ ] **Step 1: Scaffold Flutter project**

From the monorepo root:
```bash
cd apps
flutter create mobile --org com.g3sports --project-name g3_sports_mobile
cd mobile
```

- [ ] **Step 2: Replace pubspec.yaml**

Replace the generated `apps/mobile/pubspec.yaml` with:
```yaml
name: g3_sports_mobile
description: G3 Sports — Tournament management and live scoring
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Firebase
  firebase_core: ^3.1.0
  firebase_auth: ^5.1.0

  # State management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # HTTP
  dio: ^5.4.3+1

  # Real-time
  socket_io_client: ^2.0.3+1

  # Navigation
  go_router: ^14.1.4

  # Storage
  flutter_secure_storage: ^9.2.2

  # UI helpers
  cached_network_image: ^3.3.1
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  riverpod_generator: ^2.4.3
  build_runner: ^2.4.11

flutter:
  uses-material-design: true
```

- [ ] **Step 3: Install dependencies**

```bash
cd apps/mobile
flutter pub get
```

Expected: All packages resolve without errors.

- [ ] **Step 4: Configure Firebase**

Run FlutterFire CLI (must have Firebase project set up):
```bash
dart pub global activate flutterfire_cli
flutterfire configure --project=<your-firebase-project-id>
```

This generates `lib/firebase_options.dart`. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to `.gitignore`:
```
apps/mobile/android/app/google-services.json
apps/mobile/ios/Runner/GoogleService-Info.plist
apps/mobile/lib/firebase_options.dart
```

- [ ] **Step 5: Write main.dart**

Replace `apps/mobile/lib/main.dart`:
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'firebase_options.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const ProviderScope(child: G3SportsApp()));
}

class G3SportsApp extends ConsumerWidget {
  const G3SportsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'G3 Sports',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A0F),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF00E5FF),
          secondary: const Color(0xFFA3E635),
          surface: const Color(0xFF111118),
        ),
        fontFamily: 'Roboto',
      ),
      routerConfig: router,
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add apps/mobile/pubspec.yaml apps/mobile/lib/main.dart
git commit -m "feat(mobile): scaffold Flutter project with dependencies"
```

---

### Task 2: Core — Dio API client

**Files:**
- Create: `apps/mobile/lib/core/api/api_client.dart`
- Create: `apps/mobile/lib/core/api/api_exception.dart`

- [ ] **Step 1: Create api_exception.dart**

```dart
// apps/mobile/lib/core/api/api_exception.dart
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  const ApiException({this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}
```

- [ ] **Step 2: Create api_client.dart**

```dart
// apps/mobile/lib/core/api/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_exception.dart';

const _baseUrl = 'https://g3-sports-backend.onrender.com/api';
const _storage = FlutterSecureStorage();

Dio createDio() {
  final dio = Dio(BaseOptions(
    baseUrl: _baseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ));

  // JWT interceptor
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await _storage.read(key: 'g3_jwt');
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      handler.next(options);
    },
    onResponse: (response, handler) {
      // Unwrap TransformInterceptor envelope: { data: T, timestamp: string }
      final body = response.data;
      if (body is Map && body.containsKey('data') && body.containsKey('timestamp')) {
        response.data = body['data'];
      }
      handler.next(response);
    },
    onError: (e, handler) {
      if (e.response?.statusCode == 401) {
        _storage.delete(key: 'g3_jwt');
      }
      final msg = e.response?.data?['message'] ?? e.message ?? 'Unknown error';
      handler.reject(
        DioException(
          requestOptions: e.requestOptions,
          error: ApiException(statusCode: e.response?.statusCode, message: msg.toString()),
          response: e.response,
          type: e.type,
        ),
      );
    },
  ));

  return dio;
}

final dioProvider = Provider<Dio>((ref) => createDio());
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/core/api/
git commit -m "feat(mobile): add Dio API client with JWT + TransformInterceptor unwrap"
```

---

### Task 3: Core — Auth service and provider

**Files:**
- Create: `apps/mobile/lib/core/auth/auth_service.dart`
- Create: `apps/mobile/lib/features/auth/providers/auth_provider.dart`
- Create: `apps/mobile/lib/shared/models/user.dart`

- [ ] **Step 1: Create shared User model**

```dart
// apps/mobile/lib/shared/models/user.dart
class AppUser {
  final String id;
  final String? phone;
  final String? email;
  final String? displayName;
  final String? avatarUrl;
  final String role; // 'player' | 'organizer' | 'super_admin'

  const AppUser({
    required this.id,
    this.phone,
    this.email,
    this.displayName,
    this.avatarUrl,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as String,
        phone: j['phone'] as String?,
        email: j['email'] as String?,
        displayName: (j['fullName'] ?? j['displayName']) as String?,
        avatarUrl: j['avatarUrl'] as String?,
        role: j['role'] as String? ?? 'player',
      );

  bool get isOrganizer => role == 'organizer' || role == 'super_admin';
  bool get isSuperAdmin => role == 'super_admin';
}
```

- [ ] **Step 2: Create auth_service.dart**

```dart
// apps/mobile/lib/core/auth/auth_service.dart
import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../shared/models/user.dart';

class AuthService {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();
  final _fb = FirebaseAuth.instance;

  AuthService(this._dio);

  Future<String?> loadStoredJwt() => _storage.read(key: 'g3_jwt');

  Future<void> clearJwt() => _storage.delete(key: 'g3_jwt');

  /// Step 1 of OTP flow — send SMS via Firebase
  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String error) onError,
  }) async {
    await _fb.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (_) {},
      verificationFailed: (e) => onError(e.message ?? 'Verification failed'),
      codeSent: (verificationId, _) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  /// Step 2 — verify OTP, exchange Firebase token for backend JWT
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

    final jwt = resp.data['access_token'] as String;
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
```

- [ ] **Step 3: Create auth_provider.dart**

```dart
// apps/mobile/lib/features/auth/providers/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/auth/auth_service.dart';
import '../../../shared/models/user.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(dioProvider));
});

// Holds the currently authenticated user (null = guest)
final currentUserProvider = StateProvider<AppUser?>((ref) => null);

// True while we check for stored JWT on launch
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
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/shared/models/user.dart
git add apps/mobile/lib/core/auth/auth_service.dart
git add apps/mobile/lib/features/auth/providers/auth_provider.dart
git commit -m "feat(mobile): auth service — Firebase OTP + backend JWT exchange"
```

---

### Task 4: Core — Socket.IO client

**Files:**
- Create: `apps/mobile/lib/core/socket/socket_client.dart`

- [ ] **Step 1: Create socket_client.dart**

```dart
// apps/mobile/lib/core/socket/socket_client.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

const _socketUrl = 'https://g3-sports-backend.onrender.com';

class SocketClient {
  io.Socket? _socket;
  final _storage = const FlutterSecureStorage();

  Future<io.Socket> connect() async {
    if (_socket != null && _socket!.connected) return _socket!;
    final token = await _storage.read(key: 'g3_jwt');
    _socket = io.io(
      _socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer ${token ?? ''}'})
          .enableAutoConnect()
          .enableReconnection()
          .build(),
    );
    _socket!.connect();
    return _socket!;
  }

  void joinRoom(String matchId) {
    _socket?.emit('joinRoom', matchId);
  }

  void leaveRoom(String matchId) {
    _socket?.emit('leaveRoom', matchId);
  }

  Stream<Map<String, dynamic>> scoreUpdates() {
    final controller = StreamController<Map<String, dynamic>>.broadcast();
    _socket?.on('scoreUpdate', (data) {
      if (data is Map) controller.add(Map<String, dynamic>.from(data));
    });
    return controller.stream;
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}

// ignore: unused_import
import 'dart:async';

final socketClientProvider = Provider<SocketClient>((ref) {
  final client = SocketClient();
  ref.onDispose(client.disconnect);
  return client;
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/core/socket/socket_client.dart
git commit -m "feat(mobile): Socket.IO client with joinRoom/leaveRoom and scoreUpdate stream"
```

---

### Task 5: Router with role-based guards

**Files:**
- Create: `apps/mobile/lib/router/app_router.dart`

- [ ] **Step 1: Create app_router.dart**

```dart
// apps/mobile/lib/router/app_router.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/phone_screen.dart';
import '../features/auth/screens/otp_screen.dart';
import '../features/auth/screens/profile_setup_screen.dart';
import '../features/tournaments/screens/tournament_list_screen.dart';
import '../features/tournaments/screens/tournament_detail_screen.dart';
import '../features/tournaments/screens/bracket_screen.dart';
import '../features/teams/screens/my_team_screen.dart';
import '../features/teams/screens/create_team_screen.dart';
import '../features/matches/screens/live_spectator_screen.dart';
import '../features/scoring/screens/fixture_list_screen.dart';
import '../features/scoring/screens/start_match_screen.dart';
import '../features/scoring/screens/live_scoring_screen.dart';
import '../features/organizer/screens/my_tournaments_screen.dart';
import '../features/organizer/screens/create_tournament_screen.dart';
import '../features/organizer/screens/manage_registrations_screen.dart';
import '../features/profile/screens/my_profile_screen.dart';
import '../features/profile/screens/public_profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final user = ref.watch(currentUserProvider);

  return GoRouter(
    initialLocation: '/tournaments',
    redirect: (context, state) {
      final isAuth = user != null;
      final path = state.matchedLocation;
      final authPaths = ['/login', '/otp', '/profile-setup'];

      if (!isAuth && !authPaths.contains(path)) {
        // Allow public paths without auth
        const publicPaths = ['/tournaments', '/profile'];
        if (publicPaths.any((p) => path.startsWith(p))) return null;
        return '/tournaments';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const PhoneScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, state) => OtpScreen(
          verificationId: state.extra as String,
        ),
      ),
      GoRoute(path: '/profile-setup', builder: (_, __) => const ProfileSetupScreen()),

      // Public + player
      GoRoute(path: '/tournaments', builder: (_, __) => const TournamentListScreen()),
      GoRoute(
        path: '/tournaments/:id',
        builder: (_, state) => TournamentDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/tournaments/:id/bracket',
        builder: (_, state) => BracketScreen(tournamentId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/matches/:id/live',
        builder: (_, state) => LiveSpectatorScreen(matchId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/profile/:id',
        builder: (_, state) => PublicProfileScreen(userId: state.pathParameters['id']!),
      ),

      // Player-only
      GoRoute(path: '/my-team', builder: (_, __) => const MyTeamScreen()),
      GoRoute(path: '/create-team', builder: (_, __) => const CreateTeamScreen()),
      GoRoute(path: '/my-profile', builder: (_, __) => const MyProfileScreen()),

      // Scorer
      GoRoute(path: '/fixtures', builder: (_, __) => const FixtureListScreen()),
      GoRoute(
        path: '/fixtures/:matchId/start',
        builder: (_, state) => StartMatchScreen(matchId: state.pathParameters['matchId']!),
      ),
      GoRoute(
        path: '/matches/:id/score',
        builder: (_, state) => LiveScoringScreen(matchId: state.pathParameters['id']!),
      ),

      // Organizer
      GoRoute(path: '/my-tournaments', builder: (_, __) => const MyTournamentsScreen()),
      GoRoute(path: '/create-tournament', builder: (_, __) => const CreateTournamentScreen()),
      GoRoute(
        path: '/tournaments/:id/registrations',
        builder: (_, state) => ManageRegistrationsScreen(tournamentId: state.pathParameters['id']!),
      ),
    ],
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/lib/router/app_router.dart
git commit -m "feat(mobile): go_router setup with role-based guards"
```

---

### Task 6: Tournament feature — list, detail, bracket

**Files:**
- Create: `apps/mobile/lib/features/tournaments/models/tournament.dart`
- Create: `apps/mobile/lib/features/tournaments/repositories/tournament_repository.dart`
- Create: `apps/mobile/lib/features/tournaments/providers/tournaments_provider.dart`
- Create: `apps/mobile/lib/features/tournaments/screens/tournament_list_screen.dart`
- Create: `apps/mobile/lib/features/tournaments/screens/tournament_detail_screen.dart`
- Create: `apps/mobile/lib/features/tournaments/screens/bracket_screen.dart`

- [ ] **Step 1: Tournament model**

```dart
// apps/mobile/lib/features/tournaments/models/tournament.dart
class Tournament {
  final String id;
  final String name;
  final String sport;
  final String format;
  final String status;
  final String? startDate;
  final String? endDate;
  final String? registrationDeadline;
  final String? location;
  final Map<String, dynamic> organizer;

  const Tournament({
    required this.id,
    required this.name,
    required this.sport,
    required this.format,
    required this.status,
    this.startDate,
    this.endDate,
    this.registrationDeadline,
    this.location,
    required this.organizer,
  });

  factory Tournament.fromJson(Map<String, dynamic> j) => Tournament(
        id: j['id'] as String,
        name: j['name'] as String,
        sport: j['sport'] as String,
        format: j['format'] as String,
        status: j['status'] as String,
        startDate: j['startDate'] as String?,
        endDate: j['endDate'] as String?,
        registrationDeadline: j['registrationDeadline'] as String?,
        location: j['location'] as String?,
        organizer: j['organizer'] as Map<String, dynamic>? ?? {},
      );

  bool get isRegistrationOpen {
    if (registrationDeadline == null) return status == 'draft' || status == 'registration';
    return DateTime.now().isBefore(DateTime.parse(registrationDeadline!));
  }
}
```

- [ ] **Step 2: Tournament repository**

```dart
// apps/mobile/lib/features/tournaments/repositories/tournament_repository.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/tournament.dart';

class TournamentRepository {
  final dio;
  TournamentRepository(this.dio);

  Future<List<Tournament>> fetchAll() async {
    final resp = await dio.get('/tournaments');
    final list = resp.data as List;
    return list.map((e) => Tournament.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Tournament> fetchOne(String id) async {
    final resp = await dio.get('/tournaments/$id');
    return Tournament.fromJson(resp.data as Map<String, dynamic>);
  }

  Future<List<dynamic>> fetchBracket(String tournamentId) async {
    final resp = await dio.get('/brackets/$tournamentId');
    return resp.data as List;
  }

  Future<void> registerTeam(String tournamentId, String teamId) async {
    await dio.post('/tournaments/$tournamentId/teams', data: {'teamId': teamId});
  }
}

final tournamentRepoProvider = Provider((ref) =>
    TournamentRepository(ref.watch(dioProvider)));
```

- [ ] **Step 3: Tournaments provider**

```dart
// apps/mobile/lib/features/tournaments/providers/tournaments_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/tournament_repository.dart';
import '../models/tournament.dart';

final tournamentsProvider = FutureProvider<List<Tournament>>((ref) {
  return ref.watch(tournamentRepoProvider).fetchAll();
});

final tournamentDetailProvider =
    FutureProvider.family<Tournament, String>((ref, id) {
  return ref.watch(tournamentRepoProvider).fetchOne(id);
});

final bracketProvider =
    FutureProvider.family<List<dynamic>, String>((ref, tournamentId) {
  return ref.watch(tournamentRepoProvider).fetchBracket(tournamentId);
});
```

- [ ] **Step 4: Tournament list screen**

```dart
// apps/mobile/lib/features/tournaments/screens/tournament_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';
import '../../../features/auth/providers/auth_provider.dart';

class TournamentListScreen extends ConsumerWidget {
  const TournamentListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tournamentsAsync = ref.watch(tournamentsProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('G3 Sports', style: TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.w900)),
        actions: [
          if (user == null)
            TextButton(
              onPressed: () => context.push('/login'),
              child: const Text('Sign In', style: TextStyle(color: Color(0xFF00E5FF))),
            )
          else
            GestureDetector(
              onTap: () => context.push('/my-profile'),
              child: const Padding(
                padding: EdgeInsets.all(12),
                child: Icon(Icons.person, color: Color(0xFF00E5FF)),
              ),
            ),
        ],
      ),
      floatingActionButton: user?.isOrganizer == true
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/create-tournament'),
              backgroundColor: const Color(0xFF00E5FF),
              foregroundColor: Colors.black,
              label: const Text('New Tournament'),
              icon: const Icon(Icons.add),
            )
          : null,
      body: tournamentsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: Colors.redAccent))),
        data: (tournaments) => tournaments.isEmpty
            ? const Center(child: Text('No tournaments yet', style: TextStyle(color: Colors.white54)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: tournaments.length,
                itemBuilder: (context, i) {
                  final t = tournaments[i];
                  return GestureDetector(
                    onTap: () => context.push('/tournaments/${t.id}'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF111118),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(child: Text(t.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: t.status == 'live' ? Colors.green.withOpacity(0.2) : const Color(0xFF00E5FF).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  t.status.toUpperCase(),
                                  style: TextStyle(
                                    color: t.status == 'live' ? Colors.greenAccent : const Color(0xFF00E5FF),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text('${t.sport.toUpperCase()} · ${t.format}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                          if (t.location != null) ...[
                            const SizedBox(height: 4),
                            Text('📍 ${t.location}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
```

- [ ] **Step 5: Tournament detail screen**

```dart
// apps/mobile/lib/features/tournaments/screens/tournament_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';
import '../../auth/providers/auth_provider.dart';

class TournamentDetailScreen extends ConsumerWidget {
  final String id;
  const TournamentDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tAsync = ref.watch(tournamentDetailProvider(id));
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Tournament', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: tAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: Colors.redAccent))),
        data: (t) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(t.name, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('${t.sport.toUpperCase()} · ${t.format}', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 14)),
            if (t.location != null) ...[
              const SizedBox(height: 4),
              Text('📍 ${t.location}', style: const TextStyle(color: Colors.white54, fontSize: 13)),
            ],
            if (t.registrationDeadline != null) ...[
              const SizedBox(height: 4),
              Text('Registration closes: ${t.registrationDeadline}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
            ],
            const SizedBox(height: 24),
            Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => context.push('/tournaments/${t.id}/bracket'),
                  style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF00E5FF), side: const BorderSide(color: Color(0xFF00E5FF))),
                  child: const Text('View Bracket'),
                ),
              ),
              if (user != null && t.isRegistrationOpen) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {/* Register team flow */},
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                    child: const Text('Register Team'),
                  ),
                ),
              ],
            ]),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 6: Bracket screen**

```dart
// apps/mobile/lib/features/tournaments/screens/bracket_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/tournaments_provider.dart';

class BracketScreen extends ConsumerWidget {
  final String tournamentId;
  const BracketScreen({super.key, required this.tournamentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bracketAsync = ref.watch(bracketProvider(tournamentId));

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Bracket', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: bracketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF))),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: Colors.redAccent))),
        data: (bracket) {
          // Group by round
          final Map<String, List<dynamic>> rounds = {};
          for (final bm in bracket) {
            final round = bm['round'] as String? ?? '1';
            rounds.putIfAbsent(round, () => []).add(bm);
          }
          final sortedRounds = rounds.keys.toList()..sort();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: sortedRounds.map((round) {
              final matches = rounds[round]!;
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Round $round', style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  ...matches.map((bm) {
                    final match = bm['match'];
                    if (match == null) {
                      return const Padding(
                        padding: EdgeInsets.only(bottom: 8),
                        child: Text('BYE', style: TextStyle(color: Colors.white38, fontSize: 12)),
                      );
                    }
                    final teamA = match['teamA']?['name'] ?? 'TBD';
                    final teamB = match['teamB']?['name'] ?? 'TBD';
                    final status = match['status'] as String? ?? '';
                    final winnerId = match['winner']?['id'];
                    final teamAId = match['teamA']?['id'];
                    return GestureDetector(
                      onTap: status == 'live'
                          ? () => context.push('/matches/${match['id']}/live')
                          : null,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111118),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: status == 'live' ? Colors.greenAccent.withOpacity(0.4) : Colors.white.withOpacity(0.05),
                          ),
                        ),
                        child: Row(
                          children: [
                            Expanded(child: Text(teamA, style: TextStyle(color: winnerId == teamAId ? const Color(0xFF00E5FF) : Colors.white, fontWeight: FontWeight.w600))),
                            Text('vs', style: TextStyle(color: Colors.white38)),
                            Expanded(child: Text(teamB, textAlign: TextAlign.right, style: TextStyle(color: winnerId != null && winnerId != teamAId ? const Color(0xFF00E5FF) : Colors.white, fontWeight: FontWeight.w600))),
                            const SizedBox(width: 8),
                            if (status == 'live')
                              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.greenAccent, shape: BoxShape.circle)),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 16),
                ],
              );
            }).toList(),
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/lib/features/tournaments/
git commit -m "feat(mobile): tournament list, detail, and bracket screens"
```

---

### Task 7: Live spectator screen (Socket.IO)

**Files:**
- Create: `apps/mobile/lib/features/matches/models/match.dart`
- Create: `apps/mobile/lib/features/matches/screens/live_spectator_screen.dart`

- [ ] **Step 1: Match model**

```dart
// apps/mobile/lib/features/matches/models/match.dart
class AppMatch {
  final String id;
  final String status;
  final String sport;
  final String? round;
  final Map<String, dynamic> teamA;
  final Map<String, dynamic> teamB;
  final Map<String, dynamic>? winner;
  final Map<String, dynamic>? scoringConfig;

  const AppMatch({
    required this.id,
    required this.status,
    required this.sport,
    this.round,
    required this.teamA,
    required this.teamB,
    this.winner,
    this.scoringConfig,
  });

  factory AppMatch.fromJson(Map<String, dynamic> j) => AppMatch(
        id: j['id'] as String,
        status: j['status'] as String,
        sport: j['sport'] as String,
        round: j['round'] as String?,
        teamA: j['teamA'] as Map<String, dynamic>? ?? {},
        teamB: j['teamB'] as Map<String, dynamic>? ?? {},
        winner: j['winner'] as Map<String, dynamic>?,
        scoringConfig: j['scoringConfig'] as Map<String, dynamic>?,
      );
}
```

- [ ] **Step 2: Live spectator screen**

```dart
// apps/mobile/lib/features/matches/screens/live_spectator_screen.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/socket/socket_client.dart';
import '../../../core/api/api_client.dart';

class LiveSpectatorScreen extends ConsumerStatefulWidget {
  final String matchId;
  const LiveSpectatorScreen({super.key, required this.matchId});

  @override
  ConsumerState<LiveSpectatorScreen> createState() => _LiveSpectatorScreenState();
}

class _LiveSpectatorScreenState extends ConsumerState<LiveSpectatorScreen> {
  Map<String, dynamic>? _scoreData;
  Map<String, dynamic>? _matchData;
  StreamSubscription? _sub;
  bool _connected = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    // Load match info
    final dio = ref.read(dioProvider);
    try {
      final resp = await dio.get('/matches/${widget.matchId}');
      setState(() => _matchData = resp.data as Map<String, dynamic>);
    } catch (_) {}

    // Load initial score
    try {
      final dio = ref.read(dioProvider);
      final resp = await dio.get('/score/badminton/${widget.matchId}');
      setState(() => _scoreData = {'sets': resp.data});
    } catch (_) {}

    // Connect socket
    final client = ref.read(socketClientProvider);
    await client.connect();
    client.joinRoom(widget.matchId);
    setState(() => _connected = true);
    _sub = client.scoreUpdates().listen((data) {
      if (data['match_id'] == widget.matchId) {
        setState(() => _scoreData = data);
      }
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    ref.read(socketClientProvider).leaveRoom(widget.matchId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final teamA = _matchData?['teamA']?['name'] ?? 'Team A';
    final teamB = _matchData?['teamB']?['name'] ?? 'Team B';
    final sets = (_scoreData?['team_a_score']?['sets'] as List?) ?? [];
    final setsB = (_scoreData?['team_b_score']?['sets'] as List?) ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Live Match', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: _connected ? Colors.greenAccent : Colors.redAccent, shape: BoxShape.circle)),
              const SizedBox(width: 6),
              Text(_connected ? 'LIVE' : 'Connecting…', style: TextStyle(color: _connected ? Colors.greenAccent : Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold)),
            ]),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: Column(children: [
                  Text(teamA, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(sets.isNotEmpty ? '${sets.last}' : '0', style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 64, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
                ])),
                const Text('vs', style: TextStyle(color: Colors.white38, fontSize: 20)),
                Expanded(child: Column(children: [
                  Text(teamB, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(setsB.isNotEmpty ? '${setsB.last}' : '0', style: const TextStyle(color: Colors.white, fontSize: 64, fontWeight: FontWeight.w900), textAlign: TextAlign.center),
                ])),
              ],
            ),
            const SizedBox(height: 24),
            // Set history
            if (sets.length > 1)
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                for (int i = 0; i < sets.length - 1; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text('Set ${i+1}: ${sets[i]} – ${setsB[i]}', style: const TextStyle(color: Colors.white38, fontSize: 12)),
                  ),
              ]),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/features/matches/
git commit -m "feat(mobile): live spectator screen with Socket.IO real-time score"
```

---

### Task 8: Scoring feature — fixture list, start match, live scoring

**Files:**
- Create: `apps/mobile/lib/features/scoring/screens/fixture_list_screen.dart`
- Create: `apps/mobile/lib/features/scoring/screens/start_match_screen.dart`
- Create: `apps/mobile/lib/features/scoring/screens/live_scoring_screen.dart`
- Create: `apps/mobile/lib/features/scoring/repositories/score_repository.dart`

- [ ] **Step 1: Score repository**

```dart
// apps/mobile/lib/features/scoring/repositories/score_repository.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ScoreRepository {
  final dio;
  ScoreRepository(this.dio);

  Future<List<dynamic>> fetchMyFixtures() async {
    // Fetch matches assigned to me as scorer
    final resp = await dio.get('/matches', queryParameters: {'scorerId': 'me'});
    return resp.data as List;
  }

  Future<Map<String, dynamic>> startMatch(String matchId, int pointsPerSet, String deuceRule) async {
    final resp = await dio.patch('/matches/$matchId/start', data: {
      'pointsPerSet': pointsPerSet,
      'deuceRule': deuceRule,
    });
    return resp.data as Map<String, dynamic>;
  }

  Future<void> recordPoint(String matchId, String scoringTeam, int setNumber) async {
    await dio.post('/score/badminton/point', data: {
      'matchId': matchId,
      'scoringTeam': scoringTeam,
      'setNumber': setNumber,
    });
  }

  Future<void> undoPoint(String matchId) async {
    await dio.delete('/score/badminton/$matchId/undo');
  }

  Future<void> completeMatch(String matchId, String winnerTeamId) async {
    await dio.patch('/matches/$matchId/complete', data: {'winnerTeamId': winnerTeamId});
  }

  Future<List<dynamic>> getScore(String matchId) async {
    final resp = await dio.get('/score/badminton/$matchId');
    return resp.data as List;
  }
}

final scoreRepoProvider = Provider((ref) => ScoreRepository(ref.watch(dioProvider)));
```

- [ ] **Step 2: Fixture list screen**

```dart
// apps/mobile/lib/features/scoring/screens/fixture_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../repositories/score_repository.dart';

class FixtureListScreen extends ConsumerWidget {
  const FixtureListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fixturesAsync = ref.watch(
      FutureProvider((r) => r.read(scoreRepoProvider).fetchMyFixtures()).future as dynamic,
    );

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Fixtures', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: ref.read(scoreRepoProvider).fetchMyFixtures(),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          if (snap.hasError) return Center(child: Text('${snap.error}', style: const TextStyle(color: Colors.redAccent)));
          final matches = snap.data ?? [];
          if (matches.isEmpty) return const Center(child: Text('No matches assigned', style: TextStyle(color: Colors.white54)));

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: matches.length,
            itemBuilder: (ctx, i) {
              final m = matches[i] as Map<String, dynamic>;
              final teamA = m['teamA']?['name'] ?? 'TBD';
              final teamB = m['teamB']?['name'] ?? 'TBD';
              final status = m['status'] as String;
              final matchId = m['id'] as String;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF111118),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Round ${m['round'] ?? '?'}', style: const TextStyle(color: Colors.white38, fontSize: 11)),
                    const SizedBox(height: 4),
                    Text('$teamA  vs  $teamB', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 10),
                    Row(children: [
                      if (status == 'scheduled')
                        ElevatedButton(
                          onPressed: () => context.push('/fixtures/$matchId/start'),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                          child: const Text('Start Match'),
                        )
                      else if (status == 'live')
                        ElevatedButton(
                          onPressed: () => context.push('/matches/$matchId/score'),
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.greenAccent, foregroundColor: Colors.black),
                          child: const Text('Continue Scoring'),
                        )
                      else
                        const Text('COMPLETED', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 12, fontWeight: FontWeight.bold)),
                    ]),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 3: Start match screen**

```dart
// apps/mobile/lib/features/scoring/screens/start_match_screen.dart
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
            const Text('Points per set', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1.5)),
            const SizedBox(height: 12),
            Row(children: [
              _choiceButton('11', _points == 11, () => setState(() => _points = 11)),
              const SizedBox(width: 12),
              _choiceButton('21', _points == 21, () => setState(() => _points = 21)),
            ]),
            const SizedBox(height: 28),
            const Text('Deuce rule (at tie)', style: TextStyle(color: Colors.white54, fontSize: 12, letterSpacing: 1.5)),
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
```

- [ ] **Step 4: Live scoring screen**

```dart
// apps/mobile/lib/features/scoring/screens/live_scoring_screen.dart
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
      else _currentSet = (sets.length) + 1;
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

    // Count sets won
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
          // Set wins bar
          Container(
            color: const Color(0xFF111118),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Sets: $aWins', style: const TextStyle(color: Color(0xFF00E5FF), fontWeight: FontWeight.bold)),
              Text('Best of 3', style: const TextStyle(color: Colors.white38, fontSize: 12)),
              Text('Sets: $bWins', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ]),
          ),

          // Score display
          Expanded(
            child: Row(
              children: [
                // Team A
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

                // Team B
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

          // Let + Undo row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            child: Row(children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _loading ? null : () {/* Let = no point awarded, just log */},
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
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/features/scoring/
git commit -m "feat(mobile): scorer fixture list, start match config, and live scoring screen"
```

---

### Task 9: Auth screens (OTP flow + profile setup)

**Files:**
- Create: `apps/mobile/lib/features/auth/screens/phone_screen.dart`
- Create: `apps/mobile/lib/features/auth/screens/otp_screen.dart`
- Create: `apps/mobile/lib/features/auth/screens/profile_setup_screen.dart`

- [ ] **Step 1: Phone screen**

```dart
// apps/mobile/lib/features/auth/screens/phone_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _sendOtp() async {
    final phone = _ctrl.text.trim();
    if (phone.isEmpty) return;
    setState(() { _loading = true; _error = null; });

    final svc = ref.read(authServiceProvider);
    await svc.sendOtp(
      phoneNumber: phone.startsWith('+') ? phone : '+91$phone',
      onCodeSent: (vid) {
        if (mounted) {
          setState(() => _loading = false);
          context.push('/otp', extra: vid);
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
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              const Text('G3', style: TextStyle(color: Color(0xFF00E5FF), fontSize: 40, fontWeight: FontWeight.w900)),
              const Text('Sports', style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.w900)),
              const SizedBox(height: 48),
              const Text('PHONE NUMBER', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 8),
              TextField(
                controller: _ctrl,
                keyboardType: TextInputType.phone,
                style: const TextStyle(color: Colors.white, fontSize: 18),
                decoration: InputDecoration(
                  hintText: '+91 9876543210',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF00E5FF))),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 13)),
              ],
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _sendOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                      : const Text('Send OTP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 2: OTP screen**

```dart
// apps/mobile/lib/features/auth/screens/otp_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  final String verificationId;
  const OtpScreen({super.key, required this.verificationId});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _ctrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _verify() async {
    final code = _ctrl.text.trim();
    if (code.length != 6) return;
    setState(() { _loading = true; _error = null; });

    try {
      final svc = ref.read(authServiceProvider);
      final result = await svc.verifyOtp(
        verificationId: widget.verificationId,
        smsCode: code,
      );
      ref.read(currentUserProvider.notifier).state = result.user;
      if (mounted) {
        if (result.isNewUser || result.user.displayName == null) {
          context.go('/profile-setup');
        } else if (result.user.isOrganizer) {
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
      appBar: AppBar(backgroundColor: const Color(0xFF0A0A0F), iconTheme: const IconThemeData(color: Colors.white)),
      body: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Enter OTP', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('6-digit code sent to your phone', style: TextStyle(color: Colors.white38)),
            const SizedBox(height: 32),
            TextField(
              controller: _ctrl,
              keyboardType: TextInputType.number,
              maxLength: 6,
              style: const TextStyle(color: Colors.white, fontSize: 28, letterSpacing: 8, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: const Color(0xFF111118),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF00E5FF))),
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
                    : const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

- [ ] **Step 3: Profile setup screen**

```dart
// apps/mobile/lib/features/auth/screens/profile_setup_screen.dart
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
  bool _loading = false;
  String? _error;

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      await dio.put('/users/me', data: {'fullName': _nameCtrl.text.trim()});
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
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              const Text('Set up your profile', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('This is your public player name', style: TextStyle(color: Colors.white38)),
              const SizedBox(height: 32),
              const Text('DISPLAY NAME', style: TextStyle(color: Colors.white38, fontSize: 11, letterSpacing: 2)),
              const SizedBox(height: 8),
              TextField(
                controller: _nameCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'e.g. Selva Kumar',
                  hintStyle: const TextStyle(color: Colors.white24),
                  filled: true,
                  fillColor: const Color(0xFF111118),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF00E5FF))),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
              ],
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _loading ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E5FF),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _loading
                      ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2)
                      : const Text('Save & Continue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/lib/features/auth/screens/
git commit -m "feat(mobile): phone, OTP, and profile setup screens"
```

---

### Task 10: Teams, Organizer, and Profile screens (stubs + core)

**Files:**
- Create: `apps/mobile/lib/features/teams/screens/my_team_screen.dart`
- Create: `apps/mobile/lib/features/teams/screens/create_team_screen.dart`
- Create: `apps/mobile/lib/features/organizer/screens/my_tournaments_screen.dart`
- Create: `apps/mobile/lib/features/organizer/screens/create_tournament_screen.dart`
- Create: `apps/mobile/lib/features/organizer/screens/manage_registrations_screen.dart`
- Create: `apps/mobile/lib/features/profile/screens/my_profile_screen.dart`
- Create: `apps/mobile/lib/features/profile/screens/public_profile_screen.dart`

- [ ] **Step 1: My Team screen**

```dart
// apps/mobile/lib/features/teams/screens/my_team_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class MyTeamScreen extends ConsumerWidget {
  const MyTeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Team', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/teams/mine'),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          }
          if (snap.hasError) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Text('No team yet', style: TextStyle(color: Colors.white54, fontSize: 16)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.push('/create-team'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black),
                  child: const Text('Create Team'),
                ),
              ]),
            );
          }
          final team = snap.data?.data as Map<String, dynamic>?;
          if (team == null) return const Center(child: Text('No team', style: TextStyle(color: Colors.white54)));
          final members = (team['members'] as List?) ?? [];
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(team['name'] as String? ?? '', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('${team['sport'] ?? ''} · ${members.length} members', style: const TextStyle(color: Colors.white38, fontSize: 13)),
              const SizedBox(height: 20),
              ...members.map((m) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(backgroundColor: Color(0xFF00E5FF), child: Icon(Icons.person, color: Colors.black)),
                title: Text(m['fullName'] ?? m['username'] ?? 'Player', style: const TextStyle(color: Colors.white)),
                subtitle: Text(m['role'] ?? '', style: const TextStyle(color: Colors.white38, fontSize: 12)),
              )),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 2: Create Team screen**

```dart
// apps/mobile/lib/features/teams/screens/create_team_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class CreateTeamScreen extends ConsumerStatefulWidget {
  const CreateTeamScreen({super.key});

  @override
  ConsumerState<CreateTeamScreen> createState() => _CreateTeamScreenState();
}

class _CreateTeamScreenState extends ConsumerState<CreateTeamScreen> {
  final _nameCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _create() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() { _loading = true; _error = null; });
    try {
      await ref.read(dioProvider).post('/teams', data: {
        'name': _nameCtrl.text.trim(),
        'sport': 'badminton',
      });
      if (mounted) context.pop();
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(backgroundColor: const Color(0xFF111118), title: const Text('Create Team', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(children: [
          TextField(
            controller: _nameCtrl,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(labelText: 'Team Name', labelStyle: const TextStyle(color: Colors.white38), filled: true, fillColor: const Color(0xFF111118), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
          ),
          if (_error != null) ...[const SizedBox(height: 8), Text(_error!, style: const TextStyle(color: Colors.redAccent))],
          const Spacer(),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _loading ? null : _create,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: _loading ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2) : const Text('Create', style: TextStyle(fontWeight: FontWeight.bold)),
          )),
        ]),
      ),
    );
  }
}
```

- [ ] **Step 3: Organizer screens**

```dart
// apps/mobile/lib/features/organizer/screens/my_tournaments_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

class MyTournamentsScreen extends ConsumerWidget {
  const MyTournamentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Tournaments', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/create-tournament'),
        backgroundColor: const Color(0xFF00E5FF),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add),
        label: const Text('New'),
      ),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/tournaments/mine'),
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          final list = (snap.data?.data as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No tournaments yet', style: TextStyle(color: Colors.white54)));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (ctx, i) {
              final t = list[i] as Map<String, dynamic>;
              return ListTile(
                title: Text(t['name'] as String? ?? '', style: const TextStyle(color: Colors.white)),
                subtitle: Text('${t['status']}', style: const TextStyle(color: Colors.white38)),
                trailing: const Icon(Icons.chevron_right, color: Colors.white38),
                onTap: () => context.push('/tournaments/${t['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
```

```dart
// apps/mobile/lib/features/organizer/screens/create_tournament_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';

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
  bool _loading = false;
  String? _error;

  Future<void> _pickDate(Function(String) onPicked) async {
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
        'sport': 'badminton',
        'format': 'SINGLE_ELIMINATION',
        'startDate': _startDate,
        'endDate': _endDate,
        'registrationDeadline': _deadline.isEmpty ? null : _deadline,
        'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
      });
      if (mounted) context.pop();
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
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
      appBar: AppBar(backgroundColor: const Color(0xFF111118), title: const Text('Create Tournament', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _nameCtrl, style: const TextStyle(color: Colors.white), decoration: InputDecoration(labelText: 'Tournament Name', labelStyle: const TextStyle(color: Colors.white38), filled: true, fillColor: const Color(0xFF111118), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
          const SizedBox(height: 12),
          TextField(controller: _locationCtrl, style: const TextStyle(color: Colors.white), decoration: InputDecoration(labelText: 'Location (optional)', labelStyle: const TextStyle(color: Colors.white38), filled: true, fillColor: const Color(0xFF111118), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none))),
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
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
            child: _loading ? const CircularProgressIndicator(color: Colors.black, strokeWidth: 2) : const Text('Create Tournament', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
```

```dart
// apps/mobile/lib/features/organizer/screens/manage_registrations_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ManageRegistrationsScreen extends ConsumerWidget {
  final String tournamentId;
  const ManageRegistrationsScreen({super.key, required this.tournamentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(backgroundColor: const Color(0xFF111118), title: const Text('Registrations', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/tournaments/$tournamentId/teams'),
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          final list = (snap.data?.data as List?) ?? [];
          if (list.isEmpty) return const Center(child: Text('No registrations yet', style: TextStyle(color: Colors.white54)));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (ctx, i) {
              final reg = list[i] as Map<String, dynamic>;
              final team = reg['team'] as Map<String, dynamic>? ?? {};
              return ListTile(
                title: Text(team['name'] as String? ?? '', style: const TextStyle(color: Colors.white)),
                subtitle: Text('${team['sport'] ?? ''}', style: const TextStyle(color: Colors.white38)),
                trailing: const Icon(Icons.check_circle, color: Color(0xFF00E5FF)),
              );
            },
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 4: Profile screens**

```dart
// apps/mobile/lib/features/profile/screens/my_profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/api/api_client.dart';

class MyProfileScreen extends ConsumerWidget {
  const MyProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (user == null) return const Center(child: Text('Not logged in', style: TextStyle(color: Colors.white54)));

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111118),
        title: const Text('My Profile', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              ref.read(currentUserProvider.notifier).state = null;
              if (context.mounted) context.go('/tournaments');
            },
            child: const Text('Sign Out', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          CircleAvatar(radius: 40, backgroundColor: const Color(0xFF00E5FF), child: Text((user.displayName ?? 'P')[0].toUpperCase(), style: const TextStyle(color: Colors.black, fontSize: 32, fontWeight: FontWeight.bold))),
          const SizedBox(height: 16),
          Text(user.displayName ?? 'Player', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          Text(user.role.toUpperCase(), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12, letterSpacing: 2)),
          const SizedBox(height: 32),
          if (!user.isOrganizer) ...[
            OutlinedButton(
              onPressed: () => _requestOrganizerAccess(context, ref),
              style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF00E5FF), side: const BorderSide(color: Color(0xFF00E5FF)), padding: const EdgeInsets.symmetric(vertical: 14)),
              child: const Text('Request Organizer Access'),
            ),
            const SizedBox(height: 8),
            const Text('Submit a request for the admin to review. Once approved, you can create tournaments.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white38, fontSize: 12)),
          ],
          if (user.isOrganizer) ...[
            ElevatedButton(
              onPressed: () => context.push('/my-tournaments'),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF), foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14)),
              child: const Text('My Tournaments'),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _requestOrganizerAccess(BuildContext context, WidgetRef ref) async {
    String reason = '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF111118),
        title: const Text('Request Organizer Access', style: TextStyle(color: Colors.white)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Briefly describe why you want to organize tournaments:', style: TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 12),
          TextField(
            style: const TextStyle(color: Colors.white),
            onChanged: (v) => reason = v,
            decoration: const InputDecoration(hintText: 'Optional reason…', hintStyle: TextStyle(color: Colors.white24), filled: true, fillColor: Color(0xFF0A0A0F), border: OutlineInputBorder(borderSide: BorderSide.none)),
            maxLines: 3,
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel', style: TextStyle(color: Colors.white38))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Submit', style: TextStyle(color: Color(0xFF00E5FF)))),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      try {
        await ref.read(dioProvider).post('/users/role-requests', data: {'reason': reason});
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted! Admin will review it.')));
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}
```

```dart
// apps/mobile/lib/features/profile/screens/public_profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class PublicProfileScreen extends ConsumerWidget {
  final String userId;
  const PublicProfileScreen({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(backgroundColor: const Color(0xFF111118), title: const Text('Player Profile', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: FutureBuilder(
        future: ref.read(dioProvider).get('/users/$userId'),
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)));
          if (snap.hasError) return Center(child: Text('${snap.error}', style: const TextStyle(color: Colors.redAccent)));
          final u = snap.data?.data as Map<String, dynamic>? ?? {};
          final name = u['fullName'] ?? u['username'] ?? 'Player';
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              CircleAvatar(radius: 40, backgroundColor: const Color(0xFF00E5FF), child: Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.black, fontSize: 32, fontWeight: FontWeight.bold))),
              const SizedBox(height: 16),
              Text(name, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              Text((u['role'] as String? ?? 'player').toUpperCase(), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12, letterSpacing: 2)),
            ],
          );
        },
      ),
    );
  }
}
```

- [ ] **Step 5: Commit all**

```bash
git add apps/mobile/lib/features/teams/
git add apps/mobile/lib/features/organizer/
git add apps/mobile/lib/features/profile/
git commit -m "feat(mobile): teams, organizer, and profile screens"
```

---

### Task 11: Final wiring — build and run

- [ ] **Step 1: Build for Android debug**

```bash
cd apps/mobile
flutter build apk --debug
```

Expected: Build succeeds. APK at `build/app/outputs/flutter-apk/app-debug.apk`.

- [ ] **Step 2: Run on device/emulator**

```bash
flutter run
```

Walk through the flows:
1. Open app → tournament list shows (guest)
2. Tap Sign In → phone screen → OTP → verify → profile setup → tournament list
3. Browse tournament → bracket → tap live match → spectate real-time score
4. My Profile → Request Organizer Access → submit
5. (After admin approves) → My Tournaments → Create Tournament → fills dates → create

- [ ] **Step 3: Test scorer flow**

1. Use backend shell/Postman to assign a player as scorer to a match: `PATCH /matches/:id/scorer` with `{ scorerId: '<user-id>' }`
2. Log in as that player on the app
3. Navigate to `/fixtures` → see the match → Start Match → choose 21 pts + Golden Point → Start
4. Live Scoring screen appears → tap + POINT on each team → score updates
5. Socket.IO: open another device/browser as spectator at the live match → confirms score updates in real-time
6. Tap End Match → confirm winner → match marked COMPLETED

- [ ] **Step 4: Final commit**

```bash
cd ../..
git add apps/mobile/
git push origin main
git push origin main:master
git commit -m "feat(mobile): complete Flutter mobile app — auth, tournaments, live scoring, organizer"
```
