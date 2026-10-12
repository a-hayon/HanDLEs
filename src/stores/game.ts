import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { parisDateKey } from "@/lib/date";
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

/** Reprend la partie du jour sauvegardée dans le navigateur, sinon une partie neuve. */
function loadDaily(todayKey: string): GameState {
  try {
    const saved = localStorage.getItem(storageKey(todayKey));
    return saved ? (JSON.parse(saved) as GameState) : freshDaily();
  } catch {
    return freshDaily(); // stockage indisponible : on repart de zéro
  }
}

/**
 * Store « setup » : on écrit le même code que dans un <script setup> (ref, computed, watch, fonctions)
 * et on retourne ce que les composants ont le droit d'utiliser. Tout composant qui appelle
 * useGameStore() reçoit la MÊME instance : c'est un état partagé par toute l'application.
 */
export const useGameStore = defineStore("game", () => {
  // --- État (équivalent de useState) ---
  const todayKey = parisDateKey();
  const players = ref<PlayerOption[]>([]);
  const game = ref<GameState>(loadDaily(todayKey));
  const pending = ref(false);
  const error = ref<string | null>(null);

  // --- Valeurs dérivées (getters) : recalculées seulement quand ce qu'elles lisent change ---
  const over = computed(() => game.value.solved || game.value.guesses.length >= MAX_TRIES);
  const guessedIds = computed(() => new Set(game.value.guesses.map((g) => g.playerId)));
  const tryNumber = computed(() => Math.min(game.value.guesses.length + (over.value ? 0 : 1), MAX_TRIES));

  // --- Effet de bord (équivalent de useEffect) : sauvegarde à chaque modification de la partie ---
  // `deep: true` car on modifie l'objet sur place (guesses.push) au lieu de le remplacer.
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
      error.value = "Impossible de charger la liste des joueurs.";
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
      // Pas besoin de recréer l'objet comme en React : la réactivité de Vue détecte la mutation.
      game.value.guesses.push(data.feedback);
      game.value.solved = data.solved;
      if (data.answer) game.value.answer = data.answer;
    } catch {
      error.value = "Impossible d’envoyer l’essai. Réessaie.";
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
