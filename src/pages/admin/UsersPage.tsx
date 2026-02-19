// src/pages/admin/UsersPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, Chip } from "@mui/material";
import { DataGrid, type GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { get, create, update, remove } from "@/services/api.service";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { User } from "@/interfases/user.interfase";
import AdminPageTitle from "./components/AdminPageTitle";
import UserModal from "./components/users/UserModal";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({});
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get<User[]>("/users");
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpen = (user?: User) => {
    setIsEditMode(!!user);
    setCurrentUser(user || {});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        await remove("/users", [id]);
        loadUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleSubmit = async (data: Partial<User>) => {
    try {
      if (isEditMode && currentUser._id) {
        await update("/users", currentUser._id, data);
      } else {
        await create("/users", data);
      }
      loadUsers();
      handleClose();
    } catch (error) {
      console.error("Error saving user:", error);
      // Aquí podrías manejar errores específicos como 409 Conflict
      if (typeof error === "object" && error !== null && "statusCode" in error) {
        const backendError = error as any;
        if (backendError.statusCode === 409) {
          alert("El nombre de usuario ya está en uso.");
        } else {
          alert(backendError.message || "Ocurrió un error al guardar.");
        }
      }
    }
  };

  const columns: GridColDef<User>[] = [
    { field: "username", headerName: "Usuario", width: 150 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "roles",
      headerName: "Roles",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center", height: "100%" }}>
          {params.value?.map((role: string) => (
            <Chip key={role} label={role} size="small" variant="outlined" color={role === "ADMIN" ? "primary" : "default"} />
          ))}
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Creado",
      width: 180,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : ""),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Acciones",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Editar" onClick={() => handleOpen(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Eliminar" onClick={() => handleDelete(params.id as string)} />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <AdminPageTitle>Gestión de Usuarios</AdminPageTitle>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Añadir Usuario
        </Button>
      </Box>

      <Box sx={{ height: "calc(100vh - 200px)", width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Box>

      <UserModal open={open} onClose={handleClose} onSubmit={handleSubmit} user={currentUser} isEditMode={isEditMode} />
    </Box>
  );
};

export default UsersPage;
