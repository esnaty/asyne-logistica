<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-for="path in paths[props.name] || paths.user"
      :key="path"
      :d="path"
    />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number }>(), {
  size: 20,
});
const paths: Record<string, string[]> = {
  menu: ["M4 12h16", "M4 6h16", "M4 18h16"],
  logout: [
    "M10 17l5-5-5-5",
    "M15 12H3",
    "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",
  ],
  dashboard: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  package: [
    "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
    "m3.3 7 8.7 5 8.7-5",
    "M12 22V12",
  ],
  building: [
    "M3 21h18",
    "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
    "M9 7h1",
    "M14 7h1",
    "M9 11h1",
    "M14 11h1",
    "M9 15h1",
    "M14 15h1",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", "m9 12 2 2 4-4"],
  route: ["M6 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M18 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M6 16V8a3 3 0 0 1 3-3h6", "m12 2 3 3-3 3"],
  mapPin: ["M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0", "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6"],
  monitor: [
    "M20 3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2",
    "M8 21h8",
    "M12 17v4",
  ],
  plus: ["M12 5v14", "M5 12h14"],
  edit: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6", "M10 11v5", "M14 11v5"],
  arrowLeft: ["m15 18-6-6 6-6"],
  camera: [
    "M14.5 4 16 6h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2z",
    "M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  ],
  user: [
    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  ],
  search: ["m21 21-4.35-4.35", "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16"],
  close: ["M18 6 6 18", "M6 6l12 12"],
  check: ["m5 12 4 4L19 6"],
  warning: ["M12 9v4", "M12 17h.01", "M21 21H3L12 3z"],
  info: ["M12 16v-4", "M12 8h.01", "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20"],
  chevronLeft: ["m15 18-6-6 6-6"],
  chevronRight: ["m9 18 6-6-6-6"],
  chevronDown: ["m6 9 6 6 6-6"],
  chevronUp: ["m18 15-6-6-6 6"],
  arrowUp: ["M12 19V5", "m5 12 7-7 7 7"],
  arrowDown: ["M12 5v14", "m19 12-7 7-7-7"],
  minus: ["M5 12h14"],
  calendar: [
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2",
  ],
  upload: ["M12 3v12", "m7 8 5-5 5 5", "M5 21h14"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16h16V8z", "M14 2v6h6"],
  square: ["M3 3h18v18H3z"],
  squareCheck: [
    "M9 11l3 3L22 4",
    "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  ],
  squareMinus: ["M5 12h14", "M3 3h18v18H3z"],
  circle: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20"],
  circleDot: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  ],
  chevronsUpDown: ["m7 15 5 5 5-5", "m7 9 5-5 5 5"],
  chevronsLeft: ["m11 17-5-5 5-5", "m18 17-5-5 5-5"],
  chevronsRight: ["m13 17 5-5-5-5", "m6 17 5-5-5-5"],
};
</script>
