<script setup lang="ts">
import { onMounted } from "vue";
import GameBoard from "./components/GameBoard.vue";
import { useGameStore } from "./stores/game";

const store = useGameStore();

// page.tsx (a server component) used to build this list. Here we fetch it from the API on mount.
onMounted(() => store.loadPlayers());
</script>

<template>
  <main class="min-h-screen px-4 pt-10 pb-16">
    <div class="mx-auto flex max-w-[1000px] flex-col gap-7">
      <header class="flex flex-col items-center gap-2 text-center">
        <div class="flex items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            class="text-accent"
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="17" />
            <path d="M3 20h34M20 3v34M8 8c5 4 5 20 0 24M32 8c-5 4-5 20 0 24" />
          </svg>
          <h1 class="text-5xl leading-none font-black tracking-tight [font-stretch:112%]">
            Han<span class="text-accent">DLE</span>s
          </h1>
        </div>
        <p class="text-[17px] text-muted">Guess the mystery NBA player in 8 tries.</p>
      </header>

      <GameBoard />

      <footer class="text-center text-[13px] text-muted">
        {{ store.players.length }} players · 2025-26 end-of-season rosters
      </footer>
    </div>
  </main>
</template>
