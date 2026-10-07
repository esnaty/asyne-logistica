export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Asyne Logística API',
    version: '0.1.0',
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Comprueba el estado de la API y PostgreSQL',
        responses: { '200': { description: 'Servicio disponible' } },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Crea una empresa y su primer usuario propietario',
        responses: { '201': { description: 'Cuenta creada' } },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Inicia una sesión',
        responses: { '200': { description: 'Sesión iniciada' } },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Devuelve el usuario y la empresa activos',
        responses: { '200': { description: 'Contexto autenticado' } },
      },
    },
    '/api/auth/logout': {
      post: {
        summary: 'Cierra la sesión actual',
        responses: { '204': { description: 'Sesión cerrada' } },
      },
    },
    '/api/organizations': {
      get: {
        summary: 'Lista las empresas accesibles por el usuario',
        responses: { '200': { description: 'Empresas accesibles' } },
      },
    },
    '/api/users': {
      get: {
        summary: 'Lista los miembros de la empresa activa',
        responses: { '200': { description: 'Miembros de la empresa' } },
      },
    },
    '/api/sessions': {
      get: {
        summary: 'Lista las sesiones activas del usuario',
        responses: { '200': { description: 'Sesiones activas' } },
      },
    },
    '/api/products': {
      get: {
        summary: 'Lista los productos de la empresa activa',
        responses: { '200': { description: 'Catálogo de productos' } },
      },
      post: {
        summary: 'Crea un producto con sus códigos de identificación',
        responses: { '201': { description: 'Producto creado' } },
      },
    },
    '/api/products/{productId}': {
      get: {
        summary: 'Obtiene el detalle de un producto',
        responses: { '200': { description: 'Detalle del producto' } },
      },
      put: {
        summary: 'Actualiza un producto y sus códigos',
        responses: { '200': { description: 'Producto actualizado' } },
      },
      delete: {
        summary: 'Elimina un producto',
        responses: { '204': { description: 'Producto eliminado' } },
      },
    },
    '/api/optimization/routes': {
      post: {
        summary: 'Optimiza una ruta de reparto',
        responses: { '200': { description: 'Ruta calculada' } },
      },
    },
  },
} as const
