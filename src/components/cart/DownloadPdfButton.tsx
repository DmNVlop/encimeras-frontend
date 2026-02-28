import React, { useState, useEffect } from "react";
import { Button, CircularProgress, Box } from "@mui/material";
import { PictureAsPdf as PictureAsPdfIcon } from "@mui/icons-material";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { CartPdfDocument } from "./CartPdfDocument";
import { usePdfData } from "../../utils/pdfAdapter";
import type { Cart } from "../../interfases/cart.interfase";

import type { ICustomer } from "../../interfases/customer.interfase";

interface DownloadPdfButtonProps {
  cart: Cart;
  user?: any;
  customer?: ICustomer | null;
  disabled?: boolean;
}

const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({ cart, user, customer, disabled }) => {
  const [isClient, setIsClient] = useState(false);
  const pdfData = usePdfData(cart, user, customer);

  // Evita errores de hidratación en SSR y asegura que estamos en el navegador
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Si no estamos en el cliente, abortamos
  if (!isClient) return null;

  // Si no hay datos, mostramos el botón deshabilitado para que la UI no se rompa o desaparezca
  if (!pdfData) {
    return (
      <Box sx={{ width: "100%" }}>
        <Button
          component="span"
          variant="outlined"
          fullWidth
          color="info"
          startIcon={<PictureAsPdfIcon />}
          disabled
          sx={{
            borderRadius: 2,
            borderWidth: 2,
          }}
        >
          No disponible
        </Button>
      </Box>
    );
  }

  // Renderizamos el Link con un componente span-button interno para heredar UI de Material-UI
  return (
    <Box sx={{ width: "100%" }}>
      <PDFDownloadLink
        document={<CartPdfDocument data={pdfData} />}
        fileName={`Presupuesto_${pdfData.orderId.slice(-6).toUpperCase()}.pdf`}
        style={{ textDecoration: "none", width: "100%", display: "block" }}
      >
        {({ loading, error }) => (
          <Button
            component="span" // Evita anidar un <button> dentro de un <a>
            variant="outlined"
            fullWidth
            color="info"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
            disabled={disabled || loading || !!error}
            sx={{
              borderRadius: 2,
              borderWidth: 2,
              "&:hover": { borderWidth: 2 }, // Mantiene el grosor en el hover
            }}
          >
            {error ? "Error al generar PDF" : loading ? "Preparando documento..." : "Descargar resumen PDF"}
          </Button>
        )}
      </PDFDownloadLink>
    </Box>
  );
};

export default DownloadPdfButton;
