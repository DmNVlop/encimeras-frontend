import React from "react";
import { Box, Button, Grid, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Step2Header } from "./Step2Header";
import { PieceMeasuresCard } from "./PieceMeasuresCard";
import type { MainPiece } from "@/context/QuoteInterfases";
import type { Material } from "@/interfases/materials.interfase";
import type { ShapeVariation } from "@/interfases/shape-variation.interfase";
import { type ConnectionType } from "@/pages/public/common/Icons/ConnectionTypeIcons";

interface MeasuresEditorViewProps {
  mainPieces: MainPiece[];
  materialsList: Material[];
  loadingMaterials: boolean;
  currentShapeVariation: ShapeVariation | undefined;
  handleResetShape: () => void;
  handleOpenChangeMaterialModal: (index: number) => void;
  handleMeasureChange: (pieceIndex: number, field: "length_mm" | "width_mm", value: string) => void;
  handleOpenAddPieceModal: () => void;
  handleRemovePiece: (index: number) => void;
  handleReorderPiece: (fromIndex: number, toIndex: number) => void;
  handleConnectionTypeChange: (pieceIndex: number, connectionType: ConnectionType) => void;
}

export const MeasuresEditorView: React.FC<MeasuresEditorViewProps> = ({
  mainPieces,
  materialsList,
  loadingMaterials,
  currentShapeVariation,
  handleResetShape,
  handleOpenChangeMaterialModal,
  handleMeasureChange,
  handleOpenAddPieceModal,
  handleRemovePiece,
  handleReorderPiece,
  handleConnectionTypeChange,
}) => {
  if (loadingMaterials) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Step2Header title="Define las medidas de cada pieza" subtitle="Medidas finales que tendrá cada pieza de tu encimera." />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddPieceModal} sx={{ mt: 1 }}>
            Agregar Pieza
          </Button>
          <Button variant="outlined" size="small" onClick={handleResetShape} sx={{ mt: 1 }}>
            Cambiar Forma Principal
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {mainPieces.map((piece, index) => {
          const materialName = materialsList.find((m) => m._id === piece.materialId)?.name || "Material desconocido";

          return (
            <Grid size={{ xs: 12, lg: 6 }} key={piece.id}>
              <PieceMeasuresCard
                index={index}
                piece={piece}
                materialName={materialName}
                currentShapeVariation={currentShapeVariation}
                handleOpenChangeMaterialModal={handleOpenChangeMaterialModal}
                handleMeasureChange={handleMeasureChange}
                handleRemovePiece={handleRemovePiece}
                handleReorderPiece={handleReorderPiece}
                handleConnectionTypeChange={handleConnectionTypeChange}
                isFirst={index === 0}
                isLast={index === mainPieces.length - 1}
              />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
