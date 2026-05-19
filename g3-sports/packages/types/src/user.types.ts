export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZER = 'organizer',
  ACADEMY_OWNER = 'academy_owner',
  COACH = 'coach',
  PLAYER = 'player',
}

export enum SportType {
  CRICKET = 'cricket',
  BADMINTON = 'badminton',
  PICKLEBALL = 'pickleball',
}

export interface JwtPayload {
  sub: string;       // user uuid
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
