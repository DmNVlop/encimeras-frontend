Plan de Actualización del Frontend para Rol OWNER
Basándome en la documentación del backend y el análisis del código frontend, he identificado los cambios necesarios para integrar el nuevo rol OWNER (propietario de fábrica).

---

🎯 Resumen Ejecutivo
El rol OWNER se posiciona entre ADMIN y SALES con las siguientes características:
Permisos del rol OWNER según documentación:

- ✅ VE: Órdenes, Clientes, Borradores, Descuentos, Configuración de documentos
- ✅ CREA: Usuarios tipo SALES y USER, Clientes, Descuentos
- ✅ MODIFICA: Clientes, Descuentos, Configuración de documentos
- ✅ ELIMINA: Clientes
- ❌ NO ACCEDE: Configuraciones de sistema, Parametrización (materiales, precios, reglas)
- 🔒 Scope de Fábrica: Solo ve/gestiona recursos de su factoryId

---

📊 Cambios Identificados
1️⃣ Definición de Roles (1 archivo)
Archivo: src/interfases/user.interfase.ts
Estado actual:
export const Role = {
ADMIN: "ADMIN",
USER: "USER",
SALES: "SALES",
WORKER: "WORKER",
}
Cambio necesario:
export const Role = {
ADMIN: "ADMIN",
OWNER: "OWNER", // ⬅️ AGREGAR
SALES: "SALES",
USER: "USER",
WORKER: "WORKER",
}
Impacto: Este cambio se propaga automáticamente a todos los archivos que importan Role.

---

2️⃣ Rutas y Permisos (1 archivo)
Archivo: src/config/routes.config.ts
Cambios necesarios (36 líneas afectadas):
Ruta Roles Actuales Roles Nuevos
/quote ADMIN, SALES, USER ADMIN, OWNER, SALES, USER
/ (User Portal) USER, ADMIN, SALES USER, ADMIN, OWNER, SALES
/admin (Layout) ADMIN, SALES ADMIN, OWNER, SALES
/admin/orders ADMIN, SALES ADMIN, OWNER, SALES
/admin/users ADMIN ADMIN, OWNER
/admin/customers ADMIN, SALES ADMIN, OWNER, SALES
/admin/discount-rules ADMIN, SALES ADMIN, OWNER, SALES
/admin/doc-config ADMIN, SALES ADMIN, OWNER, SALES
Parametrización (8 rutas) ADMIN ADMIN

---

3️⃣ Menú Lateral (Sidebar) (1 archivo)
Archivo: src/components/admin/components/AdminSidebar.tsx
Cambios necesarios:
const menuConfig: NavItem[] = [
{ text: "Dashboard", allowedRoles: ["ADMIN"] }, // ❌ OWNER no accede
{ text: "Presupuestador", allowedRoles: ["ADMIN", "OWNER", "SALES"] }, // ✅ OWNER accede
{ text: "Ordenes", allowedRoles: ["ADMIN", "OWNER", "SALES"] }, // ✅ OWNER accede

{ text: "ADMINISTRACIÓN", allowedRoles: ["ADMIN", "OWNER", "SALES"] },
{
text: "Configuración",
allowedRoles: ["ADMIN", "OWNER", "SALES"],
children: [
{ text: "Usuarios", allowedRoles: ["ADMIN", "OWNER"] }, // ✅ OWNER crea usuarios
{ text: "Clientes", allowedRoles: ["ADMIN", "OWNER", "SALES"] },
{ text: "Descuentos", allowedRoles: ["ADMIN", "OWNER", "SALES"] },
{ text: "Doc Config", allowedRoles: ["ADMIN", "OWNER", "SALES"] },
],
},
{
text: "Parametrización", // ❌ OWNER NO accede
allowedRoles: ["ADMIN"], // Sin cambios
children: [...]
},
];

---

4️⃣ Página de Login (1 archivo)
Archivo: src/pages/admin/LoginPage.tsx:56
Cambio necesario:
// Lógica de redirección después del login
if (userRoles.includes(UserRole.ADMIN) ||
userRoles.includes(UserRole.OWNER) || // ⬅️ AGREGAR
userRoles.includes(UserRole.SALES)) {
navigate("/admin/orders", { replace: true });
}

---

5️⃣ Gestión de Usuarios (2 archivos)
A) Página de Usuarios: src/pages/admin/UsersPage.tsx
Cambios necesarios:

1. Mostrar el campo factoryId para usuarios OWNER
2. Mostrar badge/chip identificativo para rol OWNER
3. Validación: OWNER solo puede crear usuarios SALES y USER
   B) Modal de Usuario: src/pages/admin/components/users/UserModal.tsx
   Cambios necesarios:
