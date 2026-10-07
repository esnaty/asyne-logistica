<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <div>
        <div class="text-h4 font-weight-bold">Roles</div>
        <div class="text-medium-emphasis">Configura los roles y las vistas disponibles para tu empresa.</div>
      </div>
      <v-spacer />
      <v-btn color="primary" @click="router.push('/roles/form')">
        <AppIcon name="plus" class="mr-2" />Nuevo rol
      </v-btn>
    </div>

    <v-text-field v-model="search" label="Buscar por nombre" class="mb-4" max-width="420">
      <template #prepend-inner><AppIcon name="search" :size="18" /></template>
    </v-text-field>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card v-if="!smAndDown" border elevation="0">
      <v-data-table :headers="headers" :items="roles" :search="search" density="compact" :items-per-page="10">
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-3">
            <v-avatar size="36" color="primary"><AppIcon name="shield" :size="18" /></v-avatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.code }}</div>
            </div>
          </div>
        </template>
        <template #item.permissions="{ item }">{{ permissionLabel(item.permissions.length) }}</template>
        <template #item.type="{ item }">
          <v-chip class="status-chip" size="small" :color="item.isSystem ? 'secondary' : 'primary'">
            {{ item.isSystem ? "Inicial" : "Personalizado" }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon variant="text" size="small" aria-label="Editar rol" @click="edit(item)">
            <AppIcon name="edit" :size="18" />
          </v-btn>
          <v-btn v-if="!item.isSystem" icon variant="text" color="danger" size="small" aria-label="Eliminar rol" @click="remove(item)">
            <AppIcon name="trash" :size="18" />
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <div v-else>
      <v-card v-for="item in mobileRoles" :key="item.code" border elevation="0" class="mb-3">
        <v-card-text class="d-flex align-start ga-3">
          <v-avatar size="42" color="primary"><AppIcon name="shield" :size="20" /></v-avatar>
          <div class="flex-grow-1">
            <div class="font-weight-bold">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.code }}</div>
            <div class="text-body-2 mt-2">{{ permissionLabel(item.permissions.length) }}</div>
            <v-chip class="status-chip mt-2" size="small" :color="item.isSystem ? 'secondary' : 'primary'">
              {{ item.isSystem ? "Inicial" : "Personalizado" }}
            </v-chip>
          </div>
          <v-btn icon variant="text" size="small" aria-label="Editar rol" @click="edit(item)">
            <AppIcon name="edit" :size="18" />
          </v-btn>
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

interface CompanyRole {
  code: string;
  name: string;
  isSystem: boolean;
  permissions: string[];
}

const router = useRouter();
const { smAndDown } = useDisplay();
const roles = ref<CompanyRole[]>([]);
const search = ref("");
const error = ref("");
const page = ref(1);
const perPage = 6;
const headers = [
  { title: "Rol", key: "name" },
  { title: "Permisos", key: "permissions" },
  { title: "Tipo", key: "type" },
  { title: "", key: "actions", sortable: false },
];
const filtered = computed(() => roles.value.filter((role) => role.name.toLowerCase().includes(search.value.toLowerCase())));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const mobileRoles = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage));

function permissionLabel(count: number) {
  return count === 1 ? "1 vista permitida" : `${count} vistas permitidas`;
}

function edit(role: CompanyRole) {
  router.push(`/roles/form/${role.code}`);
}

async function load() {
  const { data } = await http.get<{ company: CompanyRole[] }>("/roles");
  roles.value = data.company;
}

async function remove(role: CompanyRole) {
  if (!window.confirm(`¿Eliminar el rol ${role.name}?`)) return;
  error.value = "";
  try {
    await http.delete(`/roles/company/${role.code}`);
    await load();
  } catch {
    error.value = "No se puede eliminar porque el rol está asignado a uno o más usuarios.";
  }
}

watch(search, () => page.value = 1);
onMounted(load);
</script>
