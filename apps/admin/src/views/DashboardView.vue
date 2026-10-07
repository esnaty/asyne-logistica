<template>
  <v-container fluid class="pa-6">
    <div class="text-h4 font-weight-bold mb-1">Resumen operativo</div>
    <div class="text-medium-emphasis mb-6">
      Panel de administración preparado.
    </div>

    <v-row>
      <v-col v-for="item in metrics" :key="item.label" cols="12" sm="6" lg="3">
        <v-card rounded="lg" elevation="0" border>
          <v-card-text>
            <div class="text-medium-emphasis">{{ item.label }}</div>
            <div class="text-h4 font-weight-bold mt-2">{{ item.value }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const metrics = [
  { label: "Pedidos de hoy", value: 0 },
  { label: "Rutas activas", value: 0 },
  { label: "Unidades preparadas", value: 0 },
  { label: "Incidencias", value: 0 },
];
</script>
