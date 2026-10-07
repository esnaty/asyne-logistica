<template>
  <v-container class="pa-4 pb-16">
    <div class="text-h5 font-weight-bold mb-1">Trabajo asignado</div>
    <div class="text-medium-emphasis mb-5">Picking y carga del día.</div>

    <v-card elevation="0" border>
      <v-card-text class="py-8 text-center">
        <v-icon icon="mdi-package-variant-closed" size="56" color="primary" />
        <div class="text-h6 mt-3">Sin tareas pendientes</div>
        <div class="text-medium-emphasis mt-1">
          Las tareas descargadas aparecerán aquí.
        </div>
      </v-card-text>
    </v-card>

    <v-btn block color="primary" class="mt-4" prepend-icon="mdi-qrcode-scan">
      Escanear lote
    </v-btn>
  </v-container>
</template>
