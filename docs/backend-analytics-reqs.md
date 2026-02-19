# Propuesta Técnica: Módulo de Analíticas y KPIs para Admin Dashboard

Este documento detalla los cálculos, indicadores y la estructura de datos requerida para el desarrollo de un endpoint de analíticas en el backend, basado en la información gestionada por el `QuoteContext` del frontend.

## 1. Contexto de Datos

El sistema gestiona presupuestos (Orders/Drafts) compuestos por:

- **Piezas (`mainPieces`):** Dimensiones, materiales y formas.
- **Accesorios (`appliedAddons`):** Mecanizados, cantos y extras.
- **Resultados (`calculationResult`):** Puntos/Precios calculados.

---

## 2. Indicadores Clave (KPIs)

### A. Rendimiento Comercial

1. **Volumen de Cotizaciones:** Conteo total de registros en la tabla `orders` filtrados por rango de fecha.
2. **Valor Medio de Proyecto:** `SUM(currentPricePoints) / COUNT(orders)`.
3. **Ratio de Complejidad:** Promedio de piezas por presupuesto (`AVG(count(mainPieces))`).
4. **Tasa de Recálculo:** Porcentaje de presupuestos donde `recalculated: true`. Indica impacto de cambios de precio en el tiempo.

### B. Análisis de Producto (Demanda)

1. **Ranking de Materiales:** Agrupación por `materialId`.
   - _Métrica:_ Frecuencia de uso y valor total generado por material.
2. **Distribución de Formas:** Agrupación por `selectedShapeId` (ej: LINEAL, L_SHAPE, U_SHAPE).
   - _Métrica:_ Porcentaje del total de proyectos.
3. **Penetración de Accesorios:** Agrupación por `appliedAddons.code`.
   - _Métrica:_ ¿En qué % de proyectos aparece el accesorio 'FREGADERO' o 'COPETE'?

### C. Métricas Operativas y Logísticas

1. **Metraje Cuadrado Total (m²):**
   - _Cálculo:_ `SUM(piece.length_mm * piece.width_mm) / 1,000,000`.
   - Útil para previsión de stock de tableros/planchas.
2. **Metraje Lineal de Cantos (ml):**
   - _Cálculo:_ Suma de perímetros o longitudes extraídas de los `appliedAddons` con categoría de canteado.

---

## 3. Propuesta de Endpoint API

Se solicita la creación de una ruta: `GET /admin/analytics/summary`

### Parámetros de Filtro (Query Params)

- `startDate`: ISO Date
- `endDate`: ISO Date
- `status`: ['draft', 'order', 'all']
- `factoryId`: (Opcional, para multi-fábrica)

### Estructura de Respuesta (Sugerida)

```json
{
  "summary": {
    "totalQuotes": 150,
    "totalPoints": 450000,
    "avgPointsPerProject": 3000,
    "totalSqm": 124.5,
    "avgPiecesPerProject": 2.3
  },
  "charts": {
    "materials": [
      { "id": "HPL_OAK", "name": "Roble Natural", "count": 45, "percentage": 30 },
      { "id": "HPL_WHITE", "name": "Blanco Polar", "count": 30, "percentage": 20 }
    ],
    "shapes": [
      { "id": "LINEAL", "label": "Recta", "value": 80 },
      { "id": "L_SHAPE", "label": "En L", "value": 50 },
      { "id": "U_SHAPE", "label": "En U", "value": 20 }
    ],
    "addons": [
      { "code": "SINK_HOLE", "label": "Hueco Fregadero", "count": 120 },
      { "code": "BACKSPLASH", "label": "Copete", "count": 95 }
    ]
  },
  "trends": {
    "dailyQuotes": [
      { "date": "2024-03-01", "count": 5, "points": 12000 },
      { "date": "2024-03-02", "count": 8, "points": 19500 }
    ]
  }
}
```

---

## 4. Consideraciones Técnicas para Backend

1. **Agregaciones:** Se recomienda el uso de `Aggregation Framework` (si se usa MongoDB) o consultas `GROUP BY` complejas para evitar procesar miles de registros en memoria.
2. **Campos Anidados:** El cálculo de m² requiere iterar sobre el array `mainPieces`. Es ideal realizar este cálculo en base de datos.
3. **Caché:** Debido a que estos cálculos pueden ser pesados, se sugiere un TTL de caché de 15-30 minutos para el dashboard de administración.
4. **Permisos:** Esta ruta debe estar protegida estrictamente bajo el rol `ADMIN`.
