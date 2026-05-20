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
