<template>
  <v-main class="bg-background">
    <v-container class="fill-height justify-center pa-4">
      <v-card width="100%" max-width="440" elevation="0" border>
        <v-card-text class="pa-6">
          <div class="text-h4 font-weight-bold mb-2">Asyne Operaciones</div>
          <div class="text-medium-emphasis mb-6">
            Accede con tu cuenta de empresa.
          </div>
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
const auth = useAuthStore();
const router = useRouter();

async function submit() {
  loading.value = true;
  error.value = "";
  try {
    await auth.login(email.value, password.value);
    await router.push({ name: "work" });
  } catch (cause) {
    error.value = axios.isAxiosError(cause) && cause.response?.status === 401
      ? "El correo o la contraseña no son correctos."
      : "La sesión se inició, pero no se pudo cargar la aplicación. Inténtalo nuevamente.";
  } finally {
    loading.value = false;
  }
}
</script>
