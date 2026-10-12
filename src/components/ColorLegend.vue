<template>
  <div class="flex flex-wrap items-center gap-3.5 text-[13px] text-muted">
    <span class="flex items-center gap-1.5">
      <span class="size-3.5 rounded bg-ok" />
      Correct
    </span>
    <span class="flex items-center gap-1.5">
      <span class="size-3.5 rounded bg-near" />
      Close (shared position, ±5 cm, ±2 years, ±3 number)
    </span>
    <span class="flex items-center gap-1.5">
      <span class="size-3.5 rounded border border-line bg-no" />
      Wrong
    </span>
    <span>↑ ↓ the answer is higher / lower</span>
  </div>
</template>
