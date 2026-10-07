<template>
  <v-app>
    <router-view v-if="route.meta.public" />

    <template v-else>
      <v-app-bar color="surface" elevation="0" border="b">
        <v-img
          v-if="auth.activeOrganization?.logoUrl"
          :src="auth.activeOrganization.logoUrl"
          class="company-header-logo"
          contain
        />
        <v-avatar v-else size="34" :color="auth.activeOrganization?.primaryColor || 'primary'">
          <AppIcon name="building" :size="18" />
        </v-avatar>

        <v-app-bar-title v-if="mdAndUp">
          {{ auth.activeOrganization?.name }}
        </v-app-bar-title>

        <div class="d-flex align-center ga-2 mr-3">
          <div class="text-right d-none d-sm-block">
            <div class="text-body-2 font-weight-medium">{{ fullName }}</div>
            <div class="text-caption text-medium-emphasis">{{ role }}</div>
          </div>
          <v-btn icon variant="text" to="/profile" aria-label="Abrir perfil">
            <v-avatar size="38" :color="auth.user?.avatarUrl ? undefined : 'primary'">
              <v-img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" cover />
              <span v-else class="text-caption font-weight-bold">{{ initials }}</span>
            </v-avatar>
          </v-btn>
        </div>
      </v-app-bar>

      <v-main>
        <router-view />
      </v-main>

      <v-bottom-navigation grow color="primary">
        <v-btn v-for="item in mobileNavigation" :key="item.code" :to="item.path">
          <AppIcon :name="item.icon" />
          <span>{{ item.menuLabel }}</span>
        </v-btn>
      </v-bottom-navigation>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useDisplay } from "vuetify";
import AppIcon from "./components/AppIcon.vue";
import { useAuthStore } from "./stores/auth";

const route = useRoute();
const auth = useAuthStore();
const { mdAndUp } = useDisplay();
const initials = computed(() => `${auth.user?.firstName?.[0] || ""}${auth.user?.lastName?.[0] || ""}`.toUpperCase());
const fullName = computed(() => `${auth.user?.firstName || ""} ${auth.user?.lastName || ""}`.trim());
const role = computed(() => auth.activeOrganization?.roleName || "Usuario");
const mobileNavigation = computed(() => auth.navigation.filter((item) => item.application === "mobile"));
</script>
