# Plan de Desarrollo: Agregar Piezas Adicionales en Step 2

## Descripción

Nueva funcionalidad para permitir al usuario agregar, eliminar y reordenar piezas en el Step 2 del wizard de presupuestos. Esto permite controlar cuántas piezas tiene una encimera cuando no son las formas estándar.

## Resumen

- El usuario puede agregar piezas personalizadas adicionales a un presupuesto
- El `selectedShapeId` será `"CUSTOM"` cuando existan piezas personalizadas
- Cada pieza puede tener material diferente, medidas propias y tipo de conexión
- Se pueden reordenar y eliminar cualquier pieza

---

## 1. Modelo de Datos

### 1.1 QuoteInterfases.tsx

**Cambio**: Extender `PieceLayout.connectionType`

```typescript
// Antes
connectionType: "NONE" | "LINEAR" | "CORNER_LEFT" | "CORNER_RIGHT";

// Después
connectionType: "NONE" | "LINEAR" | "CORNER_RIGHT" | "CORNER_LEFT" | "CUSTOM";
```

---

## 2. Estado Global (Reducer)

### 2.1 QuoteActions.tsx

**Agregar acciones**:

```typescript
| { type: "ADD_EXTRA_PIECE"; payload: {
    materialId: string;
    selectedAttributes: SelectedAttributes;
    measurements: { length_mm: number; width_mm: number };
    connectionType: "LINEAR" | "CORNER_LEFT" | "CORNER_RIGHT";
  } }
| { type: "REMOVE_PIECE"; payload: { pieceIndex: number } }
| { type: "UPDATE_PIECE_ORDER"; payload: { fromIndex: number; toIndex: number } }
```

### 2.2 QuoteReducer.tsx

**Implementar casos**:

- `ADD_EXTRA_PIECE`: Crear pieza con layout CUSTOM, connectionType LINEAR, medidas 1200x600 por defecto, agregar al final del array
- `REMOVE_PIECE`: Eliminar pieza del array
- `UPDATE_PIECE_ORDER`: Reordenar array con splice
- Al agregar/eliminar/modificar piezas → actualizar `selectedShapeId = "CUSTOM"`

---

## 3. Hook Step 2

### 3.1 useWizardStep2.ts

**Agregar estados y funciones**:

- `isAddPieceModalOpen: boolean`
- `handleAddPiece(payload)`: Dispatch `ADD_EXTRA_PIECE`
- `handleRemovePiece(index)`: Dispatch `REMOVE_PIECE`
- `handleReorderPiece(fromIndex, toIndex)`: Dispatch `UPDATE_PIECE_ORDER`

---

## 4. UI - Componentes

### 4.1 MeasuresEditorView.tsx

**Cambios**:

- Agregar botón "Agregar Pieza" después del grid de piezas
- Pasar funciones de eliminar y reordenar a cada `PieceMeasuresCard`

### 4.2 PieceMeasuresCard.tsx

**Agregar controles inline**:

- Inputs de medidas (Length/Width) - editables directamente
- Select de Connection Type (LINEAR / CORNER_LEFT / CORNER_RIGHT)
- Botón eliminar (🗑️)
- Botones reordenar (↑/↓)

### 4.3 MaterialAttributeModal.tsx

**Agregar prop**:

- `showMeasurementsAndConnection?: boolean`

**Cuando está activo, mostrar**:

- Campo Length (mm) - default 1200
- Campo Width (mm) - default 600
- Select Connection Type - default LINEAR

---

## 5. Visualización

### 5.1 encimera-preview.tsx

**Cambios**:

- Detectar `selectedShapeId === "CUSTOM"`
- Renderizar piezas en línea horizontal usando connectionType LINEAR
- Respetar orden del array mainPieces

### 5.2 Countertop3DViewer.tsx

**Sin cambios** (por ahora)

---

## 6. Flujo del Usuario

1. Step 1 → seleccionar material base
2. Step 2 → seleccionar forma estándar (LINEAL, L, U)
3. Se generan piezas según la forma seleccionada
4. Usuario hace clic en "Agregar Pieza"
5. Modal: selecciona material + define medidas (1200x600 default) + selecciona connectionType (LINEAR default)
6. Pieza se agrega al final con layout CUSTOM, selectedShapeId = "CUSTOM"
7. Usuario puede:
   - Reordenar piezas (↑/↓)
   - Eliminar cualquier pieza
   - Cambiar material de cada pieza
   - Editar medidas de cada pieza (length/width)
   - Editar connectionType de cada pieza

