import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { parisDateKey } from "@/lib/date";
import { MAX_TRIES, type GuessFeedback, type GuessResponse, type PlayerOption, type PlayerSummary } from "@/lib/types";

type Mode = "daily" | "random";

interface GameState {
  mode: Mode;
  /** Random game id; missing for the daily player. */
  gameId?: string;
  guesses: GuessFeedback[];
  solved: boolean;
  answer?: PlayerSummary;
}

const freshDaily = (): GameState => ({ mode: "daily", guesses: [], solved: false });
const storageKey = (todayKey: string) => `handles:daily:${todayKey}`;

/** Resumes today's game saved in the browser, or starts a fresh one. */
function loadDaily(todayKey: string): GameState {
  try {
    const saved = localStorage.getItem(storageKey(todayKey));
    return saved ? (JSON.parse(saved) as GameState) : freshDaily();
  } catch {
    return freshDaily(); // storage unavailable: start from scratch
  }
}

/**
 * "Setup" store: same code as in a <script setup> (ref, computed, watch, functions),
 * returning what components are allowed to use. Every component that calls
 * useGameStore() gets the SAME instance: this state is shared across the whole app.
 */
export const useGameStore = defineStore("game", () => {
  // --- State (the useState equivalent) ---
  const todayKey = parisDateKey();
  const players = ref<PlayerOption[]>([]);
  const game = ref<GameState>(loadDaily(todayKey));
  const pending = ref(false);
  const error = ref<string | null>(null);

  // --- Derived values (getters): only recomputed when what they read changes ---
  const over = computed(() => game.value.solved || game.value.guesses.length >= MAX_TRIES);
  const guessedIds = computed(() => new Set(game.value.guesses.map((g) => g.playerId)));
  const tryNumber = computed(() => Math.min(game.value.guesses.length + (over.value ? 0 : 1), MAX_TRIES));

  // --- Side effect (the useEffect equivalent): save the game whenever it changes ---
  // `deep: true` because we mutate the object in place (guesses.push) instead of replacing it.
  watch(
    game,
    (g) => {
      if (g.mode !== "daily") return;
      try {
        localStorage.setItem(storageKey(todayKey), JSON.stringify(g));
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  );

  // --- Actions ---
  async function loadPlayers() {
    try {
      const res = await fetch("/api/players");
      if (!res.ok) throw new Error();
      players.value = (await res.json()) as PlayerOption[];
    } catch {
      error.value = "Couldn’t load the player list.";
    }
  }

  async function submit(playerId: number) {
    if (over.value || pending.value || guessedIds.value.has(playerId)) return;
    pending.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, attempt: game.value.guesses.length + 1, gameId: game.value.gameId }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as GuessResponse;
      // No need to recreate the object like in React: Vue's reactivity picks up the mutation.
      game.value.guesses.push(data.feedback);
      game.value.solved = data.solved;
      if (data.answer) game.value.answer = data.answer;
    } catch {
      error.value = "Couldn’t send your guess. Try again.";
    } finally {
      pending.value = false;
    }
  }

  function playDaily() {
    game.value = loadDaily(todayKey);
  }

  function playRandom() {
    game.value = { mode: "random", gameId: crypto.randomUUID(), guesses: [], solved: false };
  }

  return { players, game, pending, error, over, guessedIds, tryNumber, loadPlayers, submit, playDaily, playRandom };
});
