import { Chip, Tooltip, Box } from "@mui/material";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useVersion } from "@/context/VersionContext";

export function VersionBadge() {
  const { frontendVersion, backendVersion, swUpdateAvailable, updateSW } = useVersion();

  const tooltipContent = (
    <Box sx={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
      <div>
        <strong>Frontend:</strong> v{frontendVersion}
      </div>
      {backendVersion && (
        <div>
          <strong>Backend:</strong> v{backendVersion}
        </div>
      )}
      {swUpdateAvailable && (
        <div style={{ marginTop: 4, color: "#ffb74d" }}>
          Nueva versión disponible — haz clic para actualizar
        </div>
      )}
    </Box>
  );

  if (swUpdateAvailable) {
    return (
      <Box sx={{ mr: 2 }}>
        <Tooltip title={tooltipContent} arrow placement="bottom">
          <Chip
            icon={<SystemUpdateAltIcon sx={{ fontSize: "0.9rem !important" }} />}
            label={`v${frontendVersion} · actualizar`}
            color="warning"
            size="small"
            onClick={updateSW}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
              "& .MuiChip-icon": { fontSize: "0.85rem" },
            }}
          />
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ mr: 2 }}>
      <Tooltip title={tooltipContent} arrow placement="bottom">
        <Chip
          icon={<InfoOutlinedIcon sx={{ fontSize: "0.9rem !important" }} />}
          label={`v${frontendVersion}`}
          size="small"
          sx={{
            cursor: "default",
            fontSize: "0.7rem",
            height: 24,
            color: "text.secondary",
            borderColor: "divider",
            "& .MuiChip-icon": { fontSize: "0.85rem", color: "text.disabled" },
          }}
          variant="outlined"
        />
      </Tooltip>
    </Box>
  );
}
