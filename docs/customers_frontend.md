# Documentación Técnica: Módulos de Clientes y Reglas de Descuento (Frontend)

Este documento detalla la implementación técnica, arquitectura y diseño de los módulos de Gestión de Clientes y Motor de Reglas de Descuento dentro de la plataforma de presupuesto de encimeras.

## 1. Arquitectura de Módulos

Ambos módulos han sido integrados en la sección de administración (`/admin`), siguiendo una estructura de componentes desacoplados y servicios centralizados.

### Estructura de Archivos

```text
src/
├── interfases/
│   ├── customer.interfase.ts        # Tipos y Enums de Clientes
│   └── discount-rule.interfase.ts   # Tipos y Enums de Reglas de Descuento
├── services/
│   ├── customer.service.ts         # Métodos API para Clientes
│   └── discount-rule.service.ts    # Métodos API para Reglas
└── pages/admin/
    ├── CustomersPage.tsx           # Vista principal de Clientes
    ├── DiscountRulesPage.tsx       # Vista principal de Descuentos
    ├── customers/
    │   ├── CustomerList.tsx        # Contenedor de lista
    │   ├── CustomerItem.tsx        # Fila/Card de cliente
    │   └── CustomerDrawer.tsx      # Formulario lateral de edición
    └── discount-rules/
        ├── DiscountRuleItem.tsx    # Card de regla de descuento
        └── DiscountRuleDrawer.tsx  # Formulario lateral de reglas
```

## 2. Modelado de Datos (Interfaces)

### ICustomer

El modelo de cliente es híbrido, soportando dos perfiles mediante el enum `CustomerType`:

- **Individual**: Requiere `firstName` y `lastName`.
- **Company**: Requiere `officialName` (Razón Social).
- **Campos comunes**: `nif`, `commercialName`, `address` (objeto completo), `contact` (email/phone), `isActive`.

### IDiscountRule

Define la lógica del motor de precios dinámicos:

- **Type**: `PERCENTAGE` o `FIXED_AMOUNT`.
- **Scope**: `GLOBAL_TOTAL`, `SPECIFIC_MATERIALS`, `MATERIAL_CATEGORIES`.
- **Priority**: Valor numérico (mayor = se aplica primero).
- **CollisionStrategy**: Define qué hacer cuando varias reglas coinciden (`SUM`, `MAX`, `MIN`, `CASCADE`).
- **Conditions**: Objeto que incluye `startDate`, `endDate`, `minOrderValue` y `customerStrategy`.

## 3. Implementación de UI/UX

Se ha seguido una estética **Premium Modern (Glassmorphism)** alineada con el Dashboard principal.

### Patrones de Diseño Utilizados

- **List-Detail (Drawer)**: En lugar de navegación a páginas separadas, se utiliza un `Drawer` lateral derecho para mantener el contexto de la lista principal.
- **Micro-interacciones**: Transiciones suaves en hover (elevación y bordes de color), estados de carga con skeletons y chips informativos de alta visibilidad.
- **Glassmorphism**: Uso de `backdropFilter: blur(20px)`, transparencias con `alpha()` y bordes sutiles para un look técnico y limpio.
- **Responsive Design**: Los formularios se adaptan de 700px (desktop) a ancho completo (mobile), utilizando el sistema de `Grid` de MUI v6.

## 4. Lógica de Negocio y Seguridad

### Gestión de Reglas de Descuento

El frontend permite configurar la lógica compleja que luego procesa el backend:

1. **Priorización**: Las reglas se visualizan con su nivel de prioridad para que el admin entienda el orden de procesamiento.
2. **Exclusividad**: Campo `stackable` para definir si un descuento puede sumarse a otros o es exclusivo.
3. **Status Control**: Posibilidad de pausar reglas sin eliminarlas mediante el flag `isActive`.

### Control de Acceso (RBAC)

Las rutas están protegidas en `routes.config.ts`:

- **Clientes**: Accesible por `ADMIN` y `SALES`.
- **Reglas de Descuento**: Solo accesible por `ADMIN`.

## 5. Integración API

Todos los servicios heredan de `api.service.ts`, lo que garantiza:

- **Injectores Automáticos**: Envío del token JWT en cada petición.
- **Manejo de Errores**: Interceptores globales que manejan errores 401 (expiración de sesión) y 403 (permisos).
- **Tipado Genérico**: Las respuestas del API se mapean automáticamente a las interfaces definidas.

## 6. Stack Tecnológico

- **React 19** con Hooks (`useState`, `useEffect`, `useCallback`).
- **Material UI v7** (usando componentes de layout modernos).
- **Axios** para comunicación REST.
- **React Router 7** para gestión de rutas.

---

_Documento generado por Antigravity AI - 24/02/2026_
