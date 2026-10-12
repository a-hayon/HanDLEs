<script setup lang="ts">
import { positionLabel } from "@/lib/format";
import type { Cell, GuessFeedback, Verdict } from "@/lib/types";

defineProps<{ guesses: GuessFeedback[] }>();

/** Table layout, from the `lg` breakpoint (1024px) up: player + 7 criteria on one row. */
const TABLE_ROW = "lg:grid lg:grid-cols-[1.7fr_repeat(7,minmax(0,1fr))] lg:gap-2";

const VERDICT_CLASS: Record<Verdict, string> = {
  correct: "bg-ok text-white",
  near: "bg-near text-near-ink",
  wrong: "bg-no text-no-ink",
};
const VERDICT_LABEL: Record<Verdict, string> = { correct: "correct", near: "close", wrong: "wrong" };

interface CellView {
  /** Short label: column header (table) or label above the value (cards). */
  short: string;
  /** Full label, read by screen readers. */
  label: string;
  cell: Cell<string | number>;
  text: string;
  /** Position in the row (0 to 6), used to stagger the flip animation. */
  index: number;
  /** Relative width on mobile: short values (team code, East/West) need less room. */
  grow: string;
}

/** Column headers, in the same order as the cells of a row. */
const COLUMNS = ["Team", "Conf.", "Division", "Position", "Height", "Age", "No."];

/** Text shown in a cell: formatted value + optional arrow. */
function cellText(cell: Cell<string | number>, display = String(cell.value)) {
  const arrow = cell.direction === "up" ? " ↑" : cell.direction === "down" ? " ↓" : "";
  return display + arrow;
}

/** The 7 cells of a row, split in 2 lines for mobile: 4 categorical criteria, then 3 numeric ones. */
function cellRows(g: GuessFeedback): CellView[][] {
  const all: Omit<CellView, "index">[] = [
    { short: "Team", label: "Team", cell: g.team, text: cellText(g.team), grow: "flex-[0.8]" },
    { short: "Conf.", label: "Conference", cell: g.conference, text: cellText(g.conference), grow: "flex-[0.9]" },
    { short: "Division", label: "Division", cell: g.division, text: cellText(g.division), grow: "flex-[1.15]" },
    {
      short: "Position",
      label: "Position",
      cell: g.position,
      text: cellText(g.position, positionLabel(g.position.value)),
      grow: "flex-[1.15]",
    },
    {
      short: "Height",
      label: "Height",
      cell: g.height,
      text: cellText(g.height, `${g.height.value} cm`),
      grow: "flex-1",
    },
    { short: "Age", label: "Age", cell: g.age, text: cellText(g.age), grow: "flex-1" },
    { short: "No.", label: "Number", cell: g.number, text: cellText(g.number), grow: "flex-1" },
  ];
  const withIndex = all.map((c, index) => ({ ...c, index }));
  return [withIndex.slice(0, 4), withIndex.slice(4)];
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <!-- Column headers: only in table layout (on cards, each cell carries its own label). -->
    <div :class="TABLE_ROW" class="hidden px-0.5 text-xs font-bold tracking-[0.08em] text-[#5a606c] uppercase">
      <span>Player</span>
      <span v-for="c in COLUMNS" :key="c" class="text-center">{{ c }}</span>
    </div>

    <div
      v-if="guesses.length === 0"
      class="rounded-[14px] border-2 border-dashed border-line p-7 text-center text-[15px] text-[#5a606c]"
    >
      Your guesses will show up here. Start with any player!
    </div>

    <!--
      One guess = a card on mobile (player on top, then the cells over 2 lines),
      and a table row from lg up (TABLE_ROW).
    -->
    <div
      v-for="g in guesses"
      :key="g.playerId"
      :class="TABLE_ROW"
      class="flex flex-col gap-1.5 rounded-[14px] bg-white/60 p-1.5 [perspective:600px] lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <div
        class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-xl border border-[#e1e4e9] bg-white px-3.5 py-2 lg:min-h-[60px] lg:flex-col lg:flex-nowrap lg:items-start lg:justify-center"
      >
        <span class="text-[15px] leading-tight font-bold">{{ g.name }}</span>
        <span class="text-xs text-[#5a606c]">{{ g.teamName }}</span>
      </div>

      <!--
        On mobile, 2 flex lines (4 categorical cells, then 3 numeric ones).
        From lg up, `lg:contents` removes these wrappers so the cells become
        direct children of the table row.
      -->
      <div class="flex flex-col gap-1.5 lg:contents">
        <div v-for="(row, r) in cellRows(g)" :key="r" class="flex gap-1.5 [perspective:600px] lg:contents">
          <div
            v-for="c in row"
            :key="c.label"
            :aria-label="`${c.label}: ${c.text}, ${VERDICT_LABEL[c.cell.verdict]}`"
            :style="{ animationDelay: `${c.index * 90}ms` }"
            class="flex min-h-[52px] min-w-0 animate-flip flex-col items-center justify-center gap-0.5 rounded-xl p-1.5 text-center text-[13px] leading-tight font-bold break-words lg:min-h-[60px] lg:text-sm"
            :class="[VERDICT_CLASS[c.cell.verdict], c.grow]"
          >
            <span class="text-[10px] font-semibold tracking-[0.06em] uppercase opacity-75 lg:hidden" aria-hidden="true">
              {{ c.short }}
            </span>
            <span>{{ c.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
