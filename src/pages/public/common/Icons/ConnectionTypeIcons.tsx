import React from "react";
import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";

export type ConnectionType = "NONE" | "LINEAR" | "CORNER_LEFT" | "CORNER_RIGHT";

interface ConnectionTypeIconProps extends SvgIconProps {
  type: ConnectionType;
}

export const ConnectionTypeLinear: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 40 20">
    <rect x="0" y="4" width="16" height="12" fill="#4CAF50" rx="1" />
    <rect x="20" y="4" width="16" height="12" fill="#4CAF50" rx="1" />
    <path d="M16 10 L20 10" stroke="#4CAF50" strokeWidth="2" fill="none" />
  </SvgIcon>
);

export const ConnectionTypeCornerLeft: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 40 20">
    <rect x="0" y="4" width="16" height="12" fill="#2196F3" rx="1" />
    <rect x="0" y="10" width="16" height="6" fill="#2196F3" rx="1" />
    <path d="M16 10 L16 16" stroke="#2196F3" strokeWidth="2" fill="none" />
  </SvgIcon>
);

export const ConnectionTypeCornerRight: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 40 20">
    <rect x="0" y="4" width="16" height="12" fill="#FF9800" rx="1" />
    <rect x="20" y="4" width="16" height="6" fill="#FF9800" rx="1" />
    <path d="M16 10 L20 10 L20 16" stroke="#FF9800" strokeWidth="2" fill="none" strokeLinecap="round" />
  </SvgIcon>
);

export const ConnectionTypeNone: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 40 20">
    <rect x="2" y="4" width="12" height="12" fill="#9E9E9E" rx="1" />
    <rect x="26" y="4" width="12" height="12" fill="#9E9E9E" rx="1" />
    <path d="M16 10 L24 10" stroke="#9E9E9E" strokeWidth="2" strokeDasharray="2 2" fill="none" />
  </SvgIcon>
);

export const ConnectionTypeIcon: React.FC<ConnectionTypeIconProps> = ({ type, ...props }) => {
  switch (type) {
    case "LINEAR":
      return <ConnectionTypeLinear {...props} />;
    case "CORNER_LEFT":
      return <ConnectionTypeCornerLeft {...props} />;
    case "CORNER_RIGHT":
      return <ConnectionTypeCornerRight {...props} />;
    case "NONE":
    default:
      return <ConnectionTypeNone {...props} />;
  }
};

export const connectionTypeLabels: Record<ConnectionType, string> = {
  NONE: "Desligada",
  LINEAR: "Lineal (En línea)",
  CORNER_LEFT: "Esquina Izquierda",
  CORNER_RIGHT: "Esquina Derecha",
};

export const connectionTypeColors: Record<ConnectionType, string> = {
  NONE: "#9E9E9E",
  LINEAR: "#4CAF50",
  CORNER_LEFT: "#2196F3",
  CORNER_RIGHT: "#FF9800",
};
