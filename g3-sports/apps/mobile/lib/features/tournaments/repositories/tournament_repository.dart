import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../models/tournament.dart';

class TournamentRepository {
  final Dio dio;
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
