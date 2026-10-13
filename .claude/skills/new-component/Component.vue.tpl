<script setup lang="ts">
import { computed } from "vue";

// Data from the parent (read-only).
const props = defineProps<{
  title: string;
  count: number;
}>();

// User actions, reported to the parent.
const emit = defineEmits<{ select: [count: number] }>();

const label = computed(() => `${props.title} (${props.count})`);
</script>

<template>
  <section
    class="flex flex-col gap-3 rounded-[18px] bg-white p-5 shadow-[0_1px_2px_rgba(20,23,28,0.06),0_8px_24px_rgba(20,23,28,0.05)]"
  >
    <h2 class="text-[13px] font-bold tracking-[0.08em] text-muted uppercase">{{ label }}</h2>
    <button
      type="button"
      class="min-h-11 cursor-pointer rounded-[10px] border border-line bg-white px-4 text-sm font-semibold hover:brightness-95"
      @click="emit('select', count)"
    >
      Select
    </button>
  </section>
</template>
