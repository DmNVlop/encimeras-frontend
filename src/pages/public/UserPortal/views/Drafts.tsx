import { Box, Typography, Card, CardContent } from "@mui/material";

export default function Drafts() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Borradores Guardados
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 3, mt: 1 }}>
        {/* Placeholder for draft card */}
        <Box>
          <Card
            variant="outlined"
            sx={{ height: "100%", minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", borderStyle: "dashed" }}
          >
            <CardContent sx={{ textAlign: "center" }}>
              <Typography color="text.secondary">No tienes borradores guardados.</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
