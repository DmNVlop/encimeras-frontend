import React from "react";
import { Box, Alert, Typography } from "@mui/material";
import { ProjectGlobalSummary } from "./ProjectGlobalSummary";
import { PieceBreakdownItem } from "./PieceBreakdownItem";
import { FinalTotals } from "./FinalTotals";
import type { CalculationResponse } from "@/interfases/price.interfase";

interface BreakdownSectionProps {
  calculationResult: CalculationResponse | null;
  wizardTempMaterial: any;
  mainPieces: any[];
  selectedShapeId: string | null;
}

export const BreakdownSection: React.FC<BreakdownSectionProps> = ({ calculationResult, wizardTempMaterial, mainPieces, selectedShapeId }) => {
  if (!calculationResult) {
    return (
      <Alert severity="warning" sx={{ mb: 4, borderRadius: 3, border: "1px dashed", borderColor: "warning.main" }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Presupuesto pendiente de cálculo
        </Typography>
        Para continuar, pulsa el botón <strong>"Calcular Presupuesto"</strong> en la parte superior. Cualquier cambio realizado (incluyendo el cliente) requiere
        un nuevo cálculo.
      </Alert>
    );
  }

  if (!calculationResult.pieces) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Pulsa "Calcular Presupuesto" para ver el desglose detallado.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 4, pb: 4 }}>
      <ProjectGlobalSummary wizardTempMaterial={wizardTempMaterial} selectedShapeId={selectedShapeId} mainPiecesCount={mainPieces.length} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {calculationResult.pieces.map((piece, idx) => (
          <PieceBreakdownItem
            key={idx}
            piece={piece}
            materialImage={wizardTempMaterial?.materialImage}
            materialName={wizardTempMaterial?.materialName}
            originalPieceData={mainPieces[idx]}
          />
        ))}

        {/* <AppliedDiscounts appliedRules={calculationResult.appliedRules || []} /> */}
        <FinalTotals totalPoints={calculationResult.totalPoints} totalDiscount={0} finalTotalPoints={calculationResult.totalPoints} />
      </Box>
    </Box>
  );
};
