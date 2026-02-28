import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PdfData } from "../../utils/pdfAdapter";

// 1. Diseño Profesional y Limpio (Sistemas de Estilos)
// Utilizamos un esquema monocromo premium con ligeros toques azul grisáceo
// para una máxima legibilidad en papel y digital.
const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingBottom: 60, // Espacio para el Paginador
    fontFamily: "Helvetica",
    color: "#1e293b", // Gris Pizarra muy oscuro (casi negro pero más suave)
  },

  // -- CABECERA --
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  metadataContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  metaCol: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 9,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 11,
    color: "#334155",
  },

  // -- BLOQUE DE ESTANCIA (Ej. Cocina o Isla) --
  itemContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8fafc", // Fondo sutil para distinguir estancias
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#475569",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
  },
  itemSubtotal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#475569",
  },

  // -- FILA DE PIEZA (wrap={false} vital aquí) --
  pieceRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  colCol1: { width: "40%", paddingRight: 8 },
  colCol2: { width: "30%", paddingRight: 8 },
  colCol3: { width: "30%" },

  pieceSubtitle: {
    fontSize: 9,
    color: "#94a3b8",
    marginBottom: 2,
  },
  pieceMainText: {
    fontSize: 11,
    color: "#334155",
  },

  addonText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // -- FOOTER DEL DOCUMENTO (TOTALES) --
  documentFooter: {
    marginTop: 30,
    borderTopWidth: 2,
    borderTopColor: "#cbd5e1",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalBox: {
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    minWidth: 150,
  },
  totalLabel: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "right",
  },

  // -- PAGINACIÓN (Absoluto al fondo inferior) --
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#94a3b8",
  },
});

interface CartPdfDocumentProps {
  data: PdfData; // Contrato Definitivo. Ni "any" ni JSONs masivos.
}

/**
 * Componente Visual para el Resumen del Pedido/Carrito en PDF.
 * Este componente NUNCA debe importar hooks (useState, useEffect, etc).
 * Se ejecuta en un Thread aislado de react-pdf para generar el Blob.
 */
export const CartPdfDocument: React.FC<CartPdfDocumentProps> = ({ data }) => (
  // <Document> y todos sus hijos son primitivas de react-pdf/renderer
  <Document title={`Presupuesto_${data.orderId.slice(-6).toUpperCase()}`} author="Encimeras App" subject="Detalle de Carrito">
    <Page size="A4" style={styles.page}>
      {/* 1. CABECERA */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resumen de Presupuesto</Text>
        <Text style={styles.headerSubtitle}>Generado automáticamente desde la plataforma online.</Text>

        <View style={styles.metadataContainer}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Factura Proforma / Ref.</Text>
            <Text style={styles.metaValue}>{data.orderId.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Fecha Emisión</Text>
            <Text style={styles.metaValue}>{data.date}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Válido Hasta</Text>
            <Text style={styles.metaValue}>{data.expiration}</Text>
          </View>
        </View>
      </View>

      {/* 2. LISTADO DE ESTANCIAS (Ej. Cocina Principal, Isla, Baño) */}
      {data.items.map((item) => (
        // Usamos wrap={false} para evitar que una estancia empiece en la última línea
        // de una página empujando el resto a la siguiente (opcional, dejamos default por ahora,
        // pero lo forzamos en las PIEZAS, que es donde duele visualmente).
        <View key={item.cartItemId} style={styles.itemContainer}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text style={styles.itemSubtotal}>{item.subtotal.toFixed(2)} pts</Text>
          </View>

          {/* 3. DESGLOSE DE PIEZAS DE LA ESTANCIA */}
          {item.pieces.map((piece, i) => (
            // CRÍTICO: wrap={false} en la fila de la pieza.
            // Impide que "Dimensiones" o "Extras" se partan entre dos páginas si caen justo en el corte.
            <View key={piece.id} style={styles.pieceRow} wrap={false}>
              <View style={styles.colCol1}>
                <Text style={styles.pieceSubtitle}>PIEZA {i + 1}</Text>
                <Text style={styles.pieceMainText}>{piece.materialName}</Text>
              </View>

              <View style={styles.colCol2}>
                <Text style={styles.pieceSubtitle}>DIMENSIONES</Text>
                <Text style={styles.pieceMainText}>{piece.dimensions}</Text>
              </View>

              <View style={styles.colCol3}>
                <Text style={styles.pieceSubtitle}>MECANIZADOS / EXTRAS</Text>
                {piece.addons.length === 0 ? (
                  <Text style={styles.emptyText}>Ninguno</Text>
                ) : (
                  piece.addons.map((addon, idx) => {
                    // Formateo limpio del nombre del addon (ej: CORTE_A_INGLETE -> Corte A Inglete)
                    const formatCode = (code: string) =>
                      code
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (l) => l.toUpperCase());

                    const measureStr = addon.measurements?.length_ml ? ` (${addon.measurements.length_ml} ml)` : "";

                    return (
                      <Text key={idx} style={styles.addonText}>
                        • {formatCode(addon.code)} {measureStr}
                      </Text>
                    );
                  })
                )}
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* 4. TOTALES GENERALES DEL DOCUMENTO (Forzamos wrap=false para que no quede huerfano arriba de la pagina) */}
      <View style={styles.documentFooter} wrap={false}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL APROXIMADO</Text>
          <Text style={styles.totalValue}>{data.total.toFixed(2)} pts</Text>
        </View>
      </View>

      {/* 5. PAGINADOR DINÁMICO (Propiedad render intercepta el pageNum) */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
    </Page>
  </Document>
);
