import { useState } from "react";
import { Box, Card, CardContent, Typography, Button, LinearProgress, IconButton } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { IDraft } from "@/interfases/draft.interfase";

interface DraftCardProps {
  draft: IDraft;
  onDelete: (id: string) => void;
}

export default function DraftCard({ draft, onDelete }: DraftCardProps) {
  const navigate = useNavigate();
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenConfirm(true);
  };

  const handleConfirmDelete = () => {
    setOpenConfirm(false);
    onDelete(draft._id || (draft as any).id);
  };

  const handleCloseConfirm = () => {
    setOpenConfirm(false);
  };

  // Helper to calculate time ago
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Hace un momento";
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  // Derive display data
  // const materialName = draft.configuration.wizardTempMaterial?.name || "Sin material seleccionado";
  const materialCategory = draft.configuration.wizardTempMaterial?.category || draft.configuration.wizardTempMaterial?.materialName || "Borrador";

  // Calculate mock progress based on data presence
  let progress = 20;
  if (draft.configuration.wizardTempMaterial) progress += 20;
  if (draft.configuration.mainPieces && draft.configuration.mainPieces.length > 0) progress += 40;
  if (draft.currentPricePoints > 0) progress = 90;

  const handleContinue = () => {
    navigate(`/quote?draftId=${draft._id || (draft as any).id}`);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: 3,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
        border: "1px solid #E0E0E0",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0px 8px 25px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ p: 3, flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              width: 80,
              height: 80,
              backgroundColor: draft.configuration.wizardTempMaterial?.materialImage ? "transparent" : "#FFF8E1",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: draft.configuration.wizardTempMaterial?.materialImage ? "1px solid" : "none",
              borderColor: "divider",
            }}
          >
            {draft.configuration.wizardTempMaterial?.materialImage ? (
              <Box
                component="img"
                src={draft.configuration.wizardTempMaterial.materialImage}
                alt={materialCategory}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <DescriptionOutlinedIcon fontSize="large" sx={{ color: "#F57C00" }} />
            )}
          </Box>

          {draft.configuration.mainPieces && draft.configuration.mainPieces.length > 0 && (
            <Box
              sx={{
                bgcolor: "primary.light",
                color: "primary.main",
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.75rem",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              {draft.configuration.mainPieces.length} Piezas
            </Box>
          )}

          <IconButton size="small" sx={{ color: "error.main" }} onClick={handleDeleteClick}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
          {materialCategory}
          {/* Using category as title like "Apartamento Playa" is mocked in design, 
              but we use what we have. If user wants custom names, we need a name field. 
              For now, defaulting to Material Name or Category */}
        </Typography>

        {/* <Typography variant="body2" color="text.secondary" gutterBottom>
          {materialName}
        </Typography> */}

        {/* Selected Attributes & Piece Count */}
        <Box mt={2} mb={2} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {draft.configuration.wizardTempMaterial?.selectedAttributes &&
            Object.values(draft.configuration.wizardTempMaterial.selectedAttributes).map((attr: any, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  color: "text.secondary",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: "0.75rem",
                  display: "inline-block",
                }}
              >
                {attr}
              </Box>
            ))}
        </Box>

        <Box mt={3}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: "#F5F5F5",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                bgcolor: "#FBC02D",
              },
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="text.secondary">
              Completado: {progress}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getTimeAgo(draft.updatedAt || draft.createdAt || draft.expirationDate)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Box p={2} pt={0}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleContinue}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "bold",
            color: "text.primary",
            borderColor: "divider",
            py: 1.5,
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "rgba(0,0,0,0.02)",
            },
          }}
        >
          Continuar Editando
        </Button>
      </Box>
      <Dialog open={openConfirm} onClose={handleCloseConfirm} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{"¿Eliminar borrador?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
