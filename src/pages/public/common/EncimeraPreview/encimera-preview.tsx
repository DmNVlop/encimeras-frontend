import PropTypes from "prop-types";
import "./encimera-preview.css";
import type { EncimeraPreviewProps } from "./encimera-preview.interfase";

/**
 * Un componente atómico que renderiza una visualización de una configuración
 * de encimera, usando CSS Grid.
 */
const EncimeraPreview: React.FC<EncimeraPreviewProps> = ({ config }) => {
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
  const containerStyle = {
    gridTemplateColumns: grid.columns,
    gridTemplateRows: grid.rows,
    aspectRatio: grid.aspectRatio || "auto", // Fallback por si no se define
  };

  return (
    <div className="encimera-preview-container" style={containerStyle}>
      {/* --- Renderizado de Piezas --- */}
      {/* Iteramos sobre el array de piezas y creamos un div por cada una */}
      {pieces.map((piece) => {
        // Calculamos los estilos dinámicos para cada pieza
        const pieceStyle = {
          gridArea: piece.area,
          // Aplicamos borderRadius solo si está definido en el objeto piece
          ...(piece.borderRadius && { borderRadius: piece.borderRadius }),
        };

        return (
          <div
            key={piece.id} // La key es esencial para React
            className="encimera-pieza"
            style={pieceStyle}
            data-id={piece.id} // Útil para debug
          />
        );
      })}
    </div>
  );
};

// --- PropTypes para Desarrollo ---
// Esto te avisará en la consola si pasas props incorrectas
EncimeraPreview.propTypes = {
  /**
   * El objeto de configuración que define la forma de la encimera.
   */
  config: PropTypes.shape({
    /**
     * ID único para la configuración (usado en el .map() padre)
     */
    id: PropTypes.string.isRequired,
    /**
     * Definición de la cuadrícula (el lienzo)
     */
    grid: PropTypes.shape({
      columns: PropTypes.string.isRequired,
      rows: PropTypes.string.isRequired,
      aspectRatio: PropTypes.string,
    }).isRequired,
    /**
     * Array de objetos, donde cada objeto es una pieza de la encimera
     */
    pieces: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        area: PropTypes.string.isRequired,
        borderRadius: PropTypes.string,
      })
    ).isRequired,
  }),
};

// Valor por defecto en caso de que la prop llegue undefined
EncimeraPreview.defaultProps = {
  config: null,
};

export default EncimeraPreview;
