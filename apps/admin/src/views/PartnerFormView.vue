<template>
  <v-container class="pa-4 pa-md-6" max-width="1050">
    <v-btn variant="text" class="mb-4" @click="router.push('/partners')">
      <AppIcon name="arrowLeft" class="mr-2" />Volver
    </v-btn>
    <div class="text-h4 font-weight-bold mb-6">{{ id ? "Editar interviniente" : "Nuevo interviniente" }}</div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-form ref="formRef" @submit.prevent="save">
      <v-card border elevation="0" class="mb-5">
        <v-card-title class="pa-6 pb-2">Datos generales</v-card-title>
        <v-card-text class="pa-6 pt-3">
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.name" label="Nombre o razón social" :rules="[requiredNameRule]" /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="form.taxId" label="NIF/CIF" /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="form.externalCode" label="Código externo" /></v-col>
            <v-col cols="12" md="6">
              <div class="d-flex ga-5 flex-wrap">
                <v-checkbox v-model="form.isSender" label="Es remitente" hide-details="auto" />
                <v-checkbox v-model="form.isRecipient" label="Es destinatario" hide-details="auto" />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.status" label="Estado" :items="statusOptions" />
            </v-col>
            <v-col cols="12" md="4"><v-text-field v-model="form.contactName" label="Persona de contacto" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model="form.email" label="Correo" type="email" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model="form.phone" label="Teléfono" /></v-col>
            <v-col cols="12"><v-textarea v-model="form.notes" label="Observaciones generales" rows="3" /></v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="d-flex align-center mb-3">
        <div>
          <div class="text-h5 font-weight-bold">Ubicaciones</div>
          <div class="text-medium-emphasis">Puntos de recogida, almacenes, talleres o lugares de entrega.</div>
        </div>
        <v-spacer />
        <v-btn variant="outlined" color="primary" @click="addLocation"><AppIcon name="plus" class="mr-2" />Añadir ubicación</v-btn>
      </div>

      <v-alert v-if="!form.locations.length" type="info" variant="tonal" class="mb-5">
        Todavía no has añadido ninguna ubicación.
      </v-alert>

      <v-card v-for="(location, index) in form.locations" :key="location.localId" border elevation="0" class="mb-4">
        <v-card-title class="d-flex align-center pa-5 pb-2">
          <AppIcon name="mapPin" class="mr-2" />Ubicación {{ index + 1 }}
          <v-spacer />
          <v-btn icon variant="text" color="danger" size="small" aria-label="Eliminar ubicación" @click="removeLocation(index)">
            <AppIcon name="trash" :size="18" />
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-5 pt-3">
          <v-row>
            <v-col cols="12" md="4"><v-text-field v-model="location.name" label="Nombre del punto" :rules="[requiredLocationNameRule]" /></v-col>
            <v-col cols="12">
              <LocationPicker
                v-model:address="location.address"
                v-model:postal-code="location.postalCode"
                v-model:city="location.city"
                v-model:province="location.province"
                v-model:country="location.country"
                v-model:latitude="location.latitude"
                v-model:longitude="location.longitude"
              />
            </v-col>
            <v-col cols="12" md="3"><v-text-field v-model="location.postalCode" label="Código postal" /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="location.city" label="Ciudad" :rules="[requiredCityRule]" /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="location.province" label="Provincia" /></v-col>
            <v-col cols="12" md="3"><v-text-field v-model="location.country" label="País" maxlength="2" :rules="[countryRule]" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model="location.receivingHours" label="Horario de recepción" /></v-col>
            <v-col cols="12" md="4"><v-text-field v-model.number="location.serviceMinutes" label="Minutos de servicio" type="number" min="0" /></v-col>
            <v-col cols="12"><v-textarea v-model="location.instructions" label="Instrucciones de acceso o entrega" rows="2" /></v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-end ga-3 mt-6">
        <v-btn variant="outlined" @click="router.push('/partners')">Cancelar</v-btn>
        <v-btn color="primary" type="submit" :loading="saving">Guardar</v-btn>
      </div>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import LocationPicker from "../components/LocationPicker.vue";
import { http } from "../services/http";

interface LocationForm {
  localId: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  latitude: number | string | null;
  longitude: number | string | null;
  receivingHours: string;
  serviceMinutes: number;
  instructions: string;
}

interface PartnerDetail {
  name: string;
  taxId: string | null;
  externalCode: string | null;
  isSender: boolean;
  isRecipient: boolean;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive";
  notes: string | null;
  locations: Omit<LocationForm, "localId">[];
}

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === "string" ? route.params.id : null;
const saving = ref(false);
const error = ref("");
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const statusOptions = [{ title: "Activo", value: "active" }, { title: "Inactivo", value: "inactive" }];
const requiredNameRule = (value: string) => value?.trim().length >= 2 || "Introduce un nombre o razón social.";
const requiredLocationNameRule = (value: string) => value?.trim().length >= 2 || "Introduce un nombre para la ubicación.";
const requiredCityRule = (value: string) => value?.trim().length >= 2 || "Introduce una ciudad.";
const countryRule = (value: string) => value?.trim().length === 2 || "Utiliza el código de país de 2 letras.";
const form = reactive({
  name: "",
  taxId: "",
  externalCode: "",
  isSender: false,
  isRecipient: true,
  contactName: "",
  email: "",
  phone: "",
  status: "active" as "active" | "inactive",
  notes: "",
  locations: [] as LocationForm[],
});

function emptyLocation(): LocationForm {
  return { localId: crypto.randomUUID(), name: "", address: "", postalCode: "", city: "", province: "", country: "ES", latitude: null, longitude: null, receivingHours: "", serviceMinutes: 10, instructions: "" };
}

function addLocation() {
  form.locations.push(emptyLocation());
}

function removeLocation(index: number) {
  form.locations.splice(index, 1);
}

async function load() {
  if (!id) {
    addLocation();
    return;
  }
  const { data } = await http.get<PartnerDetail>(`/partners/${id}`);
  Object.assign(form, {
    ...data,
    taxId: data.taxId || "",
    externalCode: data.externalCode || "",
    contactName: data.contactName || "",
    email: data.email || "",
    phone: data.phone || "",
    notes: data.notes || "",
    locations: data.locations.map((location) => ({ ...location, localId: crypto.randomUUID() })),
  });
}

async function save() {
  error.value = "";
  const validation = await formRef.value?.validate();
  const locationWithoutAddress = form.locations.findIndex((location) => location.address.trim().length < 4);
  if (validation?.valid === false || locationWithoutAddress >= 0) {
    error.value = locationWithoutAddress >= 0
      ? `Selecciona una dirección válida para la ubicación ${locationWithoutAddress + 1}.`
      : "Revisa los campos obligatorios antes de guardar.";
    return;
  }
  saving.value = true;
  const payload = {
    ...form,
    locations: form.locations.map(({ localId: _localId, ...location }) => ({
      ...location,
      latitude: location.latitude === "" ? null : location.latitude,
      longitude: location.longitude === "" ? null : location.longitude,
    })),
  };
  try {
    if (id) await http.put(`/partners/${id}`, payload);
    else await http.post("/partners", payload);
    await router.push("/partners");
  } catch {
    error.value = "No se pudo guardar. Revisa los datos, los tipos seleccionados y las ubicaciones.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
