<template>
  <v-container class="pa-6" max-width="900"
    ><v-btn
      variant="text"
      prepend-icon="mdi-arrow-left"
      class="mb-4"
      @click="router.push('/company')"
      >Volver</v-btn
    >
    <div class="text-h4 font-weight-bold mb-6">
      {{ id ? "Editar empresa" : "Nueva empresa" }}
    </div>
    <v-card border elevation="0"
      ><v-card-text class="pa-6"
        ><v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
          error
        }}</v-alert>
        <div class="d-flex align-center ga-4 mb-6">
          <v-avatar
            size="72"
            :color="logoPreview || form.logoUrl ? undefined : form.primaryColor"
            class="avatar-upload"
            @click="imageInput?.click()"
            ><v-img v-if="logoPreview || form.logoUrl" :src="logoPreview || form.logoUrl" /><AppIcon
              v-else
              name="building"
              :size="32" />
            <div class="avatar-upload__overlay">
              <v-progress-circular
                v-if="uploading"
                indeterminate
                size="24"
              /><AppIcon v-else name="camera" /></div></v-avatar
          ><input
            ref="imageInput"
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="uploadImage"
          />
          <div>
            <div class="font-weight-bold">Identidad de la empresa</div>
            <div class="text-medium-emphasis text-body-2">
              Haz clic sobre el logo para subir una imagen.
            </div>
          </div>
        </div>
        <v-row
          ><v-col cols="12" md="6"
            ><v-text-field v-model="form.name" label="Nombre" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.slug"
              label="Identificador"
              hint="Se guardará en minúsculas; usa letras, números y guiones."
              @blur="normalizeSlug"
            /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.primaryColor"
              label="Color principal"
              type="color" /></v-col
          ><v-col cols="12" md="6"
            ><v-select
              v-model="form.status"
              label="Estado"
              :items="[
                { title: 'Activa', value: 'active' },
                { title: 'Suspendida', value: 'suspended' },
              ]" /></v-col
        ></v-row>
        <div class="d-flex justify-end ga-3 mt-6">
          <v-btn variant="outlined" @click="router.push('/company')"
            >Cancelar</v-btn
          ><v-btn color="primary" :loading="saving" @click="save"
            >Guardar</v-btn
          >
        </div>
      </v-card-text></v-card
    ></v-container
  >
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "../services/http";
import AppIcon from "../components/AppIcon.vue";
interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  status: "active" | "suspended";
}
const route = useRoute(),
  router = useRouter(),
  saving = ref(false),
  error = ref("");
const id = typeof route.params.id === "string" ? route.params.id : null;
const imageInput = ref<HTMLInputElement | null>(null),
  uploading = ref(false);
const logoPreview = ref("");
const form = reactive({
  name: "",
  slug: "",
  logoUrl: "",
  primaryColor: "#2563EB",
  status: "active" as "active" | "suspended",
});
async function load() {
  if (!id) return;
  const { data } = await http.get<{ data: Organization[] }>(
    "/platform/organizations",
  );
  const item = data.data.find((x) => x.id === id);
  if (item) Object.assign(form, { ...item, logoUrl: item.logoUrl || "" });
}
async function save() {
  normalizeSlug();
  saving.value = true;
  error.value = "";
  try {
    id
      ? await http.patch(`/platform/organizations/${id}`, form)
      : await http.post("/platform/organizations", form);
    await router.push("/company");
  } catch {
    error.value = "No se pudo guardar. Comprueba el identificador y los datos.";
  } finally {
    saving.value = false;
  }
}

function normalizeSlug() {
  form.slug = form.slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
async function uploadImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    error.value = "El logo no puede superar 2 MB.";
    return;
  }
  uploading.value = true;
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const { data } = await http.post<{ storageKey: string; url: string }>("/uploads/image", {
      dataUrl,
      kind: "logo",
      entityId: id || undefined,
    });
    form.logoUrl = data.storageKey;
    logoPreview.value = data.url;
  } catch {
    error.value = "No se pudo subir el logo. Usa JPG, PNG o WebP.";
  } finally {
    uploading.value = false;
  }
}
onMounted(load);
</script>
