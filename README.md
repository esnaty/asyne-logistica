# Asyne Logística

Monorepo npm con dos aplicaciones Vue 3:

- `apps/admin`: administración web con Vuetify 3.
- `apps/mobile`: operaciones móviles con Vuetify 3, Capacitor y SQLite.
- `apps/api`: API Express 5 con TypeScript, Drizzle y Zod.
- `services/optimizer`: optimización de rutas con FastAPI y OR-Tools.

## Requisitos

- Node.js 22+
- npm 10+
- Android Studio para ejecutar la aplicación Android

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev:admin
npm run dev:mobile
```

## Compilación

```bash
npm run build
```

## Android

Después de compilar la aplicación móvil:

```bash
npm run android --workspace @asyne/mobile
```

La URL de la API se configura copiando `.env.example` como `.env` en cada aplicación.

## Autenticación

- El panel de administración solo admite usuarios con rol global `superuser`.
- La aplicación móvil admite usuarios asociados a empresas.
- Axios envía un access token de corta duración en `Authorization: Bearer`.
- La cookie de sesión `HttpOnly` se utiliza únicamente para renovar el access token.

Para crear o rotar un superusuario, define `SUPERUSER_EMAIL` y `SUPERUSER_PASSWORD` y ejecuta:

```bash
npm run seed:superuser --workspace @asyne/api
```

## Docker Compose

Levanta ambos frontends con recarga en caliente:

```bash
docker compose up --build
```

- Administración: http://localhost:5173
- Aplicación móvil en navegador: http://localhost:5174
- API: http://localhost:3000
- Documentación de la API: http://localhost:3000/docs
- Optimizador: http://localhost:8000
- Documentación del optimizador: http://localhost:8000/docs
- PostgreSQL/PostGIS: localhost:5432
- Redis: localhost:6379

Para detenerlos:

```bash
docker compose down
```
