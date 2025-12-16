import "./encimera-preview.css";
import type { EncimeraPreviewProps } from "./encimera-preview.interfase";

// Extendemos la interface aquí o en su archivo correspondiente
interface ExtendedProps extends EncimeraPreviewProps {
  highlightIndex?: number | null; // Nueva prop opcional
}

/**
 * Un componente atómico que renderiza una visualización de una configuración
 * de encimera, usando CSS Grid.
 */
const EncimeraPreview: React.FC<ExtendedProps> = ({ config = null, highlightIndex = null }) => {
  // --- Validación de Props (Robustez) ---
  // Validamos que la configuración esencial exista.
  // Si no, devolvemos null para no romper la UI.
  if (!config || !config.grid || !config.grid.columns || !config.grid.rows || !Array.isArray(config.pieces)) {
    // Puedes devolver un placeholder si lo prefieres
    // return <div className="encimera-preview-error">Datos no válidos</div>;
    return null;
  }

  const { grid, pieces } = config;

  // --- Estilos Dinámicos para el Contenedor ---
  // Estos estilos se calculan a partir de las props.
  const containerStyle: React.CSSProperties = {
    display: "grid", // Aseguramos grid aquí por si acaso
    gridTemplateColumns: grid.columns,
    gridTemplateRows: grid.rows,
    aspectRatio: grid.aspectRatio || "auto",
    width: "100%",
    height: "100%",
  };

  return (
    <div className="encimera-preview-container" style={containerStyle}>
      {/* --- Renderizado de Piezas --- */}
      {/* Iteramos sobre el array de piezas y creamos un div por cada una */}
      {pieces.map((piece, index) => {
        // LÓGICA DE ESTADO:
        // 1. Si no hay highlightIndex, todas se ven normales (default).
        // 2. Si hay highlightIndex y coincide con index -> 'is-active'.
        // 3. Si hay highlightIndex y NO coincide -> 'is-inactive'.
        // Calculamos los estilos dinámicos para cada pieza

        let stateClass = "";
        if (highlightIndex !== null && highlightIndex !== undefined) {
          stateClass = index === highlightIndex ? "is-active" : "is-inactive";
        }

        const pieceStyle = {
          gridArea: piece.area,
          // Aplicamos borderRadius solo si está definido en el objeto piece
          ...(piece.borderRadius && { borderRadius: piece.borderRadius }),
        };

        return (
          <div
            key={piece.id || index} // La key es esencial para React
            className={`encimera-pieza ${stateClass}`}
            style={pieceStyle}
            data-id={piece.id} // Útil para debug
          />
        );
      })}
    </div>
  );
};

export default EncimeraPreview;
