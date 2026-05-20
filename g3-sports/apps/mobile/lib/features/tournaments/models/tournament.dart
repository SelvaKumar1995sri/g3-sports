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