4. Campo factoryId (requerido si rol incluye OWNER)
5. Select de fábrica (dropdown con lista de fábricas)
6. Validación: Si usuario autenticado es OWNER, limitar roles disponibles a SALES y USER
7. Validación: Si se selecciona rol OWNER, campo factoryId es obligatorio
   Lógica de restricción:
   // Si el usuario autenticado es OWNER, solo puede asignar roles SALES y USER
   const availableRoles = currentUser?.roles.includes("OWNER")
   ? [Role.SALES, Role.USER]
   : [Role.ADMIN, Role.OWNER, Role.SALES, Role.USER, Role.WORKER];

---

6️⃣ Configuración de Documentos (1 archivo)
Archivo: src/pages/admin/doc-config/DocConfigPage.tsx:XX
Estado actual:
const isAdmin = user?.roles.includes("ADMIN");
Cambio necesario:
const canEdit = user?.roles.includes("ADMIN") || user?.roles.includes("OWNER");
Comportamiento:

- ADMIN: Puede modificar todas las configuraciones
- OWNER: Puede modificar configuraciones de su fábrica
- SALES: Solo lectura (actual comportamiento se mantiene)

---

7️⃣ Portal de Usuario (1 archivo)
Archivo: src/pages/public/UserPortal/layout/UserPortalLayout.tsx
Estado actual:
const isAdminOrSales = user?.roles?.some(
(role) => role === Role.ADMIN || role === Role.SALES
);
Cambio necesario:
const isAdminOrSalesOrOwner = user?.roles?.some(
(role) => role === Role.ADMIN || role === Role.OWNER || role === Role.SALES
);
Impacto: OWNER también verá el enlace "Panel Admin" en el portal de usuario.

---

8️⃣ Interfaz de Usuario (User Interface) (1 archivo)
Archivo: src/interfases/user.interfase.ts
Cambio necesario:
export interface User {
\_id: string;
id?: string;
username: string;
name?: string;
email?: string;
phone?: string;
roles: Role[];
factoryId?: string; // ⬅️ AGREGAR (opcional, requerido si rol incluye OWNER)
createdAt: string;
updatedAt: string;
password?: string;
}

---

9️⃣ Guard de Roles (1 archivo - VERIFICAR)
Archivo: src/components/guards/RoleGuard.tsx
Acción: VERIFICAR que la lógica actual ya soporte correctamente el nuevo rol.
Lógica esperada:
const hasRequiredRole = allowedRoles.some(role => user.roles.includes(role));
✅ Si usa .some() o .includes(), debería funcionar automáticamente.
⚠️ Si tiene lógica específica por rol, necesita actualización.

---

🔟 Componentes con Visualización de Roles (5+ archivos)
Archivos que muestran el rol del usuario y necesitan actualización visual (NO funcional):

1. src/components/admin/AdminLayout.tsx - Header muestra user.roles[0]
2. src/pages/public/QuoteWizard/steps/components/step5/RequesterInfo.tsx - Muestra roles como Chips
3. src/pages/public/UserPortal/views/UserProfile.tsx - Muestra user.roles.join(", ")
4. src/pages/errors/ForbiddenPage.tsx - Muestra user.roles[0]
5. src/utils/pdfAdapter.ts - Usa user?.roles?.[0] || "Gestor"
   Acción: Agregar color/badge diferenciado para rol OWNER (opcional pero recomendado).

---

🚀 Plan de Implementación Propuesto
Fase 1: Definiciones Base (CRÍTICO)

- [ ] Actualizar src/interfases/user.interfase.ts (agregar OWNER al enum + campo factoryId)
- [ ] Actualizar src/types/auth.types.ts si importa Role
      Fase 2: Seguridad y Rutas (CRÍTICO)
- [ ] Actualizar src/config/routes.config.ts (agregar OWNER a rutas permitidas)
- [ ] Verificar src/components/guards/RoleGuard.tsx (asegurar compatibilidad)
- [ ] Actualizar src/pages/admin/LoginPage.tsx (redirección post-login)
      Fase 3: Navegación (ALTA PRIORIDAD)
- [ ] Actualizar src/components/admin/components/AdminSidebar.tsx (menú lateral)
- [ ] Actualizar src/pages/public/UserPortal/layout/UserPortalLayout.tsx (enlace panel admin)
      Fase 4: Gestión de Usuarios (ALTA PRIORIDAD)
