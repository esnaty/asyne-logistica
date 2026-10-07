<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="text-h4 font-weight-bold">{{ title }}</div>
    <div class="text-medium-emphasis mb-5">{{ description }}</div>
    <v-card border elevation="0">
      <v-card-text class="py-12 text-center text-medium-emphasis">
        Esta vista está preparada para el próximo CRUD.
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const title = computed(() => String(route.meta.title || "Vista"));
const description = computed(() => String(route.meta.description || ""));
</script>
