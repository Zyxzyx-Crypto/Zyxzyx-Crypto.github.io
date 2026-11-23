<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 24 },
})

const icons = {
  chip: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M7 7h10v10H7z',
  board: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 4v4m0 2v4m6-10v4m0 2v4m6-10v4',
  gpu: 'M3 7h18v6H3zM7 13v4M13 13v4M19 13v4M8 9h.01M12 9h.01M16 9h.01',
  ram: 'M4 8h16v8H4zM8 8v8M16 8v8M5 8V6m0 14v-2M19 8V6m0 14v-2',
  drive: 'M5 8h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zm7 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6-4h.01',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
  fan: 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0c1.5-3 4.5-3 6-2m-6 2c1.5 3 4.5 3 6 2m-6-2c-1.5-3-4.5-3-6-2m6 2c-1.5 3-4.5 3-6 2',
  box: 'M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0l8 4m0 0l8-4m-8 4v10m4-14l-4 2-4-2',
}

const d = computed(() => icons[props.name] || icons.chip)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="d" />
  </svg>
</template>