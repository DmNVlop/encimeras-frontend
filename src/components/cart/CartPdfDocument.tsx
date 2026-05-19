import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { PdfData, PdfPieceBreakdown } from "../../utils/pdfAdapter";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    color: "#1e293b",
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

  // -- BLOQUE DE INFORMACIÓN --
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

  // -- BLOQUE DE ESTANCIA --
  itemContainer: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },
  itemSubtotalBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  itemSubtotalLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
  },

  // -- CABECERA DE COLUMNAS DE PIEZA --
  piecesColHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  colHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // -- FILA DE PIEZA UNIFICADA --
  pieceRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  pieceRowAlt: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fafbfc",
  },

  // Columnas de la fila de pieza
  colRef: { width: "28%", paddingRight: 8 },
  colDims: { width: "20%", paddingRight: 8 },
  colAddons: { width: "35%", paddingRight: 8 },
  colPrice: { width: "17%", alignItems: "flex-end" },

  colSubtitle: {
    fontSize: 7,
    color: "#94a3b8",
    marginBottom: 3,
    textTransform: "uppercase",
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  pieceLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  materialName: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 3,
  },
  attrText: {
    fontSize: 7.5,
    color: "#64748b",
    marginBottom: 1,
  },
  dimsText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  dimsUnit: {
    fontSize: 8,
    color: "#64748b",
  },

  // Addons inline
  addonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  addonName: {
    fontSize: 8.5,
    color: "#475569",
    flex: 1,
    paddingRight: 4,
  },
  addonPrice: {
    fontSize: 8.5,
    color: "#475569",
    fontWeight: "bold",
  },
  addonMeasure: {
    fontSize: 7,
    color: "#94a3b8",
    paddingLeft: 8,
    marginBottom: 1,
  },
  noAddonText: {
    fontSize: 8,
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // Columna de precio de la pieza
  basePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 2,
  },
  basePriceLabel: {
    fontSize: 7.5,
    color: "#94a3b8",
  },
  basePriceValue: {
    fontSize: 8,
    color: "#475569",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 2,
  },
  discountLabel: {
    fontSize: 7.5,
    color: "#16a34a",
  },
  discountValue: {
    fontSize: 8,
    color: "#16a34a",
    fontWeight: "bold",
  },
  priceDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    width: "100%",
    marginVertical: 3,
  },
  totalPriceLabel: {
    fontSize: 7.5,
    color: "#64748b",
    marginBottom: 1,
    alignSelf: "flex-end",
  },
  totalPriceValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
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
    color: "#16a34a",
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