---

## 7. Consideraciones

### API

- La API de cálculo (`POST /quotes/calculate`) ya soporta array de piezas con diferentes materiales y medidas
- No se requieren cambios en el backend

### Valores por defecto

- Medidas de nuevas piezas: 1200x600 mm
- Connection Type por defecto: LINEAR
- Posición: al final del array

### Backwards Compatibility

- Las formas estándar existentes (LINEAR_SQUARE, L_LEFT, etc.) funcionan igual
- Solo cambia a "CUSTOM" cuando el usuario modifica el set de piezas

---

## 8. Archivos a Modificar

| Archivo                                                                      | Acción                  |
| ---------------------------------------------------------------------------- | ----------------------- |
| `src/context/QuoteInterfases.tsx`                                            | Extender connectionType |
| `src/context/QuoteActions.tsx`                                               | Agregar nuevas acciones |
| `src/context/QuoteReducer.tsx`                                               | Implementar casos       |
| `src/pages/public/QuoteWizard/steps/components/step2/useWizardStep2.ts`      | Agregar funciones       |
| `src/pages/public/QuoteWizard/steps/components/step2/MeasuresEditorView.tsx` | Agregar botón           |
| `src/pages/public/QuoteWizard/steps/components/step2/PieceMeasuresCard.tsx`  | Agregar controles       |
| `src/pages/public/common/MaterialAttributeModal.tsx`                         | Agregar prop            |

---

## 9. Estado: ✅ Implementado

**Fecha de creación**: 2026-04-07
**Última actualización**: 2026-04-08

---

## 10. Historial de Cambios

### 2026-04-07 - Implementación Inicial

- Extendido `connectionType` en `QuoteInterfases.tsx` para incluir "CUSTOM"
- Agregadas acciones `ADD_EXTRA_PIECE`, `REMOVE_PIECE`, `UPDATE_PIECE_ORDER` en `QuoteActions.tsx`
- Implementados casos correspondientes en `QuoteReducer.tsx`
- Agregadas funciones en `useWizardStep2.ts` para gestionar piezas
- Creado `AddPieceModal.tsx` para agregar nuevas piezas con material, medidas y connectionType
- Actualizado `MeasuresEditorView.tsx` con botón "Agregar Pieza"
- Actualizado `PieceMeasuresCard.tsx` con controles de reorder (↑/↓), eliminar y edición de connectionType
- Actualizado `WizardStep2_ShapeAndMeasures.tsx` para integrar el modal de agregar pieza

### 2026-04-08 - Sistema de Tracking de Piezas Originales

**Cambios implementados:**

1. **QuoteInterfases.tsx:72-75** - Nuevo campo en `MainPiece`:

   ```typescript
   originalShapeIndex?: number;
   ```

   Indica el índice de la pieza dentro de la forma base. Las piezas nuevas (extras) no lo tendrán → `undefined`.

2. **QuoteReducer.tsx:97-99** - Asignación al crear piezas iniciales:

   ```typescript
   newPiece.originalShapeIndex = i;
   ```

   Las piezas nuevas creadas con `ADD_EXTRA_PIECE` NO reciben este campo (quedan `undefined`).

3. **encimera-preview.tsx:63** - `data-id` dinámico:

   ```typescript
   data-id={`p${index + 1}`}
   ```

   Ahora refleja la posición actual de la pieza (`p1`, `p2`, `p3`...) en vez del ID estático del shape.

4. **PieceMeasuresCard.tsx:42-44, 155, 158** - Lógica del preview:
   ```typescript
   const effectiveHighlightIndex = piece.originalShapeIndex !== undefined ? piece.originalShapeIndex : null;
   ```

   - **Pieza original** (tiene `originalShapeIndex`): resalta su pieza correspondiente en el preview, aunque se reorganice
   - **Pieza nueva** (sin `originalShapeIndex`): muestra todo el preview en inactivo
   - El caption ahora dice "Pieza adicional" para piezas extras

**Comportamiento resultante:**

| Escenario      | Pieza original (p1)    |
| -------------- | ---------------------- |
| Estado preview | p1 activa, p2 inactiva |
| Al reorganizar | Mantiene su preview    |
| data-id        | "p1","p2"              |

Los `REMOVE_PIECE` y `UPDATE_PIECE_ORDER` usan spread `{...piece, ...}` que preserva `originalShapeIndex` intacto.
