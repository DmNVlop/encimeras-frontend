import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfData } from "../../utils/pdfAdapter";

// 1. Diseño Empresarial y Premium
const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    color: "#1e293b", // Gris Pizarra muy oscuro
  },

  // -- CABECERA & LOGO --
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logo: {
    width: 130,
    height: 45,
    objectFit: "contain",
  },
  headerTitleBox: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "#64748b",
  },

  // -- BLOQUE DE INFORMACIÓN (CLIENTE Y PROYECTO) --
  infoBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  infoCol: {
    width: "48%",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 70,
    fontSize: 9,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 9,
    color: "#334155",
    fontWeight: "bold",
    flex: 1,
  },

  // -- BLOQUE DE ESTANCIA (Ej. Cocina o Isla) --
  itemContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6", // Un acento azul profesional
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  itemSubtotalLabel: {
    fontSize: 9,
    color: "#64748b",
    marginRight: 4,
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },

  // -- FILA DE PIEZA --
  pieceRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pieceCol1: { width: "35%", paddingRight: 10 }, // Material / Ref
  pieceCol2: { width: "25%", paddingRight: 10 }, // Dimensiones
  pieceCol3: { width: "40%" }, // Ensamblajes / Extras

  pieceSubtitle: {
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 3,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  pieceMainText: {
    fontSize: 10,
    color: "#1e293b",
  },

  addonText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 3,
  },
  emptyText: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // -- FOOTER DE TOTALES GENERALES --
  totalsContainer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsBox: {
    width: "50%",
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#475569",
  },
  totalsValue: {
    fontSize: 10,
    color: "#0f172a",
    fontWeight: "bold",
  },
  totalsRowHighlight: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalsLabelHighlight: {
    fontSize: 10,
    color: "#16a34a", // Verde elegante para ahorro
    fontWeight: "bold",
  },
  totalsValueHighlight: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "bold",
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginVertical: 8,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalsLabelFinal: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalsValueFinal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  // -- PAGINACIÓN Y LEGALES --
  footerNote: {
    position: "absolute",
    bottom: 45,
    left: 35,
    right: 35,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    fontSize: 9,
    bottom: 25,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#64748b",
  },
});

interface CartPdfDocumentProps {
  data: PdfData;
}

/**
 * Componente Visual para el Resumen del Pedido en PDF.
 * Preparado a nivel empresarial.
 */
