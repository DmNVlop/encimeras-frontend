import React from "react";
import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";

interface AdminPageTitleProps extends TypographyProps {
  children: React.ReactNode;
}

const AdminPageTitle: React.FC<AdminPageTitleProps> = ({ children, sx, ...props }) => {
  return (
    <Typography
      variant="h4"
      sx={{
        fontWeight: "bold",
        fontSize: "1.8rem",
        color: "text.primary",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Typography>
  );
};

export default AdminPageTitle;
