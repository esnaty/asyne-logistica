<template>
  <v-container class="pa-6" max-width="1000"
    ><v-btn variant="text" class="mb-4" @click="router.push('/users')"
      ><AppIcon name="arrowLeft" class="mr-2" />Volver</v-btn
    >
    <div class="text-h4 font-weight-bold mb-6">
      {{ id ? "Editar usuario" : "Nuevo usuario" }}
    </div>
    <v-card border elevation="0"
      ><v-card-text class="pa-6"
        ><form autocomplete="off" @submit.prevent="save">
          <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
            error
          }}</v-alert>
          <div class="d-flex align-center ga-4 mb-6">
            <v-avatar
              size="72"
              :color="avatarPreview || form.avatarUrl ? undefined : 'primary'"
              class="avatar-upload"
              @click="imageInput?.click()"
              ><v-img v-if="avatarPreview || form.avatarUrl" :src="avatarPreview || form.avatarUrl" cover /><span
                v-else-if="initials"
                class="text-h6 font-weight-bold"
                >{{ initials }}</span
              ><AppIcon v-else name="user" :size="30" />
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
              <div class="font-weight-bold">Foto de perfil</div>
              <div class="text-medium-emphasis text-body-2">
                Haz clic sobre el avatar para subir una imagen.
              </div>
            </div>
          </div>
          <v-row
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.firstName"
                label="Nombre"
                autocomplete="off" /></v-col
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.lastName"
                label="Primer apellido"
                autocomplete="off" /></v-col
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.secondLastName"
                label="Segundo apellido"
                autocomplete="off" /></v-col
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.username"
                label="Username"
                name="managed-user-handle"
                autocomplete="one-time-code" /></v-col
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.email"
                label="Correo"
                type="email"
                autocomplete="off" /></v-col
            ><v-col cols="12" md="6"
              ><v-text-field
                v-model="form.phone"
                label="Teléfono"
                autocomplete="off" /></v-col
            ><v-col cols="12"
              ><v-text-field
                v-model="form.password"
                :label="id ? 'Nueva contraseña (opcional)' : 'Contraseña'"
                type="password"
                name="managed-user-new-password"
                autocomplete="new-password"
            /></v-col>
            <v-col cols="12" md="6"
              ><v-select
                v-model="form.organizationId"
                label="Empresa"
                :items="organizations"
                item-title="name"
                item-value="id"
                :disabled="!auth.isSuperuser" /></v-col
            ><v-col cols="12" md="6"
              ><v-select
                v-model="form.role"
                label="Rol en la empresa"
                :items="roles"
                item-title="name"
                item-value="code" /></v-col
            ><v-col cols="12" md="6"
              ><v-select
                v-model="form.status"
                label="Estado"
                :items="[
                  { title: 'Activo', value: 'active' },
                  { title: 'Deshabilitado', value: 'disabled' },
                ]" /></v-col
            ><v-col v-if="auth.isSuperuser || auth.isPlatformAdmin" cols="12" md="6"
              ><v-select
                v-model="form.platformRole"
                label="Rol global"
                :items="globalRoles"
                item-title="name"
                item-value="code" /></v-col
          ></v-row>
          <div class="d-flex justify-end ga-3 mt-6">
            <v-btn variant="outlined" @click="router.push('/users')"
              >Cancelar</v-btn
            ><v-btn color="primary" type="submit" :loading="saving"
              >Guardar</v-btn
            >
          </div>
        </form>
      </v-card-text></v-card
    ></v-container
  >
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { http } from "../services/http";
import { useAuthStore } from "../stores/auth";
import AppIcon from "../components/AppIcon.vue";
interface Organization {
  id: string;
  name: string;
  status: string;
}
interface Member {
  id: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  username: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  platformRole: string;
  organizationId: string | null;
  organizationRole: string | null;
}
const auth = useAuthStore(),
  route = useRoute(),
  router = useRouter(),
  id = typeof route.params.id === "string" ? route.params.id : null,
  saving = ref(false),
  error = ref(""),
  organizations = ref<Organization[]>([]);
const imageInput = ref<HTMLInputElement | null>(null),
  uploading = ref(false);
const avatarPreview = ref("");
const form = reactive({
  firstName: "",
  lastName: "",
  secondLastName: "",
  username: "",
  email: "",
  phone: "",
  avatarUrl: "",
  password: "",
  status: "active",
  platformRole: "user",
  organizationId: "",
  role: "driver",
});
const initials = computed(() =>
  `${form.firstName[0] || ""}${form.lastName[0] || ""}`.toUpperCase(),
);
interface RoleOption {
  code: string;
  name: string;
}

const roles = ref<RoleOption[]>([]);
const globalRoles = ref<RoleOption[]>([]);
async function load() {
  const usersRequest = http.get<{ data: Member[] }>("/platform/users");
  const rolesRequest = http.get<{ global: RoleOption[]; company: RoleOption[] }>("/roles");
  const organizationsRequest = auth.isSuperuser
    ? http.get<{ data: Organization[] }>("/platform/organizations")
    : Promise.resolve({
        data: {
          data: auth.activeOrganization
            ? [{ id: auth.activeOrganization.id, name: auth.activeOrganization.name, status: "active" }]
            : [],
        },
      });
  const [o, u, roleCatalog] = await Promise.all([
    organizationsRequest,
    usersRequest,
    rolesRequest,
  ]);
  roles.value = roleCatalog.data.company;
  globalRoles.value = roleCatalog.data.global;
  organizations.value = o.data.data.filter((x) => x.status === "active");
  form.organizationId =
    auth.activeOrganization?.id || organizations.value[0]?.id || "";
  if (id) {
    const item = u.data.data.find((x) => x.id === id);
    if (item)
      Object.assign(form, {
        ...item,
        secondLastName: item.secondLastName || "",
        phone: item.phone || "",
        avatarUrl: item.avatarUrl || "",
        password: "",
        organizationId: item.organizationId || form.organizationId,
        role: item.organizationRole || "driver",
      });
  }
}
async function save() {
  saving.value = true;
  error.value = "";
  try {
    id
      ? await http.put(`/platform/users/${id}`, form)
      : await http.post("/platform/users", form);
    await router.push("/users");
  } catch {
    error.value =
      "No se pudo guardar. Revisa los datos y los identificadores únicos.";
  } finally {
    saving.value = false;
  }
}
async function uploadImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    error.value = "La foto no puede superar 2 MB.";
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
      kind: "avatar",
      entityId: id || undefined,
    });
    form.avatarUrl = data.storageKey;
    avatarPreview.value = data.url;
  } catch {
    error.value = "No se pudo subir la foto. Usa JPG, PNG o WebP.";
  } finally {
    uploading.value = false;
  }
}
onMounted(load);
watch(
  () => form.organizationId,
  async (organizationId) => {
    if (!auth.isSuperuser || !organizationId) return;
    const { data } = await http.get<{ company: RoleOption[] }>(`/roles?organizationId=${organizationId}`);
    roles.value = data.company;
    if (!roles.value.some((role) => role.code === form.role)) form.role = roles.value[0]?.code || "";
  },
);
</script>
