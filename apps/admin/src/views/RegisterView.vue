<template>
  <v-main class="bg-background">
    <v-container class="fill-height justify-center py-8">
      <v-card width="520" rounded="xl" elevation="0" border>
        <v-card-text class="pa-8">
          <div class="text-h4 font-weight-bold mb-2">Crear empresa</div>
          <div class="text-medium-emphasis mb-6">
            El primer usuario será el propietario.
          </div>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
            error
          }}</v-alert>
          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="form.organizationName"
              label="Nombre de la empresa"
            />
            <v-row>
              <v-col
                ><v-text-field v-model="form.firstName" label="Nombre"
              /></v-col>
              <v-col
                ><v-text-field v-model="form.lastName" label="Apellidos"
              /></v-col>
            </v-row>
            <v-text-field
              v-model="form.email"
              label="Correo electrónico"
              type="email"
            />
            <v-text-field
              v-model="form.password"
              label="Contraseña"
              type="password"
              hint="Mínimo 12 caracteres"
              persistent-hint
            />
            <v-btn
              block
              color="primary"
              type="submit"
              :loading="loading"
              class="mt-5"
              >Crear empresa</v-btn
            >
          </v-form>
          <div class="text-center mt-5">
            <router-link to="/login">Ya tengo una cuenta</router-link>
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const form = reactive({
  organizationName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});
const loading = ref(false);
const error = ref("");
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await auth.register(form);
    await router.push({ name: "dashboard" });
  } catch {
    error.value =
      "No se pudo crear la cuenta. Revisa los datos e inténtalo nuevamente.";
  } finally {
    loading.value = false;
  }
}
</script>
