<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path v-for="x in p[name] || p.user" :key="x" :d="x" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 });
const p: Record<string, string[]> = {
  package: [
    "M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
    "m3.3 7 8.7 5 8.7-5",
    "M12 22V12",
  ],
  route: ["M6 19V5", "M18 19V5", "M6 12h8a4 4 0 0 1 4 4"],
  building: [
    "M3 21h18",
    "M6 21V5h12v16",
    "M9 8h1",
    "M14 8h1",
    "M9 12h1",
    "M14 12h1",
  ],
  logout: [
    "M10 17l5-5-5-5",
    "M15 12H3",
    "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",
  ],
  user: [
    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  ],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronUp: ["m18 15-6-6-6 6"],
  check: ["m5 12 4 4L19 6"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  warning: ["M12 9v4", "M12 17h.01", "M21 21H3L12 3z"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  circle: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20"],
  square: ["M3 3h18v18H3z"],
};
</script>
