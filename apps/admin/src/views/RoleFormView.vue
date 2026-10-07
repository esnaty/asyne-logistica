<template>
  <v-container class="pa-4 pa-md-6" max-width="900">
    <v-btn variant="text" class="mb-4" @click="router.push('/roles')">
      <AppIcon name="arrowLeft" class="mr-2" />Volver
    </v-btn>
    <div class="text-h4 font-weight-bold mb-6">{{ code ? "Editar rol" : "Nuevo rol" }}</div>

    <v-card border elevation="0">
      <v-card-text class="pa-6">
        <form @submit.prevent="save">
          <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.name" label="Nombre" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.code"
                label="Código"
                hint="Letras minúsculas, números y guiones"
                :disabled="Boolean(code)"
                @update:model-value="normalizeCode"
              />
            </v-col>
          </v-row>

          <div class="text-h6 font-weight-medium mt-4 mb-1">Permisos de vistas</div>
          <div class="text-body-2 text-medium-emphasis mb-4">Selecciona por separado las pantallas del administrador y de la app.</div>
          <section v-for="group in permissionGroups" :key="group.application" class="mb-5">
            <div class="text-subtitle-1 font-weight-medium mb-3">{{ group.title }}</div>
            <v-row>
              <v-col v-for="permission in group.items" :key="permission.code" cols="12" md="6" class="d-flex">
                <v-card border elevation="0" class="permission-card" @click="toggle(permission.code)">
                  <v-card-text class="d-flex align-start ga-3">
                    <v-checkbox-btn
                      v-model="form.permissions"
                      :value="permission.code"
                      class="permission-card__checkbox"
                      @click.stop
                    />
                    <div class="permission-card__content">
                      <div class="font-weight-medium">{{ permission.name }}</div>
                      <div class="text-body-2 text-medium-emphasis">{{ permission.description }}</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </section>

          <div class="d-flex justify-end ga-3 mt-6">
            <v-btn variant="outlined" @click="router.push('/roles')">Cancelar</v-btn>
            <v-btn color="primary" type="submit" :loading="saving">Guardar</v-btn>
          </div>
        </form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import { http } from "../services/http";

interface Permission {
  code: string;
  name: string;
  description: string;
  application: "admin" | "mobile";
}

interface CompanyRole {
  code: string;
  name: string;
  permissions: string[];
}

const route = useRoute();
const router = useRouter();
const code = typeof route.params.code === "string" ? route.params.code : null;
const permissions = ref<Permission[]>([]);
const saving = ref(false);
const error = ref("");
const form = reactive({ name: "", code: "", permissions: [] as string[] });
const permissionGroups = computed(() => [
  { application: "admin", title: "Administrador web", items: permissions.value.filter((item) => item.application === "admin") },
  { application: "mobile", title: "Aplicación móvil", items: permissions.value.filter((item) => item.application === "mobile") },
]);

function normalizeCode(value: string) {
  if (code) return;
  form.code = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toggle(permissionCode: string) {
  const index = form.permissions.indexOf(permissionCode);
  if (index === -1) form.permissions.push(permissionCode);
  else form.permissions.splice(index, 1);
}

async function load() {
  const [permissionResponse, roleResponse] = await Promise.all([
    http.get<{ data: Permission[] }>("/roles/permissions"),
    http.get<{ company: CompanyRole[] }>("/roles"),
  ]);
  permissions.value = permissionResponse.data.data;
  if (code) {
    const role = roleResponse.data.company.find((item) => item.code === code);
    if (!role) {
      await router.push("/roles");
      return;
    }
    Object.assign(form, { name: role.name, code: role.code, permissions: [...role.permissions] });
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    if (code) await http.put(`/roles/company/${code}`, { name: form.name, permissions: form.permissions });
    else await http.post("/roles/company", form);
    await router.push("/roles");
  } catch {
    error.value = "No se pudo guardar el rol. Revisa el nombre, el código y sus permisos.";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.permission-card {
  cursor: pointer;
  height: 100%;
  width: 100%;
}

.permission-card :deep(.v-card-text) {
  align-items: center !important;
  min-height: 72px;
}

.permission-card__checkbox {
  flex: 0 0 40px;
}

.permission-card__content {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
