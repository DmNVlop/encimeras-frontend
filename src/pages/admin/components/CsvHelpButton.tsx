// src/pages/admin/components/CsvHelpButton.tsx
// Botón de ayuda compartido para el flujo Import/Export CSV de cualquier módulo admin.
// Icon button entre los botones "Importar CSV" / "Exportar CSV"; al click abre un
// popover con explicación de columnas, formato y ejemplos concretos del módulo.
import React from "react";
import { IconButton, Tooltip, Popover, Typography, Divider, Stack } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface CsvHelpButtonProps {
  title: string;
  children: React.ReactNode;
}

const CsvHelpButton: React.FC<CsvHelpButtonProps> = ({ title, children }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Ayuda: cómo importar/exportar CSV">
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{ paper: { sx: { maxWidth: 480, p: 2.5 } } }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1.25}>{children}</Stack>
      </Popover>
    </>
  );
};

export default CsvHelpButton;
