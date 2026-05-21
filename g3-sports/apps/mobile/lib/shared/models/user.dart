class AppUser {
  final String id;
  final String? phone;
  final String? email;
  final String? displayName;
  final String? username;
  final String? avatarUrl;
  final String role;

  const AppUser({
    required this.id,
    this.phone,
    this.email,
    this.displayName,
    this.username,
    this.avatarUrl,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'] as String,
        phone: j['phone'] as String?,
        email: j['email'] as String?,
        displayName: (j['fullName'] ?? j['displayName']) as String?,
        username: j['username'] as String?,
        avatarUrl: j['avatarUrl'] as String?,
        role: j['role'] as String? ?? 'player',
      );

  /// Profile is incomplete if username is not set yet
  bool get needsProfileSetup => username == null || username!.isEmpty;

  bool get isOrganizer => role == 'organizer' || role == 'super_admin';
  bool get isSuperAdmin => role == 'super_admin';
}