- [ ] Actualizar src/pages/admin/components/users/UserModal.tsx (campo factoryId + validaciones)
- [ ] Actualizar src/pages/admin/UsersPage.tsx (mostrar factoryId en grid)
      Fase 5: Configuración (MEDIA PRIORIDAD)
- [ ] Actualizar src/pages/admin/doc-config/DocConfigPage.tsx (permitir edición a OWNER)
      Fase 6: UI/UX (BAJA PRIORIDAD - Opcional)
- [ ] Agregar badge/color distintivo para OWNER en componentes visuales
- [ ] Actualizar iconografía si es necesario

---

⚠️ Consideraciones de Seguridad

1. Factory Scoping
   El backend filtra automáticamente por factoryId extraído del JWT, pero el frontend debe:

- ✅ Mostrar el factoryId en interfaces de admin (solo lectura)
- ✅ Validar que usuarios OWNER no puedan modificar factoryId de otros usuarios
- ✅ NO confiar en filtros del frontend - el backend es la fuente de verdad

2. Creación de Usuarios por OWNER

- OWNER puede crear usuarios SALES y USER
- Frontend debe limitar el dropdown de roles a ["SALES", "USER"] cuando el usuario autenticado es OWNER
- Validación adicional: Campo factoryId automáticamente heredado del OWNER (no editable)

3. Validaciones Backend
   El backend ya implementa (según docs):

- ✅ FactoryScopeGuard - Filtra recursos por factoryId
- ✅ @Roles(Role.OWNER) - Decoradores de autorización
- ✅ JWT incluye factoryId para usuarios OWNER

Decisiones Confirmadas

1. Dashboard: ❌ OWNER NO accede al Dashboard
2. Campo factoryId: Se hereda automáticamente del usuario ADMIN/OWNER que crea el usuario
3. Identificación visual: ✅ Color distintivo para OWNER (ej: morado/púrpura)
4. Creación de usuarios: OWNER siempre asigna su propio factoryId a SALES/USER que crea

---

📋 Plan de Implementación Final
Archivos a Modificar: 11 archivos
FASE 1: Definiciones Base (2 archivos)

1. ✅ src/interfases/user.interfase.ts
   - Agregar OWNER: "OWNER" al enum Role
   - Agregar factoryId?: string a la interfaz User
2. ✅ src/types/auth.types.ts (verificar si importa Role)

---

FASE 2: Seguridad y Rutas (3 archivos) 3. ✅ src/config/routes.config.ts

- Agregar OWNER a: /quote, /admin (layout), /admin/orders, /admin/users, /admin/customers, /admin/discount-rules, /admin/doc-config
- User Portal: Agregar OWNER a rutas hijas
- Dashboard: NO agregar OWNER (mantener solo ADMIN)

4. ✅ src/components/guards/RoleGuard.tsx
   - Verificar que la lógica actual soporte el nuevo rol
5. ✅ src/pages/admin/LoginPage.tsx
   - Línea 56: Agregar userRoles.includes(UserRole.OWNER) a la condición de redirección

---

FASE 3: Navegación (2 archivos) 6. ✅ src/components/admin/components/AdminSidebar.tsx

- Dashboard: Mantener solo ["ADMIN"]
- Presupuestador: ["ADMIN", "OWNER", "SALES"]
- Órdenes: ["ADMIN", "OWNER", "SALES"]
- Sección Configuración: ["ADMIN", "OWNER", "SALES"]
- Usuarios: ["ADMIN", "OWNER"]
- Parametrización: Mantener solo ["ADMIN"]

7. ✅ src/pages/public/UserPortal/layout/UserPortalLayout.tsx
   - Agregar OWNER a la condición isAdminOrSales (renombrar a isAdminOrOwnerOrSales)

---

FASE 4: Gestión de Usuarios (2 archivos) 8. ✅ src/pages/admin/components/users/UserModal.tsx

- Campo factoryId:
  - Auto-rellenado con el factoryId del usuario autenticado (solo lectura)
  - Mostrar solo si el rol seleccionado incluye OWNER
- Dropdown de roles:
  - Si usuario autenticado es OWNER: Limitar a [SALES, USER]
  - Si usuario autenticado es ADMIN: Mostrar todos [ADMIN, OWNER, SALES, USER, WORKER]
- Validación: Si se selecciona OWNER, factoryId es obligatorio

9. ✅ src/pages/admin/UsersPage.tsx
   - Agregar columna factoryId en DataGrid (opcional, visible solo para usuarios OWNER)
   - Agregar chip con color distintivo para rol OWNER (morado/púrpura)

---

