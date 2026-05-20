import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';

class ScoreRepository {
  final Dio dio;
  ScoreRepository(this.dio);

  Future<List<dynamic>> fetchMyFixtures() async {
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
