import React from "react";
import { Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, Avatar, Chip, Divider, useTheme } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";
import type { Addon } from "@/interfases/addon.interfase";
import type { MainPiece } from "@/context/QuoteInterfases";

interface UnionsSectionProps {
  numberOfUnions: number;
  mainPieces: MainPiece[];
  assemblyAddons: Addon[];
  materialCategoryMap: Record<string, string>;
  getCurrentAssemblyForUnion: (targetPieceIndex: number) => string;
  handleAssemblyChange: (unionIndex: number, addonCode: string) => void;
  getAddonImageUrl: (addon: Addon | undefined) => string;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  DEFAULT_IMAGE: string;
}

export const UnionsSection: React.FC<UnionsSectionProps> = ({
  numberOfUnions,
  mainPieces,
  assemblyAddons,
  materialCategoryMap,
  getCurrentAssemblyForUnion,
  handleAssemblyChange,
  getAddonImageUrl,
  handleImageError,
  DEFAULT_IMAGE,
}) => {
  const theme = useTheme();

  if (numberOfUnions <= 0) return null;

  return (
    <Box sx={{ mb: 5 }}>
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
        <LinkIcon /> Uniones entre piezas
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {Array.from({ length: numberOfUnions }).map((_, unionIndex) => {
          const pieceAIndex = unionIndex;
          const pieceBIndex = unionIndex + 1;
          if (!mainPieces[pieceBIndex]) return null;

          const matCategoryB = materialCategoryMap[mainPieces[pieceBIndex].materialId!] || "";
          const currentVal = getCurrentAssemblyForUnion(pieceBIndex);
          const compatibleAssemblies = assemblyAddons.filter((a) => a.allowedMaterialCategories.includes(matCategoryB));

          const selectedAddonObj = compatibleAssemblies.find((a) => a.code === currentVal);

          return (
            <Grid size={{ xs: 12 }} key={`union-${unionIndex}`}>
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  p: 3,
                  borderLeft: `6px solid ${theme.palette.secondary.main}`,
                  backgroundColor: "#fafafa",
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={4} alignItems="center">
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                      Unión {unionIndex + 1}: Pieza {pieceAIndex + 1} ↔ Pieza {pieceBIndex + 1}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Selecciona el tipo de mecanizado para unir estas dos piezas.
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id={`assembly-label-${unionIndex}`}>Tipo de Unión</InputLabel>
                      <Select
                        labelId={`assembly-label-${unionIndex}`}
                        value={currentVal}
                        label="Tipo de Unión"
                        onChange={(e) => handleAssemblyChange(unionIndex, e.target.value)}
                        renderValue={(selected) => {
                          if (!selected) return <em>Sin unión (A tope)</em>;
                          const addon = compatibleAssemblies.find((a) => a.code === selected);
                          return (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Avatar variant="rounded" src={getAddonImageUrl(addon)} sx={{ width: 32, height: 32 }}>
                                <ImageNotSupportedIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                              {selectedAddonObj?.name || selected}
                            </Box>
                          );
                        }}
                      >
                        <MenuItem value="">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              color: "text.secondary",
                            }}
                          >
                            <Avatar variant="rounded" sx={{ width: 32, height: 32, bgcolor: "#eee" }}>
                              <LinkIcon sx={{ color: "#999", fontSize: 20 }} />
                            </Avatar>
                            <em>Sin unión específica (A tope)</em>
                          </Box>
                        </MenuItem>
                        {compatibleAssemblies.map((addon) => (
                          <MenuItem key={addon._id} value={addon.code}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Avatar variant="rounded" src={getAddonImageUrl(addon)} sx={{ width: 40, height: 40 }} imgProps={{ onError: handleImageError }}>
                                <ImageNotSupportedIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {addon.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Compatible con {matCategoryB}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: 300,
                        aspectRatio: "4/3",
                        borderRadius: 3,
                        overflow: "hidden",
                        boxShadow: 3,
                        border: "1px solid #eee",
                        position: "relative",
                        bgcolor: "#fff",
                      }}
                    >
                      <img
                        src={currentVal ? getAddonImageUrl(selectedAddonObj) : DEFAULT_IMAGE}
                        alt="Previsualización"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        onError={handleImageError}
                      />
                      <Chip
                        label={selectedAddonObj ? selectedAddonObj.name : "Sin Unión"}
                        color={currentVal ? "primary" : "default"}
                        size="small"
                        sx={{
                          position: "absolute",
                          bottom: 10,
                          left: 10,
                          backdropFilter: "blur(4px)",
                          backgroundColor: "#85b2de",
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
