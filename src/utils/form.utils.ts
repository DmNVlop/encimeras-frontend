// src/utils/form.utils.ts
import React from "react";

/**
 * Selecciona todo el texto de un input al recibir foco.
 * Úsalo en el evento onFocus de cualquier TextField o input.
 */
// EJEMPLO DE USO
// <TextField
//   fullWidth
//   label="Largo (mm)"
//   name="length_mm"
//   type="number"
//   value={piece.measurements.length_mm}
//   onChange={(e) => handleMeasureChange(index, "length_mm", e.target.value)}
//   // AQUI LA MAGIA
//   onFocus={selectOnFocus}
//   variant="outlined"
// />
export const selectOnFocus = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  event.target.select();
};

/**
 * Combina tu lógica personalizada con el autoselect.
 * @param callback Tu función original onFocus (opcional)
 */
// EJEMPLO DE USO
// <TextField
//   // Caso 1: Solo select
//   onFocus={withSelectOnFocus()}

//   // Caso 2: Select + Lógica extra
//   onFocus={withSelectOnFocus((e) => {
//       console.log("Input activado", e.target.name);
//       setHelpText("Ingresa medidas en milímetros");
//   })}
// />
export const withSelectOnFocus = (callback?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void) => {
  return (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 1. Ejecutar el select
    event.target.select();

    // 2. Ejecutar la lógica original si existe
    if (callback) {
      callback(event);
    }
  };
};
