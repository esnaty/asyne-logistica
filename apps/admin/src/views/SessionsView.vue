<template>
  <v-container fluid class="pa-6">
    <div class="text-h4 font-weight-bold mb-1">Sesiones</div>
    <div class="text-medium-emphasis mb-6">Dispositivos con acceso a tu cuenta.</div>
    <v-card rounded="lg" elevation="0" border>
      <v-list lines="three">
        <v-list-item v-for="session in sessions" :key="session.id">
          <v-list-item-title>
            {{ session.current ? "Sesión actual" : "Otra sesión" }}
            <v-chip v-if="session.current" size="x-small" color="primary" class="ml-2">Actual</v-chip>
          </v-list-item-title>
          <v-list-item-subtitle>{{ session.userAgent || "Dispositivo desconocido" }}</v-list-item-subtitle>
          <v-list-item-subtitle>IP {{ session.ipAddress }} · Último acceso {{ new Date(session.lastSeenAt).toLocaleString() }}</v-list-item-subtitle>
          <template #append>
            <v-btn color="error" variant="text" @click="revoke(session)">Revocar</v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { http } from "../services/http";
import { useAuthStore } from "../stores/auth";

interface Session { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; lastSeenAt: string; expiresAt: string; current: boolean }
const sessions = ref<Session[]>([]);
const router = useRouter();
const auth = useAuthStore();
async function load() { const { data } = await http.get<{ data: Session[] }>("/sessions"); sessions.value = data.data; }
async function revoke(session: Session) { await http.delete(`/sessions/${session.id}`); if (session.current) { auth.$reset(); auth.initialized = true; await router.push({ name: "login" }); return; } await load(); }
onMounted(load);
</script>
