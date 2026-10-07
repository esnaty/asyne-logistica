<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <div>
        <div class="text-h4 font-weight-bold">Intervinientes</div>
        <div class="text-medium-emphasis">Proveedores remitentes, destinatarios y sus ubicaciones.</div>
      </div>
      <v-spacer />
      <v-btn color="primary" @click="router.push('/partners/form')">
        <AppIcon name="plus" class="mr-2" />Nuevo interviniente
      </v-btn>
    </div>

    <v-text-field v-model="search" label="Buscar por nombre" class="mb-4" max-width="420">
      <template #prepend-inner><AppIcon name="search" :size="18" /></template>
    </v-text-field>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card v-if="!smAndDown" border elevation="0">
      <v-data-table :headers="headers" :items="partners" :search="search" density="compact" :items-per-page="10">
        <template #item.name="{ item }">
          <div class="font-weight-medium">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.externalCode || item.taxId || "Sin referencia" }}</div>
        </template>
        <template #item.type="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip v-if="item.isSender" class="status-chip" size="small" color="secondary">Remitente</v-chip>
            <v-chip v-if="item.isRecipient" class="status-chip" size="small" color="primary">Destinatario</v-chip>
          </div>
        </template>
        <template #item.locations="{ item }">{{ locationLabel(item.locations) }}</template>
        <template #item.status="{ item }">
          <v-chip class="status-chip" size="small" :color="item.status === 'active' ? 'success' : 'warning'">
            {{ item.status === "active" ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" aria-label="Editar" @click="edit(item)"><AppIcon name="edit" :size="18" /></v-btn>
          <v-btn icon variant="text" size="small" color="danger" aria-label="Eliminar" @click="remove(item)"><AppIcon name="trash" :size="18" /></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <div v-else>
      <v-card v-for="item in mobilePartners" :key="item.id" border elevation="0" class="mb-3">
        <v-card-text class="d-flex align-start ga-3">
          <v-avatar size="42" color="primary"><AppIcon name="building" :size="20" /></v-avatar>
          <div class="flex-grow-1">
            <div class="font-weight-bold">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.externalCode || item.taxId || "Sin referencia" }}</div>
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip v-if="item.isSender" class="status-chip" size="small" color="secondary">Remitente</v-chip>
              <v-chip v-if="item.isRecipient" class="status-chip" size="small" color="primary">Destinatario</v-chip>
            </div>
            <div class="text-body-2 mt-2">{{ locationLabel(item.locations) }}</div>
          </div>
          <v-btn icon variant="text" size="small" aria-label="Editar" @click="edit(item)"><AppIcon name="edit" :size="18" /></v-btn>
        </v-card-text>
      </v-card>
      <v-pagination v-model="page" :length="pages" density="compact" size="small" />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import AppIcon from "../components/AppIcon.vue";
import { http } from "../services/http";

interface Partner {
  id: string;
  name: string;
  taxId: string | null;
  externalCode: string | null;
  isSender: boolean;
  isRecipient: boolean;
  status: "active" | "inactive";
  locations: number;
}

const router = useRouter();
const { smAndDown } = useDisplay();
const partners = ref<Partner[]>([]);
const search = ref("");
const error = ref("");
const page = ref(1);
const perPage = 6;
const headers = [
  { title: "Interviniente", key: "name" },
  { title: "Tipo", key: "type" },
  { title: "Ubicaciones", key: "locations" },
  { title: "Estado", key: "status" },
  { title: "", key: "actions", sortable: false },
];
const filtered = computed(() => partners.value.filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase())));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const mobilePartners = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage));

const locationLabel = (count: number) => count === 1 ? "1 ubicación" : `${count} ubicaciones`;
const edit = (item: Partner) => router.push(`/partners/form/${item.id}`);

async function load() {
  const { data } = await http.get<{ data: Partner[] }>("/partners");
  partners.value = data.data;
}

async function remove(item: Partner) {
  if (!window.confirm(`¿Eliminar definitivamente a ${item.name}?`)) return;
  error.value = "";
  try {
    await http.delete(`/partners/${item.id}`);
    await load();
  } catch {
    error.value = "No se pudo eliminar el interviniente.";
  }
}

watch(search, () => page.value = 1);
onMounted(load);
</script>
