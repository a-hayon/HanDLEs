export type TeamCode =
  | "ATL"
  | "BOS"
  | "BKN"
  | "CHA"
  | "CHI"
  | "CLE"
  | "DAL"
  | "DEN"
  | "DET"
  | "GSW"
  | "HOU"
  | "IND"
  | "LAC"
  | "LAL"
  | "MEM"
  | "MIA"
  | "MIL"
  | "MIN"
  | "NOP"
  | "NYK"
  | "OKC"
  | "ORL"
  | "PHI"
  | "PHX"
  | "POR"
  | "SAC"
  | "SAS"
  | "TOR"
  | "UTA"
  | "WAS";

export type Conference = "East" | "West";
export type Division = "Atlantic" | "Central" | "Southeast" | "Northwest" | "Pacific" | "Southwest";

export interface Team {
  name: string;
  conference: Conference;
  division: Division;
}

/** G = guard, F = forward, C = center (official NBA notation). */
export type Position = "G" | "F" | "C" | "G-F" | "F-C";

export interface Player {
  id: number;
  name: string;
  team: TeamCode;
  position: Position;
  heightCm: number;
  /** ISO format YYYY-MM-DD */
  birthDate: string;
  number: number;
}

/** What the browser gets for autocomplete: nothing that would help cheating. */
export interface PlayerOption {
  id: number;
  name: string;
  teamName: string;
}

export type Verdict = "correct" | "near" | "wrong";

export interface Cell<T> {
  value: T;
  verdict: Verdict;
  /** The correct value is higher ("up") or lower ("down"). */
  direction?: "up" | "down";
}

export interface GuessFeedback {
  playerId: number;
  name: string;
  teamName: string;
  team: Cell<TeamCode>;
  conference: Cell<Conference>;
  division: Cell<Division>;
  position: Cell<Position>;
  height: Cell<number>;
  age: Cell<number>;
  number: Cell<number>;
}

export interface PlayerSummary {
  name: string;
  teamName: string;
  position: Position;
  heightCm: number;
  age: number;
  number: number;
}

export interface GuessResponse {
  feedback: GuessFeedback;
  solved: boolean;
  /** Only revealed once the game is over. */
  answer?: PlayerSummary;
}

export const MAX_TRIES = 8;
