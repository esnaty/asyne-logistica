<template>
  <v-main class="bg-background">
    <v-container class="fill-height justify-center">
      <v-card width="440" rounded="xl" elevation="0" border>
        <v-card-text class="pa-8">
          <div class="text-h4 font-weight-bold mb-2">Iniciar sesión</div>
          <div class="text-medium-emphasis mb-6">Accede a Asyne Logística.</div>
          <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{
            error
          }}</v-alert>
          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="email"
              class="mb-3"
              label="Correo o username"
              autocomplete="username"
            />
            <v-text-field
              v-model="password"
              label="Contraseña"
              class="mb-3"
              type="password"
              autocomplete="current-password"
            />
            <v-btn block color="primary" type="submit" :loading="loading"
              >Entrar</v-btn
            >
          </v-form>
          <div class="text-center text-medium-emphasis mt-5">
            Acceso para superusuarios y administradores de empresa.
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAuthStore } from "../stores/auth";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");
const router = useRouter();
const auth = useAuthStore();

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await auth.login({ email: email.value, password: password.value });
    await router.push({ name: "dashboard" });
  } catch (cause) {
    error.value = axios.isAxiosError(cause) && cause.response?.status === 401
      ? "El correo o la contraseña no son correctos."
      : "La sesión se inició, pero no se pudo cargar la aplicación. Inténtalo nuevamente.";
  } finally {
    loading.value = false;
  }
}
</script>