export const CartPdfDocument: React.FC<CartPdfDocumentProps> = ({ data }) => {
  // Helpers de visualización
  const formatCode = (code: string) =>
    code
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Document title={`Presupuesto_${data.orderId.slice(-6).toUpperCase()}`} author="Kuuk" subject="Presupuesto">
      <Page size="A4" style={styles.page}>
        {/* 1. CABECERA: Logo + Título */}
        <View style={styles.headerRow}>
          {data.logoStr ? <Image src={data.logoStr} style={styles.logo} /> : <Text style={{ fontSize: 18, fontWeight: "bold" }}>KUUK</Text>}
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>PRESUPUESTO</Text>
            <Text style={styles.headerSubtitle}>Documento de valoración sin valor vinculante final</Text>
          </View>
        </View>

        {/* 2. BLOQUE INFO: Proyecto/Metadatos y Cliente */}
        <View style={styles.infoBlock}>
          {/* Detalles del Cliente */}
          <View style={styles.infoCol}>
            <Text style={styles.infoTitle}>Datos del Cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nombre:</Text>
              <Text style={styles.infoValue}>{data.customerName}</Text>
            </View>
            {data.customerNif && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NIF/CIF:</Text>
                <Text style={styles.infoValue}>{data.customerNif}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{data.customerEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={styles.infoValue}>{data.customerPhone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{data.customerAddress}</Text>
            </View>
          </View>

          {/* Detalles del Presupuesto */}
          <View style={styles.infoCol}>
            <Text style={styles.infoTitle}>Detalles del Documento</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Referencia:</Text>
              <Text style={styles.infoValue}>{data.orderId.slice(-8).toUpperCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>{data.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Válido hasta:</Text>
              <Text style={styles.infoValue}>{data.expiration}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Preparado por:</Text>
              <Text style={styles.infoValue}>
                {data.userName} ({data.userRole})
              </Text>
            </View>
          </View>
        </View>

        {/* 3. LISTADO DE ESTANCIAS */}
        {data.items.map((item) => (
          <View key={item.cartItemId} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={styles.itemSubtotalLabel}>Suma Estancia:</Text>
                <Text style={styles.itemSubtotal}>{item.subtotal.toFixed(2)} pts</Text>
              </View>
            </View>

            {/* DESGLOSE DE PIEZAS */}
            {item.pieces.map((piece, i) => (
              <View key={piece.id} style={styles.pieceRow} wrap={false}>
                <View style={styles.pieceCol1}>
                  <Text style={styles.pieceSubtitle}>Referencia / Material</Text>
                  <Text style={styles.pieceMainText}>
                    <Text style={{ fontWeight: "bold" }}>P.{i + 1} -</Text> {piece.materialName}
                  </Text>
                  {/* Atributos del Material */}
                  {Object.keys(piece.attributes).length > 0 && (
                    <View style={{ marginTop: 4 }}>
                      {Object.entries(piece.attributes).map(([key, val]) => (
                        <Text key={key} style={{ fontSize: 8, color: "#64748b" }}>
                          • {formatCode(key)}: {String(val)}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.pieceCol2}>
                  <Text style={styles.pieceSubtitle}>Dimensiones Reales</Text>
                  <Text style={styles.pieceMainText}>{piece.dimensions}</Text>
                </View>

                <View style={styles.pieceCol3}>
                  <Text style={styles.pieceSubtitle}>Detalles y Procesos de Fabricación</Text>
                  {piece.addons.length === 0 ? (
                    <Text style={styles.emptyText}>Corte limpio básico (sin extras)</Text>
                  ) : (
                    piece.addons.map((addon, idx) => {
                      const hasMeasurements = Object.keys(addon.measurementsMap).length > 0;
                      const hasAttributes = Object.keys(addon.attributesMap).length > 0;

                      return (
                        <View key={idx} style={{ marginBottom: 4 }}>
                          <Text style={styles.addonText}>• {formatCode(addon.code)}</Text>
                          {hasMeasurements && (
                            <Text style={{ fontSize: 8, color: "#64748b", paddingLeft: 6 }}>
                              Medidas:{" "}
                              {Object.entries(addon.measurementsMap)
                                .filter(([_, v]) => v !== undefined)
                                .map(([k, v]) => `${formatCode(k.replace("_mm", "").replace("_ml", ""))}: ${v}`)
                                .join(", ")}
                            </Text>
                          )}
                          {hasAttributes && (
                            <Text style={{ fontSize: 8, color: "#64748b", paddingLeft: 6 }}>Notas: {Object.values(addon.attributesMap).join(", ")}</Text>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* 4. BLOQUE DE TOTALES FINALES (wrap=false para protegerlo) */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal Bruto</Text>
              <Text style={styles.totalsValue}>{data.subtotalBruto.toFixed(2)} pts</Text>
            </View>

            {/* Si hay reglas globales de descuento las mostramos desglosadas */}
            {data.appliedGlobalRules && data.appliedGlobalRules.length > 0 ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold", marginBottom: 4 }}>Descuentos Aplicados:</Text>
                {data.appliedGlobalRules.map((rule, index) => (
                  <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3, paddingLeft: 6 }}>
                    <Text style={{ fontSize: 9, color: "#16a34a" }}>• {rule.ruleName}</Text>
                    <Text style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold" }}>- {rule.discountAmount.toFixed(2)} pts</Text>
                  </View>
                ))}
              </View>
            ) : (
              /* Sin desglose por regla: mostrar solo el total de descuento */
              data.totalDescuento > 0 && (
                <View style={styles.totalsRowHighlight}>
                  <Text style={styles.totalsLabelHighlight}>Descuentos Aplicados</Text>
                  <Text style={styles.totalsValueHighlight}>- {data.totalDescuento.toFixed(2)} pts</Text>
                </View>
              )
            )}

            <View style={styles.totalsDivider} />

            <View style={styles.totalsRowFinal}>
              <Text style={styles.totalsLabelFinal}>IMPORTE TOTAL</Text>
              <Text style={styles.totalsValueFinal}>{data.total.toFixed(2)} pts</Text>
            </View>
          </View>
        </View>

        {/* 5. NOTA LEGAL Y PAGINACIÓN */}
        <Text style={styles.footerNote} fixed>
          Este documento es informativo y no constituye una factura legal. Los precios están expresados en puntos internos de la plataforma sujetos a las
          condiciones de venta. Para su aprobación, póngase en contacto con su comercial o apruebe este borrador directamente en el portal online.
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};
