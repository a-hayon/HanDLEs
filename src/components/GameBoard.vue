<script setup lang="ts">
import { MAX_TRIES } from "@/lib/types";
import { useGameStore } from "../stores/game";
import ColorLegend from "./ColorLegend.vue";
import EndBanner from "./EndBanner.vue";
import GuessGrid from "./GuessGrid.vue";
import GuessInput from "./GuessInput.vue";

// L'état de la partie vit dans le store Pinia : ce composant se contente de l'afficher.
const store = useGameStore();

/** Couleur de la pastille n°i (0 à 7) dans la barre de progression. */
function dotColor(i: number): string {
  const { guesses, solved } = store.game;
  if (!guesses[i]) return "bg-line";
  return i === guesses.length - 1 && solved ? "bg-ok" : "bg-accent";
}

const btn =
  "min-h-11 cursor-pointer rounded-[10px] border border-line bg-white px-4 text-sm font-semibold hover:brightness-95";
</script>

<template>
  <section
    class="flex flex-col gap-4 rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(20,23,28,0.06),0_8px_24px_rgba(20,23,28,0.05)]"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="text-[13px] font-bold tracking-[0.08em] text-muted uppercase">
          {{ store.game.mode === "daily" ? "Joueur du jour" : "Partie aléatoire" }}
        </span>
        <div class="flex gap-[5px]" aria-hidden="true">
          <!-- v-for sur un nombre : i va de 1 à MAX_TRIES -->
          <span v-for="i in MAX_TRIES" :key="i" class="size-2.5 rounded-full" :class="dotColor(i - 1)" />
        </div>
        <span class="text-sm text-muted">Essai {{ store.tryNumber }} / {{ MAX_TRIES }}</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" :class="btn" @click="store.playDaily">Joueur du jour</button>
        <button type="button" :class="btn" @click="store.playRandom">Partie aléatoire</button>
      </div>
    </div>

    <GuessInput
      v-if="!store.over"
      :options="store.players"
      :excluded="store.guessedIds"
      :disabled="store.pending"
      @pick="store.submit"
    />
    <p v-if="store.error" class="text-sm text-accent">{{ store.error }}</p>

    <EndBanner
      v-if="store.over && store.game.answer"
      :solved="store.game.solved"
      :answer="store.game.answer"
      :tries="store.game.guesses.length"
      @replay="store.playRandom"
    />

    <ColorLegend />
  </section>

  <GuessGrid :guesses="store.game.guesses" />
</template>
