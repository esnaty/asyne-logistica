<template>
  <v-container class="pa-4 pb-12" max-width="680">
    <div class="text-h4 font-weight-bold mb-6">Mi perfil</div>

    <v-card border elevation="0">
      <v-card-text class="pa-6">
        <div class="d-flex flex-column align-center text-center mb-8">
          <v-avatar
            size="96"
            :color="auth.user?.avatarUrl ? undefined : 'primary'"
            class="mb-4"
          >
            <v-img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" cover />
            <span v-else class="text-h5 font-weight-bold">{{ initials }}</span>
          </v-avatar>

          <div class="text-h5 font-weight-bold">{{ fullName }}</div>
          <div class="text-medium-emphasis">@{{ auth.user?.username }}</div>
          <v-chip color="primary" variant="tonal" class="status-chip mt-3">
            {{ role }}
          </v-chip>
        </div>

        <v-divider class="mb-5" />

        <dl class="profile-details">
          <div>
            <dt>Correo electrónico</dt>
            <dd>{{ auth.user?.email }}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{{ auth.user?.phone || "No indicado" }}</dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{{ auth.activeOrganization?.name }}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{{ role }}</dd>
          </div>
        </dl>

        <v-btn
          block
          color="danger"
          variant="tonal"
          class="mt-8"
          :loading="closingSession"
          @click="logout"
        >
          <AppIcon name="logout" class="mr-2" />
          Cerrar sesión
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const closingSession = ref(false);
const initials = computed(() => `${auth.user?.firstName?.[0] || ""}${auth.user?.lastName?.[0] || ""}`.toUpperCase());
const fullName = computed(() => [auth.user?.firstName, auth.user?.lastName, auth.user?.secondLastName].filter(Boolean).join(" "));
const role = computed(() => auth.activeOrganization?.roleName || "Usuario");

async function logout() {
  closingSession.value = true;
  try {
    await auth.logout();
    await router.replace({ name: "login" });
  } finally {
    closingSession.value = false;
  }
}
</script>

<style scoped>
.profile-details {
  display: grid;
  gap: 20px;
  margin: 0;
}

.profile-details div {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.profile-details dt {
  color: #64748b;
}

.profile-details dd {
  margin: 0;
  color: #0f172a;
  font-weight: 500;
  text-align: right;
}
</style>
