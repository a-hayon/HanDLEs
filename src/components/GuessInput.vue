<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { normalize } from "@/lib/format";
import type { PlayerOption } from "@/lib/types";

const props = defineProps<{
  options: PlayerOption[];
  excluded: Set<number>;
  disabled?: boolean;
}>();
// Instead of receiving an `onPick` function as a prop (React), the component emits an event.
const emit = defineEmits<{ pick: [playerId: number] }>();

const query = ref("");
const active = ref(0);
const inputId = useId();
const listId = useId();

const suggestions = computed(() => {
  const q = normalize(query.value.trim());
  if (!q) return [];
  return props.options.filter((o) => !props.excluded.has(o.id) && normalize(o.name).includes(q)).slice(0, 6);
});
const open = computed(() => suggestions.value.length > 0);

function pick(o: PlayerOption) {
  emit("pick", o.id);
  query.value = "";
  active.value = 0;
}

function move(delta: number) {
  active.value = Math.max(Math.min(active.value + delta, suggestions.value.length - 1), 0);
}

function pickActive() {
  const o = suggestions.value[active.value];
  if (o) pick(o);
}
</script>

<template>
  <div class="relative flex flex-col gap-1.5">
    <label :for="inputId" class="text-sm font-semibold text-[#2b2f38]">Pick a player</label>
    <!--
      v-model = :value + @input in a single directive.
      The .down/.up/.enter modifiers filter the key, .prevent calls preventDefault().
    -->
    <input
      :id="inputId"
      v-model="query"
      type="text"
      autocomplete="off"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open ? `${listId}-${active}` : undefined"
      placeholder="Type a name… e.g. Wembanyama"
      :disabled="disabled"
      class="min-h-[52px] w-full rounded-xl border-[1.5px] border-line bg-[#fafafb] px-4 text-[17px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20 disabled:opacity-60"
      @input="active = 0"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="pickActive"
      @keydown.esc="query = ''"
    />
    <ul
      v-if="open"
      :id="listId"
      role="listbox"
      class="absolute top-full right-0 left-0 z-10 mt-1.5 overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_32px_rgba(20,23,28,0.14)]"
    >
      <li
        v-for="(o, i) in suggestions"
        :id="`${listId}-${i}`"
        :key="o.id"
        role="option"
        :aria-selected="i === active"
        class="flex min-h-12 cursor-pointer items-center justify-between gap-3 border-b border-[#eef0f3] px-4 last:border-b-0"
        :class="{ 'bg-accent-soft': i === active }"
        @mousedown.prevent="pick(o)"
        @mouseenter="active = i"
      >
        <span class="text-base font-semibold">{{ o.name }}</span>
        <span class="text-[13px] text-[#5a606c]">{{ o.teamName }}</span>
      </li>
    </ul>
    <span v-else-if="query.trim().length > 1" class="text-[13px] text-[#5a606c]">
      No player found (or already guessed).
    </span>
  </div>
</template>
