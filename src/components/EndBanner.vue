<script setup lang="ts">
import { computed } from "vue";
import { positionLabel } from "@/lib/format";
import type { PlayerSummary } from "@/lib/types";

// Props = data received from the parent (read-only). Emits = events sent to the parent.
const props = defineProps<{
  solved: boolean;
  answer: PlayerSummary;
  tries: number;
}>();
const emit = defineEmits<{ replay: [] }>();

const title = computed(() =>
  props.solved ? `Nice! It was ${props.answer.name}.` : `Out of tries… it was ${props.answer.name}.`,
);

const details = computed(() => {
  const a = props.answer;
  return props.solved
    ? `${a.teamName} · found in ${props.tries} ${props.tries > 1 ? "tries" : "try"}.`
    : `${a.teamName} · ${positionLabel(a.position)} · ${a.heightCm} cm · ${a.age} years old · #${a.number}`;
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
      Play again
    </button>
  </div>
</template>
