import { api } from './client';

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  organizer: { id: string; displayName: string };
}

export interface BracketMatchApi {
  id: string;
  round: string;
  position: number;
  match: {
    id: string;
    status: string;
    teamA: { id: string; name: string; logoUrl?: string };
    teamB: { id: string; name: string; logoUrl?: string };
    winner?: { id: string } | null;
  } | null;
  nextMatch?: { id: string } | null;
}

export const fetchTournaments = async (): Promise<Tournament[]> => {
  const { data } = await api.get<Tournament[]>('/tournaments');
  return data;
};

export const fetchBracket = async (tournamentId: string): Promise<BracketMatchApi[]> => {
  const { data } = await api.get<BracketMatchApi[]>(`/brackets/${tournamentId}`);
  return data;
};

export const generateBracket = async (tournamentId: string, sport: string): Promise<BracketMatchApi[]> => {
  const { data } = await api.post<BracketMatchApi[]>(`/brackets/${tournamentId}/generate`, { sport });
  return data;
};
