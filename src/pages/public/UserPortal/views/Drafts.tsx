import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { draftsApi } from "@/services/drafts.service"; // Ensure this path is correct
import type { IDraft } from "@/interfases/draft.interfase";
import DraftCard from "./components/DraftCard";
import NewDraftCard from "./components/NewDraftCard";

export default function Drafts() {
  const [drafts, setDrafts] = useState<IDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

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

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr", lg: "1fr 1fr 1fr 1fr" }, gap: 3, mt: 3 }}>
        {/* Render existing drafts */}
        {drafts.map((draft) => (
          <Box key={draft._id || (draft as any).id}>
            <DraftCard draft={draft} />
          </Box>
        ))}

        {/* Render "New Draft" card as user requests plain view logic? 
            Design shows New Draft card alongside others. 
        */}
        <Box>
          <NewDraftCard />
        </Box>
      </Box>
    </Box>
  );
}
