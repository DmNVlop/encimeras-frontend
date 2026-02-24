import React from "react";
import { Box, Typography, Grid, Divider, Chip, Alert, Fade, useTheme } from "@mui/material";
import HandymanIcon from "@mui/icons-material/Handyman";
import { ProjectPiecesSelector } from "@/pages/public/components/ProjectPiecesSelector";
import { AppliedJobRow } from "./AppliedJobRow";
import { AvailableJobCard } from "./AvailableJobCard";
import type { Addon } from "@/interfases/addon.interfase";
import type { Material } from "@/interfases/materials.interfase";
import type { MainPiece } from "@/context/QuoteInterfases";

interface JobsSectionProps {
  materialMapFull: Record<string, Material>;
  activeTabIndex: number;
  handlePieceSelect: (index: number) => void;
  activePiece: MainPiece | undefined;
  materialCategoryMap: Record<string, string>;
  jobAddons: Addon[];
  handleRemoveJob: (pieceIndex: number, addonIndex: number) => void;
  handleUpdateJobMeasurement: (pIdx: number, addonIndexInPiece: number, field: string, val: string) => void;
  handleAddJob: (pieceIndex: number, addon: Addon) => void;
  getAddonImageUrl: (addon: Addon | undefined) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const JobsSection: React.FC<JobsSectionProps> = ({
  materialMapFull,
  activeTabIndex,
  handlePieceSelect,
  activePiece,
  materialCategoryMap,
  jobAddons,
  handleRemoveJob,
  handleUpdateJobMeasurement,
  handleAddJob,
  getAddonImageUrl,
  handleImageError,
}) => {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontWeight: 600,
          color: theme.palette.primary.main,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <HandymanIcon /> Trabajos por pieza
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {/* 1. SELECTOR VISUAL */}
      <ProjectPiecesSelector materialsMap={materialMapFull} activeIndex={activeTabIndex} onPieceSelect={handlePieceSelect} />

      {/* 2. ÁREA DE EDICIÓN DE LA PIEZA SELECCIONADA */}
      {activePiece && (
        <Fade in={true} key={activePiece.id} timeout={400}>
          <Box sx={{ mt: 2, minHeight: 300 }}>
            {(() => {
              const matCategory = materialCategoryMap[activePiece.materialId!] || "";
              const appliedJobsWithIndex = activePiece.appliedAddons
                .map((addon, idx) => ({ ...addon, originalIndex: idx }))
                .filter((addon) => jobAddons.some((def) => def.code === addon.code));

              const compatibleJobs = jobAddons.filter((job) => job.allowedMaterialCategories.includes(matCategory));

              return (
                <>
                  <Box sx={{ mb: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          fontWeight: "bold",
                        }}
                      >
                        TRABAJOS APLICADOS EN PIEZA {activeTabIndex + 1}
                      </Typography>
                    </Box>

                    {appliedJobsWithIndex.length === 0 ? (
                      <Alert severity="info" variant="outlined" sx={{ mb: 2, borderStyle: "dashed" }}>
                        No hay trabajos añadidos en esta pieza. Selecciona uno del catálogo inferior.
                      </Alert>
                    ) : (
                      appliedJobsWithIndex.map((applied) => {
                        const def = jobAddons.find((d) => d.code === applied.code);
                        return (
                          <AppliedJobRow
                            key={`${applied.code}-${applied.originalIndex}`}
                            appliedAddon={applied}
                            addonDef={def}
                            imageUrl={getAddonImageUrl(def)}
                            onError={handleImageError}
                            onRemove={() => handleRemoveJob(activeTabIndex, applied.originalIndex)}
                            onUpdate={(field, val) => handleUpdateJobMeasurement(activeTabIndex, applied.originalIndex, field, val)}
                          />
                        );
                      })
                    )}
                  </Box>

                  <Divider sx={{ my: 4 }}>
                    <Chip label="Catálogo de Trabajos Disponibles" />
                  </Divider>

                  {/* 2. CATÁLOGO */}
                  <Grid container spacing={2}>
                    {compatibleJobs.map((job) => (
                      <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={job._id}>
                        <AvailableJobCard
                          addon={job}
                          imageUrl={getAddonImageUrl(job)}
                          onError={handleImageError}
                          onAdd={() => handleAddJob(activeTabIndex, job)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </>
              );
            })()}
          </Box>
        </Fade>
      )}
    </Box>
  );
};
