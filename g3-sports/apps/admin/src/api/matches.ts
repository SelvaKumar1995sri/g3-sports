import { api } from './client';

export interface LiveMatch {
  id: string;
  sport: string;
  status: string;
  round: string;
  socketRoom: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  tournament: { id: string; name: string };
  ground?: { name: string } | null;
}

export const fetchLiveMatches = async (): Promise<LiveMatch[]> => {
  const { data } = await api.get<LiveMatch[]>('/matches?status=LIVE');
  return data;
};
