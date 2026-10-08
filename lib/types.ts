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

export type Conference = "Est" | "Ouest";
export type Division = "Atlantique" | "Centrale" | "Sud-Est" | "Nord-Ouest" | "Pacifique" | "Sud-Ouest";

export interface Team {
  name: string;
  conference: Conference;
  division: Division;
}

/** G = arrière, F = ailier, C = pivot (notation officielle NBA). */
export type Position = "G" | "F" | "C" | "G-F" | "F-C";

export interface Player {
  id: number;
  name: string;
  team: TeamCode;
  position: Position;
  heightCm: number;
  /** Format ISO YYYY-MM-DD */
  birthDate: string;
  number: number;
}

/** Ce que le navigateur reçoit pour l'autocomplétion : rien qui aide à tricher. */
export interface PlayerOption {
  id: number;
  name: string;
  teamName: string;
}

export type Verdict = "correct" | "near" | "wrong";

export interface Cell<T> {
  value: T;
  verdict: Verdict;
  /** La bonne valeur est plus haute ("up") ou plus basse ("down"). */
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
  /** Révélé seulement quand la partie est finie. */
  answer?: PlayerSummary;
}

export const MAX_TRIES = 8;