export const CartPdfDocument: React.FC<CartPdfDocumentProps> = ({ data }) => {
  const formatCode = (code: string) =>
    code
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());

  // Busca el breakdown de una pieza por índice
  const getPieceBreakdown = (itemBreakdown: PdfPieceBreakdown[] | undefined, pieceIndex: number) =>
    itemBreakdown?.[pieceIndex];

  return (
    <Document title={`Presupuesto_${data.orderId.slice(-6).toUpperCase()}`} author="Kuuk" subject="Presupuesto">
      <Page size="A4" style={styles.page}>
        {/* 1. CABECERA */}
        <View style={styles.headerRow}>
          {data.logoStr ? <Image src={data.logoStr} style={styles.logo} /> : <Text style={{ fontSize: 18, fontWeight: "bold" }}>KUUK</Text>}
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>PRESUPUESTO</Text>
            <Text style={styles.headerSubtitle}>Documento de valoración sin valor vinculante final</Text>
          </View>
        </View>

        {/* 2. BLOQUE INFO */}
        <View style={styles.infoBlock}>
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

        {/* 3. TOTALES FINALES */}
        <View style={styles.totalsContainer} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal Bruto</Text>
              <Text style={styles.totalsValue}>{data.subtotalBruto.toFixed(2)} </Text>
            </View>

            {data.appliedGlobalRules && data.appliedGlobalRules.length > 0 ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold", marginBottom: 4 }}>Descuentos Aplicados:</Text>
                {data.appliedGlobalRules.map((rule, index) => (
                  <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3, paddingLeft: 6 }}>
                    <Text style={{ fontSize: 9, color: "#16a34a" }}>• {rule.ruleName}</Text>
                    <Text style={{ fontSize: 9, color: "#16a34a", fontWeight: "bold" }}>- {rule.discountAmount.toFixed(2)} </Text>
                  </View>
                ))}
              </View>
            ) : (
              data.totalDescuento > 0 && (
                <View style={styles.totalsRowHighlight}>
                  <Text style={styles.totalsLabelHighlight}>Descuentos Aplicados</Text>
                  <Text style={styles.totalsValueHighlight}>- {data.totalDescuento.toFixed(2)} </Text>
                </View>
              )
            )}

            <View style={styles.totalsDivider} />

            <View style={styles.totalsRowFinal}>
              <Text style={styles.totalsLabelFinal}>TOTAL PUNTOS</Text>
              <Text style={styles.totalsValueFinal}>{data.total.toFixed(2)} </Text>
            </View>
          </View>
        </View>

        {/* 4. LISTADO DE ESTANCIAS */}
        {data.items.map((item) => (
          <View key={item.cartItemId} style={styles.itemContainer}>
            {/* Cabecera de la estancia */}
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <View style={styles.itemSubtotalBox}>
                <Text style={styles.itemSubtotalLabel}>Total estancia:</Text>
                <Text style={styles.itemSubtotal}>{item.subtotal.toFixed(2)} pts</Text>
              </View>
            </View>

            {/* Cabecera de columnas */}
            <View style={styles.piecesColHeader}>
              <View style={styles.colRef}><Text style={styles.colHeaderText}>Referencia / Material</Text></View>
              <View style={styles.colDims}><Text style={styles.colHeaderText}>Dimensiones</Text></View>
              <View style={styles.colAddons}><Text style={styles.colHeaderText}>Procesos de Fabricación</Text></View>
              <View style={[styles.colPrice, { alignItems: "flex-end" }]}><Text style={styles.colHeaderText}>Precio</Text></View>
            </View>

            {/* Filas de piezas */}
            {item.pieces.map((piece, i) => {
              const bd = getPieceBreakdown(item.piecesBreakdown, i);
              const rowStyle = i % 2 === 1 ? styles.pieceRowAlt : styles.pieceRow;

              return (
                <View key={piece.id} style={rowStyle} wrap={false}>
                  {/* Col 1: Referencia / Material */}
                  <View style={styles.colRef}>
                    <Text style={styles.pieceLabel}>P.{i + 1} — {piece.materialName}</Text>
                    {Object.keys(piece.attributes).length > 0 &&
                      Object.entries(piece.attributes).map(([key, val]) => (
                        <Text key={key} style={styles.attrText}>
                          • {formatCode(key)}: {String(val)}
                        </Text>
                      ))}
                  </View>

                  {/* Col 2: Dimensiones */}
                  <View style={styles.colDims}>
                    {bd ? (
                      <>
                        <Text style={styles.dimsText}>
                          {bd.dimensions.replace(" mm", "")}
                        </Text>
                        <Text style={styles.dimsUnit}>mm</Text>
                      </>
                    ) : (
                      <Text style={styles.dimsText}>{piece.dimensions}</Text>
                    )}
                  </View>

                  {/* Col 3: Addons con precio inline */}
                  <View style={styles.colAddons}>
                    {piece.addons.length === 0 ? (
                      <Text style={styles.noAddonText}>Corte limpio básico (sin extras)</Text>
                    ) : (
                      piece.addons.map((addon, idx) => {
                        const addonBd = bd?.addons?.[idx];
                        const hasMeasurements = Object.keys(addon.measurementsMap).length > 0;
                        const hasAttributes = Object.keys(addon.attributesMap).length > 0;

                        return (
                          <View key={idx} style={{ marginBottom: 4 }}>
                            <View style={styles.addonRow}>
                              <Text style={styles.addonName}>• {formatCode(addon.code)}</Text>
                              {addonBd && (
                                <Text style={styles.addonPrice}>+{addonBd.pricePoints.toFixed(2)}</Text>
                              )}
                            </View>
                            {hasMeasurements && (
                              <Text style={styles.addonMeasure}>
                                {Object.entries(addon.measurementsMap)
                                  .filter(([_, v]) => v !== undefined)
                                  .map(([k, v]) => `${formatCode(k.replace("_mm", "").replace("_ml", ""))}: ${v}`)
                                  .join("  ·  ")}
                              </Text>
                            )}
                            {hasAttributes && (
                              <Text style={styles.addonMeasure}>
                                Notas: {Object.values(addon.attributesMap).join(", ")}
                              </Text>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Col 4: Precio de la pieza */}
                  <View style={styles.colPrice}>
                    {bd ? (
                      <>
                        <View style={styles.basePriceRow}>
                          <Text style={styles.basePriceLabel}>Base</Text>
                          <Text style={styles.basePriceValue}>{bd.basePricePoints.toFixed(2)}</Text>
                        </View>
                        {bd.addons.length > 0 && (
                          <View style={styles.basePriceRow}>
                            <Text style={styles.basePriceLabel}>Extras</Text>
                            <Text style={styles.basePriceValue}>
                              +{bd.addons.reduce((s, a) => s + a.pricePoints, 0).toFixed(2)}
                            </Text>
                          </View>
                        )}
                        {bd.discountAmount > 0 && (
                          <View style={styles.discountRow}>
                            <Text style={styles.discountLabel}>Dto.</Text>
                            <Text style={styles.discountValue}>-{bd.discountAmount.toFixed(2)}</Text>
                          </View>
                        )}
                        <View style={styles.priceDivider} />
                        <Text style={styles.totalPriceLabel}>total</Text>
                        <Text style={styles.totalPriceValue}>{bd.finalPricePoints.toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 9, color: "#94a3b8", fontStyle: "italic" }}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* 5. NOTA LEGAL Y PAGINACIÓN */}
        <Text style={styles.footerNote} fixed>
          {data.footerText ||
            "Este documento es informativo y no constituye una factura legal. Los precios están expresados en puntos internos de la plataforma sujetos a las condiciones de venta. Para su aprobación, póngase en contacto con su comercial o apruebe este borrador directamente en el portal online."}
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
      </Page>
    </Document>
  );
};
