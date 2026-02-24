import { useEffect, useState, useMemo } from "react";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { draftsApi } from "@/services/drafts.service"; // Ensure this path is correct
import type { IDraft } from "@/interfases/draft.interfase";
import DraftCard from "./components/DraftCard";
import NewDraftCard from "./components/NewDraftCard";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function Drafts() {
  const [drafts, setDrafts] = useState<IDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const groupedDrafts = useMemo(() => {
    const groups: { [key: string]: IDraft[] } = {};
    const individuals: IDraft[] = [];

    drafts.forEach((draft) => {
      // Usamos cartGroupId para agrupar
      if (draft.cartGroupId) {
        if (!groups[draft.cartGroupId]) {
          groups[draft.cartGroupId] = [];
        }
        groups[draft.cartGroupId].push(draft);
      } else {
        individuals.push(draft);
      }
    });

    return { groups, individuals };
  }, [drafts]);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const fetchDrafts = async () => {
    try {
      const response = await draftsApi.getAll();
      // Ensure response is an array, if backend returns object with data property, adjust here.
      // Based on controller it returns list.
      if (Array.isArray(response)) {
        setDrafts(response);
      } else if ((response as any).data && Array.isArray((response as any).data)) {
        setDrafts((response as any).data);
      } else {
        console.error("Unexpected drafts response format", response);
        setDrafts([]);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Cargando borradores...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Borradores Guardados
      </Typography>

      {/* Grupos de Carrito */}
      {Object.entries(groupedDrafts.groups).map(([groupId, groupDrafts]) => (
        <Box
          key={groupId}
          sx={{
            mb: 5,
            p: 3,
            bgcolor: "rgba(33, 150, 243, 0.03)",
            borderRadius: 4,
            border: "2px dashed",
            borderColor: "primary.light",
            position: "relative",
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1,
                borderRadius: 2,
                display: "flex",
                mr: 2,
                boxShadow: "0 4px 10px rgba(25, 118, 210, 0.3)",
              }}
            >
              <ShoppingCartOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                Grupo de Carrito
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {groupId} • {groupDrafts.length} {groupDrafts.length === 1 ? "elemento" : "elementos"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
            {groupDrafts.map((draft) => (
              <Box key={draft._id || (draft as any).id}>
                <DraftCard
                  draft={draft}
                  onDelete={async (id) => {
                    try {
                      await draftsApi.delete(id);
                      setDrafts((prev) => prev.filter((d) => (d._id || (d as any).id) !== id));
                      setSnackbarMessage("Borrador eliminado correctamente");
                      setSnackbarSeverity("success");
                      setSnackbarOpen(true);
                    } catch (error: any) {
                      console.error("Error deleting draft:", error);
                      const errorMessage = error.response?.data?.message || "Error al eliminar el borrador";
                      setSnackbarMessage(errorMessage);
                      setSnackbarSeverity("error");
                      setSnackbarOpen(true);
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      {/* Borradores Individuales y Nuevo Borrador */}
      <Box sx={{ mt: drafts.length > 0 && Object.keys(groupedDrafts.groups).length > 0 ? 4 : 0 }}>
        {groupedDrafts.individuals.length > 0 && (
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                bgcolor: "text.secondary",
                color: "white",
                p: 1,
                borderRadius: 2,
                display: "flex",
                mr: 2,
                opacity: 0.8,
              }}
            >
              <InfoOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="text.primary">
                Borradores Individuales
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No asociados a un carrito específico
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 3 }}>
          {groupedDrafts.individuals.map((draft) => (
            <Box key={draft._id || (draft as any).id}>
              <DraftCard
                draft={draft}
                onDelete={async (id) => {
                  try {
                    await draftsApi.delete(id);
                    setDrafts((prev) => prev.filter((d) => (d._id || (d as any).id) !== id));
                    setSnackbarMessage("Borrador eliminado correctamente");
                    setSnackbarSeverity("success");
                    setSnackbarOpen(true);
                  } catch (error: any) {
                    console.error("Error deleting draft:", error);
                    const errorMessage = error.response?.data?.message || "Error al eliminar el borrador";
                    setSnackbarMessage(errorMessage);
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                  }
                }}
              />
            </Box>
          ))}
          <Box>
            <NewDraftCard />
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
