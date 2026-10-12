<script setup lang="ts">
import { positionLabel } from "@/lib/format";
import type { Cell, GuessFeedback, Verdict } from "@/lib/types";

defineProps<{ guesses: GuessFeedback[] }>();

const COLUMNS = ["Équipe", "Conf.", "Division", "Poste", "Taille", "Âge", "N°"];
const GRID = "grid grid-cols-[1.7fr_repeat(7,minmax(0,1fr))] gap-2";

const VERDICT_CLASS: Record<Verdict, string> = {
  correct: "bg-ok text-white",
  near: "bg-near text-near-ink",
  wrong: "bg-no text-no-ink",
};
const VERDICT_LABEL: Record<Verdict, string> = { correct: "correct", near: "proche", wrong: "faux" };

/** Texte affiché dans une case : valeur formatée + flèche éventuelle. */
function cellText(cell: Cell<string | number>, display = String(cell.value)) {
  const arrow = cell.direction === "up" ? " ↑" : cell.direction === "down" ? " ↓" : "";
  return display + arrow;
}

/** Les 7 cases d'une ligne : [libellé, case, texte affiché]. */
function cells(g: GuessFeedback): [string, Cell<string | number>, string][] {
  return [
    ["Équipe", g.team, cellText(g.team)],
    ["Conférence", g.conference, cellText(g.conference)],
    ["Division", g.division, cellText(g.division)],
    ["Poste", g.position, cellText(g.position, positionLabel(g.position.value))],
    ["Taille", g.height, cellText(g.height, `${g.height.value} cm`)],
    ["Âge", g.age, cellText(g.age, `${g.age.value} ans`)],
    ["Numéro", g.number, cellText(g.number)],
  ];
}
</script>

<template>
  <section class="overflow-x-auto">
    <div class="flex min-w-[780px] flex-col gap-2">
      <div :class="GRID" class="px-0.5 text-xs font-bold tracking-[0.08em] text-[#5a606c] uppercase">
        <span>Joueur</span>
        <span v-for="c in COLUMNS" :key="c" class="text-center">{{ c }}</span>
      </div>

      <div
        v-if="guesses.length === 0"
        class="rounded-[14px] border-2 border-dashed border-line p-7 text-center text-[15px] text-[#5a606c]"
      >
        Tes essais apparaîtront ici. Commence par n’importe quel joueur !
      </div>

      <div v-for="g in guesses" :key="g.playerId" :class="GRID" class="[perspective:600px]">
        <div
          class="flex min-h-[60px] flex-col justify-center gap-0.5 rounded-xl border border-[#e1e4e9] bg-white px-3.5 py-2"
        >
          <span class="text-[15px] leading-tight font-bold">{{ g.name }}</span>
          <span class="text-xs text-[#5a606c]">{{ g.teamName }}</span>
        </div>
        <div
          v-for="([label, cell, text], k) in cells(g)"
          :key="label"
          :aria-label="`${label} : ${text}, ${VERDICT_LABEL[cell.verdict]}`"
          :style="{ animationDelay: `${k * 90}ms` }"
          class="flex min-h-[60px] animate-flip items-center justify-center rounded-xl p-1.5 text-center text-sm leading-tight font-bold"
          :class="VERDICT_CLASS[cell.verdict]"
        >
          {{ text }}
        </div>
      </div>
    </div>
  </section>
</template>
