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
import '../features/auth/screens/username_login_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final user = ref.watch(currentUserProvider);

  return GoRouter(
    initialLocation: '/tournaments',
    redirect: (context, state) {
      final isAuth = user != null;
      final path = state.matchedLocation;
      final authPaths = ['/login', '/login-username', '/otp', '/profile-setup'];

      // Not logged in — allow public and auth pages only
      if (!isAuth && !authPaths.contains(path)) {
        const publicPaths = ['/tournaments', '/profile'];
        if (publicPaths.any((p) => path.startsWith(p))) return null;
        return '/tournaments';
      }

      // Logged in but username not set — force profile setup
      if (isAuth && user!.needsProfileSetup && path != '/profile-setup') {
        return '/profile-setup';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const PhoneScreen()),
      GoRoute(path: '/login-username', builder: (_, __) => const UsernameLoginScreen()),
      GoRoute(
        path: '/otp',
        builder: (_, state) => OtpScreen(extra: state.extra),
      ),
      GoRoute(path: '/profile-setup', builder: (_, __) => const ProfileSetupScreen()),
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
      GoRoute(path: '/my-team', builder: (_, __) => const MyTeamScreen()),
      GoRoute(path: '/create-team', builder: (_, __) => const CreateTeamScreen()),
      GoRoute(path: '/my-profile', builder: (_, __) => const MyProfileScreen()),
      GoRoute(path: '/fixtures', builder: (_, __) => const FixtureListScreen()),
      GoRoute(
        path: '/fixtures/:matchId/start',
        builder: (_, state) => StartMatchScreen(matchId: state.pathParameters['matchId']!),
      ),
      GoRoute(
        path: '/matches/:id/score',
        builder: (_, state) => LiveScoringScreen(matchId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/my-tournaments', builder: (_, __) => const MyTournamentsScreen()),
      GoRoute(path: '/create-tournament', builder: (_, __) => const CreateTournamentScreen()),
      GoRoute(
        path: '/tournaments/:id/registrations',
        builder: (_, state) => ManageRegistrationsScreen(tournamentId: state.pathParameters['id']!),
      ),
    ],
  );
});
