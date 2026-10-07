<template>
  <v-container class="pa-4 pa-md-6" max-width="1050">
    <v-btn variant="text" class="mb-4" @click="router.push('/products')">
      <AppIcon name="arrowLeft" class="mr-2" />Volver
    </v-btn>
    <div class="text-h4 font-weight-bold mb-6">{{ id ? "Editar producto" : "Nuevo producto" }}</div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-form ref="formRef" @submit.prevent="save">
      <v-card border elevation="0" class="mb-5">
        <v-card-title class="pa-6 pb-2">Datos generales</v-card-title>
        <v-card-text class="pa-6 pt-3">
          <v-row>
            <v-col cols="12" md="4"><v-text-field v-model="form.sku" label="SKU o referencia" :rules="[requiredRule]" /></v-col>
            <v-col cols="12" md="8"><v-text-field v-model="form.name" label="Nombre" :rules="[requiredRule]" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model="form.category" label="Categoría" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.unit" label="Unidad logística" :items="unitOptions" /></v-col>
            <v-col cols="12" md="4"><v-select v-model="form.status" label="Estado" :items="statusOptions" /></v-col>
            <v-col cols="12"><v-select v-model="form.supplierId" label="Proveedor habitual" :items="suppliers" item-title="name" item-value="id" clearable /></v-col>
            <v-col cols="12"><v-textarea v-model="form.description" label="Descripción" rows="3" /></v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card border elevation="0" class="mb-5">
        <v-card-title class="pa-6 pb-2">Peso y dimensiones</v-card-title>
        <v-card-subtitle class="px-6">Datos opcionales que utilizaremos para capacidad y optimización de carga.</v-card-subtitle>
        <v-card-text class="pa-6 pt-4">
          <v-row>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="form.weightKg" label="Peso (kg)" type="number" min="0" step="0.001" /></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="form.lengthCm" label="Largo (cm)" type="number" min="0" step="0.01" /></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="form.widthCm" label="Ancho (cm)" type="number" min="0" step="0.01" /></v-col>
            <v-col cols="12" sm="6" md="3"><v-text-field v-model.number="form.heightCm" label="Alto (cm)" type="number" min="0" step="0.01" /></v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card border elevation="0" class="mb-5">
        <v-card-title class="d-flex align-center pa-6 pb-2">
          <div>
            <div>Códigos de identificación</div>
            <div class="text-body-2 text-medium-emphasis font-weight-regular">Códigos de barras, QR y referencias que identifican este producto.</div>
          </div>
          <v-spacer />
          <v-btn variant="outlined" color="primary" @click="addCode"><AppIcon name="plus" class="mr-2" />Añadir código</v-btn>
        </v-card-title>
        <v-card-text class="pa-6 pt-4">
          <v-alert v-if="!form.codes.length" type="info" variant="tonal">El producto todavía no tiene códigos alternativos.</v-alert>
          <v-row v-for="(code, index) in form.codes" :key="code.localId" align="center">
            <v-col cols="12" md="5"><v-text-field v-model="code.code" label="Código" :rules="[requiredRule]" /></v-col>
            <v-col cols="8" md="3"><v-select v-model="code.type" label="Tipo" :items="codeTypeOptions" /></v-col>
            <v-col cols="3" md="3"><v-checkbox v-model="code.isPrimary" label="Principal" @update:model-value="setPrimary(index)" /></v-col>
            <v-col cols="1"><v-btn icon variant="text" size="small" color="danger" aria-label="Eliminar código" @click="removeCode(index)"><AppIcon name="trash" :size="18" /></v-btn></v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-end ga-3">
        <v-btn variant="outlined" @click="router.push('/products')">Cancelar</v-btn>
        <v-btn color="primary" type="submit" :loading="saving">Guardar</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import { http } from "../services/http";

