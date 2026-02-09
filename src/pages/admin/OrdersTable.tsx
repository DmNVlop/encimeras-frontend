import React, { useEffect, useState } from "react";
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { Box, Typography, Chip, Paper } from "@mui/material";

import { get } from "@/services/api.service";

import { useSocket } from "../../context/SocketContext";
import { OrderPreviewDrawer } from "./OrderPreviewDrawer";
import { useSearchParams } from "react-router-dom";
import { ordersApi } from "@/services/orders.service";

// Definición de columnas basada en tu OrderHeader [cite: 82]
const columns: GridColDef[] = [
  { field: "orderNumber", headerName: "Nº Orden", width: 150 },
  { field: "orderDate", headerName: "Fecha", width: 180, valueFormatter: (params) => new Date(params).toLocaleString() },
  { field: "customerId", headerName: "Cliente / Email", width: 250 },
  { field: "totalPoints", headerName: "Puntos", width: 120, type: "number" },
  {
    field: "status",
    headerName: "Estado",
    width: 150,
    renderCell: (params: GridRenderCellParams) => {
      const colors: any = {
        PENDING: "warning",
        APPROVED: "success",
        REJECTED: "error",
        MANUFACTURING: "info",
        SHIPPED: "success",
      };
      return <Chip label={params.value} color={colors[params.value] || "default"} size="small" />;
    },
  },
];

