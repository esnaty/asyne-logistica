<template>
  <v-app>
    <router-view v-if="route.meta.public" />
    <template v-else>
      <v-navigation-drawer v-if="mdAndUp" permanent rail expand-on-hover color="primary-dark" theme="dark">
        <v-list class="py-3 px-2">
          <v-list-item class="nav-profile" :title="fullName" :subtitle="role">
            <template #prepend>
              <v-avatar size="38" :color="auth.user?.avatarUrl ? undefined : 'primary'">
                <v-img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" cover />
                <span v-else class="text-caption font-weight-bold">{{ initials }}</span>
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>
        <v-divider />
        <v-list nav>
          <v-list-item v-for="link in links" :key="link.to" :title="link.title" :to="link.to">
            <template #prepend><AppIcon :name="link.icon" /></template>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-navigation-drawer v-else v-model="mobileDrawer" temporary>
        <v-list>
          <v-list-item :title="fullName" :subtitle="role">
            <template #prepend>
              <v-avatar :color="auth.user?.avatarUrl ? undefined : 'primary'">
                <v-img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" />
                <span v-else>{{ initials }}</span>
              </v-avatar>
            </template>
          </v-list-item>
        </v-list>
        <v-divider />
        <v-list nav @click="mobileDrawer = false">
          <v-list-item v-for="link in links" :key="link.to" :title="link.title" :to="link.to">
            <template #prepend><AppIcon :name="link.icon" /></template>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-app-bar color="surface" elevation="0" border="b">
        <v-btn v-if="!mdAndUp" icon variant="text" aria-label="Abrir menú" @click="mobileDrawer = !mobileDrawer"><AppIcon name="menu" /></v-btn>
        <v-img
          v-if="auth.activeOrganization?.logoUrl"
          :src="auth.activeOrganization.logoUrl"
          class="company-header-logo"
          contain
        />
        <v-avatar v-else size="34" :color="auth.activeOrganization?.primaryColor || 'primary'">
          <AppIcon name="building" :size="18" />
        </v-avatar>
        <v-app-bar-title class="ml-3" v-if="mdAndUp">{{ auth.activeOrganization?.name }}</v-app-bar-title>
        <v-btn icon variant="text" aria-label="Cerrar sesión" @click="logout"><AppIcon name="logout" /></v-btn>
      </v-app-bar>
      <v-main><router-view /></v-main>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import AppIcon from "./components/AppIcon.vue";
import { useAuthStore } from "./stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { mdAndUp } = useDisplay();
const mobileDrawer = ref(false);
const initials = computed(() => `${auth.user?.firstName?.[0] || ""}${auth.user?.lastName?.[0] || ""}`.toUpperCase());
const fullName = computed(() => `${auth.user?.firstName || ""} ${auth.user?.lastName || ""}`.trim());
const role = computed(() => auth.isSuperuser ? "Superusuario" : auth.activeOrganization?.roleName || (auth.isPlatformAdmin ? "Administrador" : "Usuario"));
const links = computed(() => {
  const items = auth.navigation
    .filter((item) => item.application === "admin")
    .map((item) => ({ to: item.path, title: item.menuLabel, icon: item.icon }));
  if (auth.isSuperuser) {
    const dashboardIndex = items.findIndex((item) => item.to === "/");
    items.splice(dashboardIndex + 1, 0, { to: "/company", title: "Empresas", icon: "building" });
  }
  return items;
});

async function logout() {
  await auth.logout();
  await router.push({ name: "login" });
}
</script>
