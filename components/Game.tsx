"use client";

import { useEffect, useState } from "react";
import { GuessGrid } from "./GuessGrid";
import { GuessInput } from "./GuessInput";
import { Legend } from "./Legend";
import { positionLabel } from "@/lib/format";
import { MAX_TRIES, type GuessFeedback, type GuessResponse, type PlayerOption, type PlayerSummary } from "@/lib/types";

type Mode = "daily" | "random";

interface GameState {
  mode: Mode;
  /** Identifiant de partie aléatoire ; absent pour le joueur du jour. */
  gameId?: string;
  guesses: GuessFeedback[];
  solved: boolean;
  answer?: PlayerSummary;
}

const freshDaily = (): GameState => ({ mode: "daily", guesses: [], solved: false });
const storageKey = (todayKey: string) => `handles:daily:${todayKey}`;

export function Game({ options, todayKey }: { options: PlayerOption[]; todayKey: string }) {
  const [game, setGame] = useState<GameState>(freshDaily);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reprend la partie du jour si on recharge la page.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(todayKey));
      if (saved) setGame(JSON.parse(saved) as GameState);
    } catch {
      /* stockage indisponible : on repart de zéro */
    }
  }, [todayKey]);

  useEffect(() => {
    if (game.mode !== "daily") return;
    try {
      localStorage.setItem(storageKey(todayKey), JSON.stringify(game));
    } catch {
      /* ignore */
    }
  }, [game, todayKey]);

  const over = game.solved || game.guesses.length >= MAX_TRIES;
  const guessedIds = new Set(game.guesses.map((g) => g.playerId));

  async function submit(playerId: number) {
    if (over || pending || guessedIds.has(playerId)) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, attempt: game.guesses.length + 1, gameId: game.gameId }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as GuessResponse;
      setGame((g) => ({
        ...g,
        guesses: [...g.guesses, data.feedback],
        solved: data.solved,
        answer: data.answer ?? g.answer,
      }));
    } catch {
      setError("Impossible d’envoyer l’essai. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  function playDaily() {
    try {
      const saved = localStorage.getItem(storageKey(todayKey));
      setGame(saved ? (JSON.parse(saved) as GameState) : freshDaily());
    } catch {
      setGame(freshDaily());
    }
  }

  function playRandom() {
    setGame({ mode: "random", gameId: crypto.randomUUID(), guesses: [], solved: false });
  }

  const tryNumber = Math.min(game.guesses.length + (over ? 0 : 1), MAX_TRIES);
  const btn =
    "min-h-11 cursor-pointer rounded-[10px] border border-line bg-white px-4 text-sm font-semibold hover:brightness-95";

  return (
    <>
      <section className="flex flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(20,23,28,0.06),0_8px_24px_rgba(20,23,28,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-bold tracking-[0.08em] text-muted uppercase">
              {game.mode === "daily" ? "Joueur du jour" : "Partie aléatoire"}
            </span>
            <div className="flex gap-[5px]" aria-hidden="true">
              {Array.from({ length: MAX_TRIES }, (_, i) => {
                const g = game.guesses[i];
                const color = !g ? "bg-line" : i === game.guesses.length - 1 && game.solved ? "bg-ok" : "bg-accent";
                return <span key={i} className={`size-2.5 rounded-full ${color}`} />;
              })}
            </div>
            <span className="text-sm text-muted">
              Essai {tryNumber} / {MAX_TRIES}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={playDaily} className={btn}>
              Joueur du jour
            </button>
            <button type="button" onClick={playRandom} className={btn}>
              Partie aléatoire
            </button>
          </div>
        </div>

        {!over && <GuessInput options={options} excluded={guessedIds} disabled={pending} onPick={submit} />}
        {error && <p className="text-sm text-accent">{error}</p>}

        {over && game.answer && (
          <EndBanner solved={game.solved} answer={game.answer} tries={game.guesses.length} onReplay={playRandom} />
        )}

        <Legend />
      </section>

      <GuessGrid guesses={game.guesses} />
    </>
  );
}

function EndBanner({
  solved,
  answer,
  tries,
  onReplay,
}: {
  solved: boolean;
  answer: PlayerSummary;
  tries: number;
  onReplay: () => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-5 py-[18px] ${
        solved ? "bg-[#e7f5ec]" : "bg-[#fcede6]"
      }`}
    >
      <div className="flex flex-col gap-1">
        <strong className={`text-xl ${solved ? "text-[#145c33]" : "text-[#7c2d12]"}`}>
          {solved ? `Bravo ! C’était ${answer.name}.` : `Raté… il fallait trouver ${answer.name}.`}
        </strong>
        <span className="text-[15px] text-muted">
          {solved
            ? `${answer.teamName} · trouvé en ${tries} essai${tries > 1 ? "s" : ""}.`
            : `${answer.teamName} · ${positionLabel(answer.position)} · ${answer.heightCm} cm · ${answer.age} ans · n°${answer.number}`}
        </span>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="min-h-11 cursor-pointer rounded-[10px] bg-accent px-[18px] text-[15px] font-bold text-white hover:brightness-95"
      >
        Rejouer
      </button>
    </div>
  );
}
