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
