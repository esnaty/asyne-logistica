<template>
  <v-container fluid class="pa-4 pa-md-6">
    <div class="d-flex align-center flex-wrap ga-3 mb-5">
      <div>
        <div class="text-h4 font-weight-bold">Productos</div>
        <div class="text-medium-emphasis">Catálogo operativo de mercancías y códigos de identificación.</div>
      </div>
      <v-spacer />
      <v-btn color="primary" @click="router.push('/products/form')">
        <AppIcon name="plus" class="mr-2" />Nuevo producto
      </v-btn>
    </div>

    <div class="d-flex flex-wrap ga-3 mb-4">
      <v-text-field v-model="search" label="Buscar por nombre o SKU" max-width="420">
        <template #prepend-inner><AppIcon name="search" :size="18" /></template>
      </v-text-field>
      <v-select v-model="statusFilter" label="Estado" :items="statusOptions" clearable max-width="220" />
      <v-select v-model="categoryFilter" label="Categoría" :items="categories" clearable max-width="260" />
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <v-card v-if="!smAndDown" border elevation="0">
      <v-data-table :headers="headers" :items="filtered" density="compact" :items-per-page="10">
        <template #item.name="{ item }">
          <div class="font-weight-medium">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">SKU: {{ item.sku }}</div>
        </template>
        <template #item.category="{ item }">{{ item.category || "Sin categoría" }}</template>
        <template #item.unit="{ item }">{{ unitLabel(item.unit) }}</template>
        <template #item.supplierName="{ item }">{{ item.supplierName || "Sin proveedor" }}</template>
        <template #item.codes="{ item }">{{ codeLabel(item.codes) }}</template>
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
      <v-card v-for="item in mobileProducts" :key="item.id" border elevation="0" class="mb-3">
        <v-card-text class="d-flex align-start ga-3">
          <v-avatar size="42" color="primary"><AppIcon name="package" :size="20" /></v-avatar>
          <div class="flex-grow-1 min-width-0">
            <div class="font-weight-bold">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">SKU: {{ item.sku }}</div>
            <div class="text-body-2 mt-2">{{ item.category || "Sin categoría" }} · {{ unitLabel(item.unit) }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.supplierName || "Sin proveedor" }} · {{ codeLabel(item.codes) }}</div>
            <v-chip class="status-chip mt-2" size="small" :color="item.status === 'active' ? 'success' : 'warning'">
              {{ item.status === "active" ? "Activo" : "Inactivo" }}
            </v-chip>
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

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  supplierName: string | null;
  codes: number;
  status: "active" | "inactive";
}

const router = useRouter();
const { smAndDown } = useDisplay();
const products = ref<Product[]>([]);
const search = ref("");
const statusFilter = ref<string | null>(null);
const categoryFilter = ref<string | null>(null);
const error = ref("");
const page = ref(1);
const perPage = 6;
const statusOptions = [{ title: "Activo", value: "active" }, { title: "Inactivo", value: "inactive" }];
const headers = [
  { title: "Producto", key: "name" },
  { title: "Categoría", key: "category" },
  { title: "Unidad", key: "unit" },
  { title: "Proveedor", key: "supplierName" },
  { title: "Códigos", key: "codes" },
  { title: "Estado", key: "status" },
  { title: "", key: "actions", sortable: false },
];
const categories = computed(() => [...new Set(products.value.map((item) => item.category).filter(Boolean) as string[])].sort());
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  return products.value.filter((item) => {
    const matchesText = !term || item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term);
    return matchesText && (!statusFilter.value || item.status === statusFilter.value) && (!categoryFilter.value || item.category === categoryFilter.value);
  });
});
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const mobileProducts = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage));
const unitLabels: Record<string, string> = { unit: "Unidad", box: "Caja", tire: "Neumático", pallet: "Palé", kilogram: "Kilogramo", liter: "Litro" };
const unitLabel = (unit: string) => unitLabels[unit] || unit;
const codeLabel = (count: number) => count === 1 ? "1 código" : `${count} códigos`;
const edit = (item: Product) => router.push(`/products/form/${item.id}`);

async function load() {
  error.value = "";
  try {
    const { data } = await http.get<{ data: Product[] }>("/products");
    products.value = data.data;
  } catch {
    error.value = "No se pudo cargar el catálogo de productos.";
  }
}

async function remove(item: Product) {
  if (!window.confirm(`¿Eliminar definitivamente ${item.name}?`)) return;
  error.value = "";
  try {
    await http.delete(`/products/${item.id}`);
    await load();
  } catch {
    error.value = "No se pudo eliminar el producto.";
  }
}

watch([search, statusFilter, categoryFilter], () => page.value = 1);
onMounted(load);
</script>
