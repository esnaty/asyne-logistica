export const viewPermissions = [
  { code: 'dashboard.view', name: 'Ver resumen', description: 'Acceso al resumen operativo.', application: 'admin', menuLabel: 'Resumen', path: '/', icon: 'dashboard', sortOrder: '010' },
  { code: 'partners.view', name: 'Ver intervinientes', description: 'Acceso a remitentes, destinatarios y sus ubicaciones.', application: 'admin', menuLabel: 'Intervinientes', path: '/partners', icon: 'building', sortOrder: '020' },
  { code: 'products.view', name: 'Ver productos', description: 'Acceso al catálogo de productos.', application: 'admin', menuLabel: 'Productos', path: '/products', icon: 'package', sortOrder: '030' },
  { code: 'orders.view', name: 'Ver pedidos', description: 'Acceso al listado y gestión de pedidos.', application: 'admin', menuLabel: 'Pedidos', path: '/orders', icon: 'file', sortOrder: '040' },
  { code: 'routes.view', name: 'Ver rutas', description: 'Acceso a planificación y seguimiento de rutas.', application: 'admin', menuLabel: 'Rutas', path: '/routes', icon: 'route', sortOrder: '050' },
  { code: 'users.view', name: 'Ver usuarios', description: 'Acceso al listado y gestión de usuarios.', application: 'admin', menuLabel: 'Usuarios', path: '/users', icon: 'users', sortOrder: '060' },
  { code: 'roles.view', name: 'Ver roles', description: 'Acceso al listado y configuración de roles.', application: 'admin', menuLabel: 'Roles', path: '/roles', icon: 'shield', sortOrder: '070' },
  { code: 'sessions.view', name: 'Ver sesiones', description: 'Acceso al control de sesiones.', application: 'admin', menuLabel: 'Sesiones', path: '/sessions', icon: 'monitor', sortOrder: '080' },
  { code: 'mobile.work.view', name: 'Ver trabajo asignado', description: 'Acceso móvil a picking y carga.', application: 'mobile', menuLabel: 'Trabajo', path: '/', icon: 'package', sortOrder: '110' },
  { code: 'mobile.route.view', name: 'Ver ruta del día', description: 'Acceso móvil a la ruta y sus entregas.', application: 'mobile', menuLabel: 'Ruta', path: '/route', icon: 'route', sortOrder: '120' },
] as const

export const defaultCompanyRoles = [
  { code: 'owner', name: 'Propietario', permissions: viewPermissions.map((item) => item.code) },
  { code: 'admin', name: 'Administrador', permissions: viewPermissions.map((item) => item.code) },
  { code: 'planner', name: 'Planificador', permissions: ['dashboard.view', 'partners.view', 'orders.view', 'routes.view', 'mobile.route.view'] },
  { code: 'warehouse', name: 'Almacén', permissions: ['dashboard.view', 'products.view', 'orders.view', 'mobile.work.view'] },
  { code: 'driver', name: 'Conductor', permissions: ['mobile.work.view', 'mobile.route.view'] },
] as const
