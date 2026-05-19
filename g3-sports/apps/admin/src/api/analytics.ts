import { api } from './client';

export interface DashboardStats {
  totalTournaments: number;
  activeTournaments: number;
  totalMatches: number;
  liveMatches: number;
  totalUsers: number;
  totalTeams: number;
}

export interface MatchesPerDay {
  date: string;
  count: number;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await api.get<DashboardStats>('/analytics/dashboard');
  return data;
};

export const fetchMatchesPerDay = async (days = 30): Promise<MatchesPerDay[]> => {
  const { data } = await api.get<MatchesPerDay[]>(`/analytics/matches-per-day?days=${days}`);
  return data;
};
