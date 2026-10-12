<script setup lang="ts">
import { computed } from "vue";
import { positionLabel } from "@/lib/format";
import type { PlayerSummary } from "@/lib/types";

// Props = données reçues du parent (lecture seule). Emits = événements envoyés au parent.
const props = defineProps<{
  solved: boolean;
  answer: PlayerSummary;
  tries: number;
}>();
const emit = defineEmits<{ replay: [] }>();

const title = computed(() =>
  props.solved ? `Bravo ! C’était ${props.answer.name}.` : `Raté… il fallait trouver ${props.answer.name}.`,
);

const details = computed(() => {
  const a = props.answer;
  return props.solved
    ? `${a.teamName} · trouvé en ${props.tries} essai${props.tries > 1 ? "s" : ""}.`
    : `${a.teamName} · ${positionLabel(a.position)} · ${a.heightCm} cm · ${a.age} ans · n°${a.number}`;
});
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-5 py-[18px]"
    :class="solved ? 'bg-[#e7f5ec]' : 'bg-[#fcede6]'"
  >
    <div class="flex flex-col gap-1">
      <strong class="text-xl" :class="solved ? 'text-[#145c33]' : 'text-[#7c2d12]'">{{ title }}</strong>
      <span class="text-[15px] text-muted">{{ details }}</span>
    </div>
    <button
      type="button"
      class="min-h-11 cursor-pointer rounded-[10px] bg-accent px-[18px] text-[15px] font-bold text-white hover:brightness-95"
      @click="emit('replay')"
    >
      Rejouer
    </button>
  </div>
</template>
