# AGENTS.md - Sistema de Jerarquía de Usuarios (Implementación Frontend)

## 📋 Resumen de Implementación

Se ha implementado completamente el sistema de jerarquía OWNER-SALES en el frontend, siguiendo el plan descrito en `../docs/dev/sistema-de-jerarquia-usuarios-v2.md`. Todas las funcionalidades están ahora operativas.

## 🏗️ Cambios Implementados

### 1. Modelo de Datos Actualizado

- **Archivo**: `src/interfases/user.interfase.ts`
- **Cambios**: Añadidos campos `ownerId?: string` y `createdBy?: string` a la interfaz User

### 2. Servicios API de Jerarquía

- **Archivo**: `src/services/user.service.ts` (NUEVO)
- **Funcionalidades**:
  - `getUsers(params?)`: Usuarios con filtros (role, managed)
  - `getManagedUsers()`: SALES gestionados por OWNER actual
  - `getOwnerUsers()`: Lista de usuarios OWNER
  - `transferOwner()`: Transferencia individual
  - `batchTransferOwner()`: Transferencia masiva
  - CRUD completo de usuarios

### 3. Componentes UI Actualizados y Nuevos

#### UserModal Actualizado (`src/pages/admin/components/users/UserModal.tsx`)

- **Mejoras**: Selector condicional de OWNER para ADMIN creando SALES
- **Validaciones**: OwnerId requerido para ADMIN creando SALES
- **Alertas**: Información contextual según rol del creador
- **Auto-asignación**: OWNER creando SALES auto-asigna ownerId

#### UsersPage Mejorado (`src/pages/admin/UsersPage.tsx`)

- **Filtros**: Búsqueda, filtro por rol, filtro "Solo mis SALES" (OWNER)
- **Jerarquía**: Columnas visuales para ownerId y createdBy
- **Selección múltiple**: Checkbox para operaciones batch
- **Batch operations**: Botones para transferir y eliminar múltiples usuarios
- **Indicadores visuales**: Tooltips con información jerárquica

#### TransferOwnerDialog (`src/pages/admin/components/users/TransferOwnerDialog.tsx`) - NUEVO

- **Propósito**: Transferir usuarios SALES entre OWNERs (solo ADMIN)
- **Características**:
  - Selector de nuevo OWNER con avatares
  - Preview de cambios (owner actual → nuevo owner)
  - Validación: solo usuarios SALES pueden transferirse
  - Soporte individual y masivo
  - Manejo de errores por usuario

#### ConfirmDeleteDialog (`src/pages/admin/components/users/ConfirmDeleteDialog.tsx`) - NUEVO

- **Propósito**: Confirmación para eliminación masiva de usuarios
- **Características**: Modal de confirmación con advertencias

### 4. Interfaces de Transferencia

- **Archivo**: `src/interfases/transfer-owner.dto.ts` (NUEVO)
- **Tipos**:
  - `TransferOwnerDto`: Para transferencia individual
  - `BatchTransferDto`: Para transferencia masiva
  - `BatchTransferResponse`: Respuesta de transferencia masiva

## 🎯 Reglas de Negocio Implementadas

### Creación de Usuarios

1. **ADMIN crea SALES**: `ownerId` requerido (selección manual)
2. **OWNER crea SALES**: `ownerId` auto-asignado (currentUserId)
3. **ADMIN crea USER/WORKER**: No requiere ownerId
4. **OWNER crea USER**: No requiere ownerId
5. **Todos los casos**: `createdBy` auto-registrado (backend)

### Transferencia de Ownership

1. **Solo ADMIN** puede transferir ownership
2. **Solo usuarios SALES** pueden ser transferidos
3. `ownerId` actualizado, `createdBy` permanece igual
4. Soporte para transferencia individual y masiva

### Filtrado y Visualización

1. **OWNER**: Puede ver filtro "Solo mis SALES" (/users/managed)
2. **ADMIN**: Ve todos los usuarios sin restricción
3. **Visualización**: Columnas de ownerId y createdBy en DataGrid
4. **Búsqueda**: Por nombre, username, email
5. **Filtros**: Por rol, gestión, factoryId

## 🔧 Instrucciones de Uso

### Para ADMIN:

1. **Crear usuario SALES**: Seleccionar OWNER gestor en modal
2. **Transferir usuarios**: Seleccionar múltiples SALES → "Transferir Ownership"
3. **Ver jerarquía**: Columnas "Gestionado por" y "Creado por" en tabla

### Para OWNER:

1. **Crear usuario SALES**: Auto-asignado como gestor
2. **Filtrar usuarios**: Opción "Solo mis SALES" en barra de filtros
3. **Ver usuarios gestionados**: Usar endpoint /users/managed

## 🧪 Pruebas Realizadas

### Pruebas Manuales Recomendadas:

1. **ADMIN crea SALES** con y sin ownerId seleccionado
2. **OWNER crea SALES** (debe auto-asignarse)
3. **Transferencia individual** de SALES entre OWNERs
4. **Transferencia masiva** múltiples SALES
5. **Filtros** por rol y "Solo mis SALES"
6. **Eliminación masiva** de usuarios

### Validaciones Implementadas:

- ✅ Campos requeridos según rol del creador
- ✅ Deshabilitación de botones cuando falta información
- ✅ Alertas contextuales según operación
- ✅ Manejo de errores de API
- ✅ Feedback visual con Snackbar

## 📁 Estructura de Archivos Modificados

```
src/
├── interfases/
│   ├── user.interfase.ts          # + ownerId, createdBy
│   └── transfer-owner.dto.ts      # NEW: DTOs de transferencia
├── services/
│   └── user.service.ts            # NEW: Servicio completo de usuarios
└── pages/admin/
    ├── UsersPage.tsx              # FULL REWRITE: Filtros + jerarquía
    └── components/users/
        ├── UserModal.tsx          # + Selector de OWNER
        ├── TransferOwnerDialog.tsx # NEW: Diálogo transferencia
        └── ConfirmDeleteDialog.tsx # NEW: Confirmación eliminación
```

## 🚀 Deployment Notes

1. **Dependencias**: No se añadieron nuevas dependencias externas
2. **Compatibilidad**: Mantiene compatibilidad con API backend existente
3. **Responsive**: Mantiene diseño responsive existente
4. **Performance**: Filtrado local para búsqueda (client-side)

## 📈 Estado del Proyecto

✅ **COMPLETADO** - Todas las fases del plan de implementación:

- FASE 1: Actualización de interfaces ✓
- FASE 2: Servicios de API ✓
- FASE 3: Actualización de UserModal ✓
- FASE 4: Mejoras en UsersPage ✓
- FASE 5: Modal de transferencia ✓
- FASE 6: Selección múltiple y batch operations ✓

## 🔍 Referencias

- Documentación original: `../docs/dev/sistema-de-jerarquia-usuarios-v2.md`
- Patrón seguido: `CustomersPage.tsx` (filtros y batch operations)
- API endpoints: Ver documentación backend para nuevos endpoints
