import { MatchStatus, WicketType } from './match.types';
import { SportType } from './user.types';

export interface JoinMatchPayload {
  match_id: string;
}

export interface ScoreUpdatePayload {
  match_id: string;
  sport: SportType;
  team_a_score: Record<string, unknown>;
  team_b_score: Record<string, unknown>;
  status: MatchStatus;
  updated_at: string;
}

export interface MatchStatusPayload {
  match_id: string;
  status: MatchStatus;
  sport: SportType;
}

export interface BracketUpdatePayload {
  tournament_id: string;
  match_id: string;
  winner_id: string;
  next_match_id: string | null;
}

export interface WicketPayload {
  match_id: string;
  sport: SportType;
  player_id: string;
  player_name: string;
  wicket_type: WicketType;
  over: number;
  ball: number;
}
