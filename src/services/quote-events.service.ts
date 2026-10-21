import { post } from "@/services/api.service";

/** Origen de un PDF descargado: el carrito activo del usuario o una orden concreta. */
export type PdfDownloadSource = { source: "cart" } | { source: "order"; orderId: string };

export const quoteEventsApi = {
  /**
   * Registra la descarga del PDF (POST /quote-events/pdf-download). El backend resuelve qué
   * presupuestos contiene: el frontend no envía ids.
   */
  recordPdfDownload: async (origin: PdfDownloadSource): Promise<{ recorded: number }> => {
    return post<{ recorded: number }>("/quote-events/pdf-download", origin);
  },
};
