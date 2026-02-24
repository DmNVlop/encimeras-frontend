import React from "react";
import { Box, Typography, Avatar, useTheme, Card, CardActionArea, CardMedia, CardContent } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import type { Addon } from "@/interfases/addon.interfase";

interface AvailableJobCardProps {
  addon: Addon;
  onAdd: () => void;
  imageUrl: string;
  onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Tarjeta del catálogo de trabajos disponibles (Zona Inferior)
 */
export const AvailableJobCard: React.FC<AvailableJobCardProps> = ({ addon, onAdd, imageUrl, onError }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        transition: "all 0.3s ease",
        border: "1px solid transparent",
        "&:hover": {
          transform: "translateY(2px)",
          boxShadow: theme.shadows[6],
          borderColor: theme.palette.primary.main,
          "& .add-icon": {
            opacity: 1,
            transform: "scale(1)",
          },
        },
      }}
    >
      <CardActionArea
        onClick={onAdd}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            position: "relative",
            paddingTop: "65%",
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          <CardMedia
            component="img"
            image={imageUrl}
            alt={addon.name}
            onError={onError}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
          {/* Overlay con icono de añadir al hover */}
          <Box
            className="add-icon"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(25, 118, 210, 0.2)", // Primary color tint
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transform: "scale(0.8)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": { opacity: 1 },
            }}
          >
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <AddCircleOutlineIcon sx={{ fontSize: 30 }} />
            </Avatar>
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.2 }}>
            {addon.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Click para añadir
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
