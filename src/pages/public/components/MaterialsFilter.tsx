// src/pages/public/components/MaterialsFilter.tsx
// (Ajusta la ruta según tu estructura de carpetas)

import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface MaterialsFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const MaterialsFilter: React.FC<MaterialsFilterProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Buscar material por nombre o categoría..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      sx={{ mb: 4, backgroundColor: "white" }} // Un poco de margen inferior
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchTerm ? (
            <InputAdornment position="end">
              <IconButton onClick={() => onSearchChange("")} edge="end">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
};