type CodeType = "barcode" | "qr" | "supplier" | "other";
interface ProductCode { localId: string; code: string; type: CodeType; isPrimary: boolean }
interface Supplier { id: string; name: string; isSender: boolean; status: "active" | "inactive" }
interface ProductDetail {
  supplierId: string | null;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  weightKg: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  status: "active" | "inactive";
  codes: Array<Omit<ProductCode, "localId">>;
}

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === "string" ? route.params.id : null;
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const saving = ref(false);
const error = ref("");
const suppliers = ref<Supplier[]>([]);
const requiredRule = (value: string) => value?.trim().length >= 2 || "Introduce al menos 2 caracteres.";
const unitOptions = [
  { title: "Unidad", value: "unit" }, { title: "Caja", value: "box" }, { title: "Neumático", value: "tire" },
  { title: "Palé", value: "pallet" }, { title: "Kilogramo", value: "kilogram" }, { title: "Litro", value: "liter" },
];
const statusOptions = [{ title: "Activo", value: "active" }, { title: "Inactivo", value: "inactive" }];
const codeTypeOptions = [
  { title: "Código de barras", value: "barcode" }, { title: "Código QR", value: "qr" },
  { title: "Referencia del proveedor", value: "supplier" }, { title: "Otro", value: "other" },
];
const form = reactive({
  supplierId: null as string | null,
  sku: "",
  name: "",
  description: "",
  category: "",
  unit: "unit",
  weightKg: null as number | null,
  lengthCm: null as number | null,
  widthCm: null as number | null,
  heightCm: null as number | null,
  status: "active" as "active" | "inactive",
  codes: [] as ProductCode[],
});

function addCode() {
  form.codes.push({ localId: crypto.randomUUID(), code: "", type: "barcode", isPrimary: !form.codes.length });
}

function removeCode(index: number) {
  const wasPrimary = form.codes[index]?.isPrimary;
  form.codes.splice(index, 1);
  if (wasPrimary && form.codes[0]) form.codes[0].isPrimary = true;
}

function setPrimary(index: number) {
  if (!form.codes[index]?.isPrimary) return;
  form.codes.forEach((item, itemIndex) => item.isPrimary = itemIndex === index);
}

async function load() {
  const [{ data: partnerResponse }, productResponse] = await Promise.all([
    http.get<{ data: Supplier[] }>("/partners"),
    id ? http.get<ProductDetail>(`/products/${id}`) : Promise.resolve(null),
  ]);
  suppliers.value = partnerResponse.data.filter((item) => item.isSender && item.status === "active");
  if (!productResponse) return;
  const data = productResponse.data;
  Object.assign(form, {
    ...data,
    description: data.description || "",
    category: data.category || "",
    codes: data.codes.map((code) => ({ ...code, localId: crypto.randomUUID() })),
  });
}

async function save() {
  error.value = "";
  const validation = await formRef.value?.validate();
  if (validation?.valid === false) return;
  saving.value = true;
  const payload = {
    ...form,
    supplierId: form.supplierId || null,
    weightKg: numberOrNull(form.weightKg),
    lengthCm: numberOrNull(form.lengthCm),
    widthCm: numberOrNull(form.widthCm),
    heightCm: numberOrNull(form.heightCm),
    codes: form.codes.map(({ localId: _localId, ...code }) => code),
  };
  try {
    if (id) await http.put(`/products/${id}`, payload);
    else await http.post("/products", payload);
    await router.push("/products");
  } catch (cause: unknown) {
    const code = (cause as { response?: { data?: { error?: string } } })?.response?.data?.error;
    error.value = code === "INVALID_SUPPLIER"
      ? "El proveedor seleccionado no es válido."
      : code === "PRODUCT_ALREADY_EXISTS"
        ? "El SKU o alguno de los códigos ya está registrado en la empresa."
        : "No se pudo guardar el producto. Revisa los datos introducidos.";
  } finally {
    saving.value = false;
  }
}

function numberOrNull(value: number | null) {
  return value === null || value === undefined || value === ("" as unknown as number) ? null : Number(value);
}

onMounted(() => load().catch(() => error.value = "No se pudieron cargar los datos del producto."));
</script>