FASE 5: Configuración (1 archivo) 10. ✅ src/pages/admin/doc-config/DocConfigPage.tsx - Cambiar isAdmin por canEdit = user?.roles.includes("ADMIN") || user?.roles.includes("OWNER")

---

FASE 6: UI/UX (1+ archivos) 11. ✅ Componentes con visualización de roles (agregar color distintivo): - src/pages/admin/UsersPage.tsx - Chips en DataGrid - src/pages/public/QuoteWizard/steps/components/step5/RequesterInfo.tsx - Chips de roles - Otros componentes que muestran roles con Chips de MUI
Esquema de colores sugerido:
const getRoleColor = (role: string) => {
switch(role) {
case "ADMIN": return "primary"; // Azul
case "OWNER": return "secondary"; // Morado/Púrpura
case "SALES": return "success"; // Verde
case "USER": return "info"; // Cyan
case "WORKER": return "warning"; // Naranja
default: return "default";
}
};

---

🎨 Wireframe de Cambios en UI
Modal de Creación de Usuario (si usuario es OWNER)
┌─────────────────────────────────────┐
│ Crear Usuario │
├─────────────────────────────────────┤
│ Username: [____________] │
│ Password: [____________] │
│ Name: [____________] │
│ Email: [____________] │
│ │
│ Roles: [▼ Seleccionar roles] │
│ ☑ SALES ☐ USER │ ← Solo SALES y USER disponibles
│ (ADMIN, OWNER, WORKER │ para usuarios OWNER
│ no disponibles) │
│ │
│ ℹ️ Los usuarios creados heredarán │
│ tu factoryId automáticamente │
│ │
│ [Cancelar] [Crear Usuario] │
└─────────────────────────────────────┘
Modal de Creación de Usuario (si usuario es ADMIN)
┌─────────────────────────────────────┐
│ Crear Usuario │
├─────────────────────────────────────┤
│ Username: [____________] │
│ Password: [____________] │
│ Name: [____________] │
│ Email: [____________] │
│ │
│ Roles: [▼ Seleccionar roles] │
│ ☐ ADMIN ☐ OWNER │ ← Todos los roles disponibles
│ ☐ SALES ☐ USER │
│ ☐ WORKER │
│ │
│ ⚠️ Si seleccionas OWNER: │ ← Mostrar solo si OWNER está
│ Factory ID: [___________] (required) │ seleccionado
│ │
│ [Cancelar] [Crear Usuario] │
└─────────────────────────────────────┘
DataGrid de Usuarios (vista ADMIN)
┌───────────┬──────────┬──────────────────┬────────────────┐
│ Username │ Name │ Roles │ Factory ID │
├───────────┼──────────┼──────────────────┼────────────────┤
│ admin1 │ Carlos R │ ADMIN │ - │
│ owner1 │ Juan G │ OWNER │ 65d8f1f77bcf │ ← Color morado
│ sales1 │ María L │ SALES │ 65d8f1f77bcf │
│ user1 │ Ana M │ USER │ - │
└───────────┴──────────┴──────────────────┴────────────────┘

---

## 🧪 Testing Sugerido (Después de Implementación)

### **Caso 1: Login como OWNER**

- ✅ Redirige a `/admin/orders`
- ✅ Sidebar muestra: Presupuestador, Órdenes, Configuración (Usuarios, Clientes, Descuentos, Doc Config)
- ❌ Sidebar NO muestra: Dashboard, Parametrización

### **Caso 2: OWNER crea usuario SALES**

- ✅ Dropdown de roles solo muestra SALES y USER
- ✅ `factoryId` se hereda automáticamente (no editable)
- ✅ Usuario creado tiene el mismo `factoryId` que el OWNER

### **Caso 3: OWNER intenta acceder a `/admin/materials`**

- ✅ RoleGuard redirige a ForbiddenPage (403)

### **Caso 4: OWNER edita configuración de documentos**

- ✅ Formulario está habilitado (no readonly)
- ✅ Cambios se guardan correctamente

### **Caso 5: OWNER ve lista de órdenes**

- ✅ Backend filtra automáticamente por `factoryId`
- ✅ Solo ve órdenes de su fábrica

---

📦 Resumen de Cambios
Categoría Archivos Afectados Líneas Estimadas Complejidad
Definiciones 2 ~10 Baja
Seguridad/Rutas 3 ~30 Media
Navegación 2 ~20 Baja
Gestión Usuarios 2 ~80 Alta
Configuración 1 ~5 Baja
UI/UX 3+ ~30 Media
TOTAL 11-13 ~175 Media
