import type { ShapeVariation } from "../../../interfases/shape-variation.interfase";

// --- Define Shape Variations ---
export const shapeVariations: ShapeVariation[] = [
  // --- LINEAL ---
  {
    id: "LINEAR_SQUARE",
    group: "LINEAL",
    name: "Pieza/Isla Recto",
    count: 1,
    grid: { columns: "1fr 1fr", rows: "1fr", aspectRatio: "3 / 1" }, // Rectangular
    pieces: [{ id: "p1", area: "1 / 1 / 2 / 3" }],
    defaultMeasurements: [{ length_mm: 2000, width_mm: 600 }],
  },
  {
    id: "LINEAR_RADIUS_CORNER",
    group: "LINEAL",
    name: "Pieza/Isla Redondo",
    count: 1,
    grid: { columns: "1fr 1fr", rows: "1fr", aspectRatio: "3 / 1" },
    pieces: [{ id: "p1", area: "1 / 1 / 2 / 3", borderRadius: "200px 200px 200px 200px" }],
    defaultMeasurements: [{ length_mm: 2000, width_mm: 600 }],
  },
  {
    id: "LINEAR_CIRCLE",
    group: "LINEAL",
    name: "Pieza/Isla Circular",
    count: 1,
    grid: { columns: "1fr", rows: "1fr", aspectRatio: "1 / 1" },
    pieces: [{ id: "p1", area: "1 / 1 / 2 / 2", borderRadius: "50%" }],
    defaultMeasurements: [{ length_mm: 1200, width_mm: 1200 }],
  },

  // --- FORMA L ---
  {
    id: "L_LEFT",
    group: "FORMA L",
    name: "Al Tope pieza Derecha",
    count: 2,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "1 / 1 / 3 / 2" }, // Pieza 1 (Vertical)
      { id: "p2", area: "1 / 2 / 2 / 4" }, // Pieza 2 (Horizontal)
    ],
    defaultMeasurements: [
      { length_mm: 2000, width_mm: 600 },
      { length_mm: 1200, width_mm: 600 },
    ],
    piecesLayout: [
      // PIEZA 1: La Vertical (Izquierda)
      // Es la "Dueña de la esquina" (llega hasta el final)
      {
        order: 0,
        rotation: 90, // 90º para que se dibuje vertical
        connectionType: "NONE", // Es la pieza de inicio (Ancla)
        // jointType: undefined // La primera pieza nunca define unión, porque no se une a nada anterior
      },

      // PIEZA 2: La Horizontal (Superior)
      // Comienza DESDE el costado de la anterior
      {
        order: 1,
        rotation: 0, // 0º para que se dibuje horizontal
        connectionType: "CORNER_RIGHT", // Desde la vertical, giramos a la derecha
        jointType: "BUTT", // CLAVE: "A tope". No invade la esquina.
      },
    ],
  },
  {
    id: "L_RIGHT",
    group: "FORMA L",
    name: "En la Esquina pieza derecha",
    count: 2,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "1 / 1 / 2 / 3" }, // Pieza 1 (Vertical)
      { id: "p2", area: "1 / 3 / 3 / 4" }, // Pieza 2 (Horizontal)
    ],
    defaultMeasurements: [
      { length_mm: 1200, width_mm: 600 },
      { length_mm: 2000, width_mm: 600 },
    ],
    piecesLayout: [
      // PIEZA 1: La Vertical (Izquierda)
      // Es la "Dueña de la esquina" (llega hasta el final)
      {
        order: 0,
        rotation: 90, // 90º para que se dibuje vertical
        connectionType: "NONE", // Es la pieza de inicio (Ancla)
        // jointType: undefined // La primera pieza nunca define unión, porque no se une a nada anterior
      },

      // PIEZA 2: La Horizontal (Superior)
      // Comienza DESDE el costado de la anterior
      {
        order: 1,
        rotation: 0, // 0º para que se dibuje horizontal
        connectionType: "CORNER_RIGHT", // Desde la vertical, giramos a la derecha
        jointType: "OVERLAP", // CLAVE: "A tope". No invade la esquina.
      },
    ],
  },

  // --- FORMA U ---
  {
    id: "U_SYMMETRIC_LARGE",
    group: "FORMA U",
    name: "Simétrica Larga",
    count: 3,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "2 / 1 / 3 / 2" }, // Pieza 1 (Izquierda)
      { id: "p2", area: "1 / 1 / 2 / 4" }, // Pieza 2 (Fondo)
      { id: "p3", area: "2 / 3 / 3 / 4" }, // Pieza 3 (Derecha)
    ],
    defaultMeasurements: [
      { length_mm: 1200, width_mm: 600 },
      { length_mm: 1800, width_mm: 600 },
      { length_mm: 1200, width_mm: 600 },
    ],
  },
  {
    id: "U_SYMMETRIC_SHORT",
    group: "FORMA U",
    name: "Simétrica Corta",
    count: 3,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "1 / 1 / 3 / 2" }, // Pieza 1 (Izquierda)
      { id: "p2", area: "1 / 2 / 2 / 3" }, // Pieza 2 (Fondo)
      { id: "p3", area: "1 / 3 / 3 / 4" }, // Pieza 3 (Derecha)
    ],
    defaultMeasurements: [
      { length_mm: 1800, width_mm: 600 },
      { length_mm: 1200, width_mm: 600 },
      { length_mm: 1800, width_mm: 600 },
    ],
  },
  {
    id: "U_ASYMMETRIC_LEFT",
    group: "FORMA U",
    name: "Asimétrica Izquierda",
    count: 3,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "1 / 1 / 3 / 2" }, // Pieza 1 (Izquierda)
      { id: "p2", area: "1 / 2 / 2 / 4" }, // Pieza 2 (Fondo)
      { id: "p3", area: "2 / 3 / 3 / 4" }, // Pieza 3 (Derecha)
    ],
    defaultMeasurements: [
      { length_mm: 1800, width_mm: 600 },
      { length_mm: 1800, width_mm: 600 },
      { length_mm: 1200, width_mm: 600 },
    ],
  },
  {
    id: "U_ASYMMETRIC_RIGHT",
    group: "FORMA U",
    name: "Asimétrica Derecha",
    count: 3,
    grid: { columns: "1fr 1fr 1fr", rows: "1fr 1fr", aspectRatio: "3 / 1" },
    pieces: [
      { id: "p1", area: "2 / 1 / 3 / 2" }, // Pieza 1 (Izquierda)
      { id: "p2", area: "1 / 1 / 2 / 3" }, // Pieza 2 (Fondo)
      { id: "p3", area: "1 / 3 / 3 / 4" }, // Pieza 3 (Derecha)
    ],
    defaultMeasurements: [
      { length_mm: 1200, width_mm: 600 },
      { length_mm: 1800, width_mm: 600 },
      { length_mm: 1800, width_mm: 600 },
    ],
  },
];
