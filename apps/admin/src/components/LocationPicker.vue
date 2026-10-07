<template>
  <div class="location-picker">
    <v-autocomplete
      v-model="selectedId"
      v-model:search="search"
      label="Buscar dirección"
      :items="suggestions"
      item-title="title"
      item-value="id"
      :loading="searching"
      :no-data-text="noDataText"
      clearable
      no-filter
      @update:model-value="selectSuggestion"
    >
      <template #prepend-inner><AppIcon name="search" :size="18" /></template>
    </v-autocomplete>

    <v-alert v-if="notice" type="warning" variant="tonal" density="compact" class="mb-3">
      {{ notice }}
    </v-alert>

    <div ref="mapElement" class="location-picker__map" />
    <div class="text-caption text-medium-emphasis mt-2">
      Haz clic en el mapa o arrastra el marcador para ajustar el punto exacto de acceso.
    </div>

    <v-row class="mt-1">
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="latitude" label="Latitud" type="number" step="any" @blur="coordinatesChanged" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field v-model.number="longitude" label="Longitud" type="number" step="any" @blur="coordinatesChanged" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import AppIcon from "./AppIcon.vue";
import { http } from "../services/http";

interface GeocodedLocation {
  address: string;
  formattedAddress: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Suggestion extends GeocodedLocation {
  id: string;
  title: string;
}

const address = defineModel<string>("address", { required: true });
const postalCode = defineModel<string>("postalCode", { required: true });
const city = defineModel<string>("city", { required: true });
const province = defineModel<string>("province", { required: true });
const country = defineModel<string>("country", { required: true });
const latitude = defineModel<number | string | null>("latitude", { required: true });
const longitude = defineModel<number | string | null>("longitude", { required: true });

const mapElement = ref<HTMLElement | null>(null);
const selectedId = ref<string | null>(null);
const search = ref(address.value);
const suggestions = ref<Suggestion[]>([]);
const searching = ref(false);
const notice = ref("");
const noDataText = ref("Escribe al menos 3 caracteres");
let map: Map | null = null;
let marker: Marker | null = null;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let suppressSearch = false;

onMounted(() => {
  const hasCoordinates = numericCoordinates() !== null;
  const initial = numericCoordinates() ?? { latitude: 40.4168, longitude: -3.7038 };
  map = new Map({
    container: mapElement.value!,
    center: [initial.longitude, initial.latitude],
    zoom: hasCoordinates ? 16 : 5,
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    },
  });
  map.addControl(new NavigationControl({ showCompass: false }), "top-right");
  map.on("click", (event) => setPoint(event.lngLat.lat, event.lngLat.lng, true));
  if (hasCoordinates) updateMarker(initial.latitude, initial.longitude, false);
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
  marker?.remove();
  map?.remove();
});

watch(search, (value) => {
  if (suppressSearch) {
    suppressSearch = false;
    return;
  }
  selectedId.value = null;
  suggestions.value = [];
  notice.value = "";
  if (searchTimer) clearTimeout(searchTimer);
  if (!value || value.trim().length < 3) {
    noDataText.value = "Escribe al menos 3 caracteres";
    return;
  }
  searchTimer = setTimeout(() => autocomplete(value.trim()), 350);
});

watch([latitude, longitude], () => {
  const point = numericCoordinates();
  if (point) updateMarker(point.latitude, point.longitude, false);
});

async function autocomplete(query: string) {
  searching.value = true;
  try {
    const { data } = await http.get<{ data: Suggestion[] }>("/geocoding/autocomplete", { params: { q: query } });
    suggestions.value = data.data;
    noDataText.value = data.data.length ? "" : "No se encontraron direcciones";
  } catch (cause: unknown) {
    notice.value = providerMessage(cause);
  } finally {
    searching.value = false;
  }
}

function selectSuggestion(id: string | null) {
  if (!id) return;
  const suggestion = suggestions.value.find((item) => item.id === id);
  if (suggestion) applyLocation(suggestion);
}

async function reverseGeocode(lat: number, lng: number) {
  searching.value = true;
  try {
    const { data } = await http.get<GeocodedLocation>("/geocoding/reverse", { params: { latitude: lat, longitude: lng } });
    applyLocation(data, true);
  } catch (cause: unknown) {
    notice.value = providerMessage(cause);
  } finally {
    searching.value = false;
  }
}

function applyLocation(location: GeocodedLocation, preserveCoordinates = false) {
  suppressSearch = true;
  search.value = location.formattedAddress || location.address;
  address.value = location.address;
  postalCode.value = location.postalCode;
  city.value = location.city;
  province.value = location.province;
  country.value = location.country;
  if (!preserveCoordinates) {
    latitude.value = location.latitude;
    longitude.value = location.longitude;
  }
  const point = numericCoordinates();
  if (point) updateMarker(point.latitude, point.longitude, true);
  notice.value = "";
}

function setPoint(lat: number, lng: number, reverse: boolean) {
  latitude.value = Number(lat.toFixed(7));
  longitude.value = Number(lng.toFixed(7));
  updateMarker(lat, lng, false);
  if (reverse) reverseGeocode(lat, lng);
}

function updateMarker(lat: number, lng: number, center: boolean) {
  if (!map) return;
  if (!marker) {
    marker = new Marker({ color: "#2563EB", draggable: true }).setLngLat([lng, lat]).addTo(map);
    marker.on("dragend", () => {
      const point = marker!.getLngLat();
      setPoint(point.lat, point.lng, true);
    });
  } else marker.setLngLat([lng, lat]);
  if (center) map.flyTo({ center: [lng, lat], zoom: 16 });
}

function coordinatesChanged() {
  const point = numericCoordinates();
  if (!point) return;
  updateMarker(point.latitude, point.longitude, true);
  reverseGeocode(point.latitude, point.longitude);
}

function numericCoordinates() {
  const lat = typeof latitude.value === "number" ? latitude.value : Number(latitude.value);
  const lng = typeof longitude.value === "number" ? longitude.value : Number(longitude.value);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || latitude.value === "" || longitude.value === "" || latitude.value == null || longitude.value == null) return null;
  return { latitude: lat, longitude: lng };
}

function providerMessage(cause: unknown) {
  const status = (cause as { response?: { status?: number } })?.response?.status;
  return status === 503
    ? "El mapa funciona, pero falta configurar GEOAPIFY_API_KEY para buscar y completar direcciones."
    : "No se pudo consultar la dirección. Puedes seleccionar el punto manualmente en el mapa.";
}
</script>

<style scoped>
.location-picker__map {
  width: 100%;
  height: 320px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
</style>
