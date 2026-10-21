import React from "react";
import { Chip, type ChipProps } from "@mui/material";
import {
  Block as BlockIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  FactCheck as FactCheckIcon,
  HighlightOff as HighlightOffIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Home as HomeIcon,
  LocalShipping as LocalShippingIcon,
} from "@mui/icons-material";
import { getOrderStatusMeta, getOrderStatusShortLabel } from "@/utils/orderStatus.util";

const STATUS_ICON: Record<string, React.ReactElement> = {
  PENDING: <HourglassEmptyIcon />,
  REVIEWED: <FactCheckIcon />,
  APPROVED: <CheckCircleIcon />,
  REJECTED: <HighlightOffIcon />,
  MANUFACTURING: <BuildIcon />,
  SHIPPED: <LocalShippingIcon />,
  INSTALLED: <HomeIcon />,
  CANCELLED: <BlockIcon />,
};

/** Icono de cada estado (único sitio; lo usan el chip, el historial y los botones de acción). */
export const getOrderStatusIcon = (status: string) => STATUS_ICON[status] ?? <HourglassEmptyIcon />;

/** Chip de estado de orden con icono, etiqueta y color de `orderStatus.util` (portal y backoffice). `short` = etiqueta corta. */
export const OrderStatusChip: React.FC<{ status: string; size?: ChipProps["size"]; short?: boolean; sx?: ChipProps["sx"] }> = ({ status, size = "small", short, sx }) => {
  const meta = getOrderStatusMeta(status);
  return <Chip icon={getOrderStatusIcon(status)} label={short ? getOrderStatusShortLabel(status) : meta.label} color={meta.color} size={size} sx={{ fontWeight: 700, ...sx }} />;
};

export default OrderStatusChip;