export const OrdersPage: React.FC = () => {
  // GESTIÓN DE URL (Deep Linking)
  const [searchParams, setSearchParams] = useSearchParams();
  const activeOrderId = searchParams.get("orderId"); // Leemos el ID de la URL
  const isDrawerOpen = Boolean(activeOrderId); // El estado 'open' es derivado

  // ESTADOS DE DATOS
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el detalle de la orden seleccionada
  const [selectedOrderFull, setSelectedOrderFull] = useState<any | null>(null);
  const [_isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Consumimos el socket del contexto (Singleton)
  const { socket } = useSocket(); // ,isConnected

  // 1. Carga inicial REST (Snapshot inicial)
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data: any[] = await get("/orders");
      // Aseguramos que cada fila tenga 'id' único para el DataGrid (usamos _id de Mongo)
      const mappedRows = data.map((order: any) => ({
        id: order._id || order.header.orderNumber, // Fallback ID
        ...order.header,
        // Guardamos una referencia al objeto original por si acaso
        _original: order,
      }));
      setRows(mappedRows);
    } catch (error) {
      console.error("Error cargando órdenes", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Suscripción a Eventos en Tiempo Real
  // ---------------------------------------------------------------------------
  // B. SOCKETS: MANEJO DE EVENTOS (NEW + UPDATE)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    // 1. Handler para NUEVAS órdenes (INSERT)
    const handleNewOrder = (newOrderPayload: any) => {
      setRows((prevRows) => {
        // Evitar duplicados (Idempotencia)
        if (prevRows.find((r) => r.orderNumber === newOrderPayload.orderNumber)) return prevRows;

        // Mapeo: Aseguramos que tenga 'id' para el DataGrid
        const newRow = {
          id: newOrderPayload._id, // Importante: _id viene del backend, lo mapeamos a id
          ...newOrderPayload,
        };
        return [newRow, ...prevRows];
      });
    };

    // 2. Handler para ACTUALIZACIONES (UPDATE status)
    const handleOrderUpdate = (updatedOrderPayload: any) => {
      console.log("handleOrderUpdate", updatedOrderPayload);
      const updatedId = updatedOrderPayload._id;

      // A. Actualizamos la TABLA (DataGrid)
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (row.id === updatedId) {
            // Fusionamos los datos nuevos con los existentes
            return { ...row, ...updatedOrderPayload };
          }
          return row;
        }),
      );

      // B. Actualizamos el DRAWER si está abierto con esa misma orden
      // Usamos el callback del setter para acceder al valor actual de selectedOrderFull
      setSelectedOrderFull((currentSelected: any) => {
        // Si hay una orden seleccionada y es la misma que se acaba de actualizar...
        if (currentSelected && (currentSelected._id === updatedId || currentSelected.id === updatedId)) {
          // ...actualizamos también el detalle visible en el drawer (especialmente el header/status)
          return {
            ...currentSelected,
            header: {
              ...currentSelected.header,
              status: updatedOrderPayload.status, // Actualizamos el estado
              // Aquí puedes añadir otros campos si cambian
            },
          };
        }
        return currentSelected;
      });
    };

    // --- SUSCRIPCIONES ---
    socket.on("orders:new", handleNewOrder);
    socket.on("orders:update", handleOrderUpdate);

    // --- CLEANUP ---
    return () => {
      socket.off("orders:new", handleNewOrder);
      socket.off("orders:update", handleOrderUpdate);
    };
  }, [socket]); // Dependencia: solo se reinicia si cambia la conexión socket

  // ---------------------------------------------------------------------------
  // C. SINCRONIZACIÓN URL -> DATOS (LA LÓGICA NUEVA)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Si hay un ID en la URL, cargamos el detalle
    if (activeOrderId) {
      loadOrderDetail(activeOrderId);
    } else {
      // Si no hay ID, limpiamos la selección
      setSelectedOrderFull(null);
    }
  }, [activeOrderId]); // Se ejecuta cada vez que cambia la URL

  const loadOrderDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      // Estrategia "Cache-First" ligera:
      // 1. Buscamos si ya tenemos la info básica en la tabla para mostrar algo rápido (Header)
      const basicInfo = rows.find((r) => r.id === id);
      if (basicInfo) {
        setSelectedOrderFull(basicInfo); // Mostramos el header inmediatamente
      }

      // 2. Pedimos el detalle completo (Technical Snapshot) al backend
      const data = await get(`/orders/${id}`);
      setSelectedOrderFull(data); // Actualizamos con la info completa
    } catch (error) {
      console.error("Error cargando detalle de orden:", error);
      // Opcional: Si el ID es inválido, limpiamos la URL
      // setSearchParams({});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: MANEJADOR DE CLIC EN FILA
  // ---------------------------------------------------------------------------

  // Al hacer clic en la fila, solo cambiamos la URL.
  // El useEffect de arriba reaccionará y cargará los datos.
  const handleRowClick = (params: any) => {
    const orderId = params.id;
    // Actualizamos URL preservando otros posibles params (opcional)
    setSearchParams({ orderId });
  };

  const handleCloseDrawer = () => {
    // Para cerrar, simplemente quitamos el param de la URL
    setSearchParams({});
  };

  const handleApprove = async (id: string) => {
    try {
      await ordersApi.updateStatus(id, "APPROVED");
      // El socket se encargará de refrescar la UI

      // Opcional: Cerrar el drawer si lo tienes abierto
      handleCloseDrawer();
    } catch (error) {
      console.error("Error update status:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await ordersApi.updateStatus(id, "REJECTED");
      // El socket se encargará de refrescar la UI

      // Opcional: Cerrar el drawer si lo tienes abierto
      handleCloseDrawer();
    } catch (error) {
      console.error("Error update status:", error);
    }
  };

  return (
    <Box sx={{ p: 3, height: "85vh", display: "flex", flexDirection: "column" }}>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Gestión de Órdenes
      </Typography>

      <Paper sx={{ flexGrow: 1 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id || row._id || row.orderNumber}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
          // Aquí añadiremos la acción de "Ver Detalle" más adelante
          onRowClick={(params) => {
            handleRowClick(params);
          }}
        />
      </Paper>

      {/* DRAWER CONTROLADO POR URL */}
      <OrderPreviewDrawer
        open={isDrawerOpen} // true si hay ?orderId=...
        onClose={handleCloseDrawer}
        order={selectedOrderFull}
        onApprove={handleApprove}
        onReject={handleReject}
        onOpenDetail={(id: any) => console.log("Navegar a detalle full:", id)}
      />
    </Box>
  );
};

export default OrdersPage;
