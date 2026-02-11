import { Box, Card, CardContent, Typography } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useNavigate } from "react-router-dom";

export default function NewDraftCard() {
  const navigate = useNavigate();

  return (
    <Card
      variant="outlined"
      onClick={() => navigate("/quote")}
      sx={{
        height: "100%",
        minHeight: 280, // Match typical height of filled card
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderStyle: "dashed",
        borderWidth: 2,
        borderColor: "divider",
        borderRadius: 3,
        cursor: "pointer",
        transition: "border-color 0.2s, background-color 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "rgba(0,0,0,0.02)",
        },
      }}
    >
      <CardContent sx={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <Box sx={{ color: "text.disabled" }}>
          <AddCircleOutlineIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h6" fontWeight="bold" color="text.secondary">
          Crear Nuevo Presupuesto
        </Typography>
      </CardContent>
    </Card>
  );
}
