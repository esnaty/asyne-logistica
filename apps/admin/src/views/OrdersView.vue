<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h4 font-weight-bold">Pedidos</div>
        <div class="text-medium-emphasis">
          Gestión y seguimiento de pedidos.
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus">Nuevo pedido</v-btn>
    </div>

    <v-card rounded="lg" elevation="0" border>
      <v-card-text class="text-center py-12 text-medium-emphasis">
        Todavía no hay pedidos registrados.
      </v-card-text>
    </v-card>
  </v-container>
</template>
