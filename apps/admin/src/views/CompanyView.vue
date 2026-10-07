<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <div><div class="text-h4 font-weight-bold">Empresas</div><div class="text-medium-emphasis">Clientes logísticos de la plataforma.</div></div>
      <v-spacer />
      <v-btn color="primary" @click="router.push('/company/form')"><AppIcon name="plus" class="mr-2" />Nueva empresa</v-btn>
    </div>
    <v-text-field v-model="search" label="Buscar por nombre" class="mb-4" max-width="420"><template #prepend-inner><AppIcon name="search" :size="18" /></template></v-text-field>
    <v-card v-if="!smAndDown" border elevation="0">
      <v-data-table :items="items" :search="search" density="compact" :items-per-page="10" :headers="headers">
        <template #item.name="{ item }"><div class="d-flex align-center ga-3"><v-avatar size="36" :color="item.logoUrl ? undefined : item.primaryColor"><v-img v-if="item.logoUrl" :src="item.logoUrl" contain /><AppIcon v-else name="building" :size="18" /></v-avatar>{{ item.name }}</div></template>
        <template #item.status="{ item }"><v-chip class="status-chip" size="small" :color="item.status === 'active' ? 'success' : 'warning'">{{ statusLabel(item.status) }}</v-chip></template>
        <template #item.actions="{ item }"><v-btn icon variant="text" size="small" @click="router.push(`/company/form/${item.id}`)"><AppIcon name="edit" :size="18" /></v-btn><v-btn icon variant="text" color="danger" size="small" @click="remove(item)"><AppIcon name="trash" :size="18" /></v-btn></template>
      </v-data-table>
    </v-card>
    <div v-else>
      <v-card v-for="item in mobileItems" :key="item.id" border elevation="0" class="mb-3"><v-card-text class="d-flex align-start ga-3"><v-avatar size="44" :color="item.logoUrl ? undefined : item.primaryColor"><v-img v-if="item.logoUrl" :src="item.logoUrl" contain /><AppIcon v-else name="building" /></v-avatar><div class="flex-grow-1"><div class="font-weight-bold">{{ item.name }}</div><div class="text-caption text-medium-emphasis">{{ item.slug }} · {{ item.members }} miembros</div><v-chip class="status-chip mt-2" size="small" :color="item.status === 'active' ? 'success' : 'warning'">{{ statusLabel(item.status) }}</v-chip></div><v-btn icon variant="text" size="small" @click="router.push(`/company/form/${item.id}`)"><AppIcon name="edit" :size="18" /></v-btn></v-card-text></v-card>
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
interface Organization { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string; status: "active" | "suspended"; members: number }
const router = useRouter(); const { smAndDown } = useDisplay(); const items = ref<Organization[]>([]); const search = ref(""); const page = ref(1); const perPage = 6;
const headers = [{ title: "Empresa", key: "name" }, { title: "Identificador", key: "slug" }, { title: "Miembros", key: "members" }, { title: "Estado", key: "status" }, { title: "", key: "actions", sortable: false }];
const filtered = computed(() => items.value.filter((item) => item.name.toLowerCase().includes(search.value.toLowerCase()))); const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage))); const mobileItems = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage));
watch(search, () => page.value = 1); const statusLabel = (status: string) => status === "active" ? "Activa" : "Suspendida";
async function load() { const { data } = await http.get<{ data: Organization[] }>("/platform/organizations"); items.value = data.data; }
async function remove(item: Organization) { if (!window.confirm(`¿Eliminar definitivamente ${item.name}?`)) return; try { await http.delete(`/platform/organizations/${item.id}`); await load(); } catch { window.alert("No se puede eliminar la empresa activa."); } }
onMounted(load);
</script>
