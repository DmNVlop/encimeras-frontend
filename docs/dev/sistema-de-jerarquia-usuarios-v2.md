## 📋 PLAN DE IMPLEMENTACIÓN UI/UX - Sistema de Jerarquía de Usuarios

📊 ANÁLISIS DE ESTADO ACTUAL
✅ Componentes Existentes Funcionales

- UsersPage.tsx: DataGrid con CRUD básico de usuarios
- UserModal.tsx: Formulario crear/editar con roles y factoryId
- RoleGuard: Protección de rutas por rol
- AuthProvider: Gestión de autenticación y contexto de usuario
- CustomersPage: Patrón de selección múltiple y batch operations
  ❌ Funcionalidades Faltantes (según nueva API)

1. Campos nuevos en User Interface:
   - ownerId?: string - Referencia al OWNER que gestiona al SALES
   - createdBy?: string - Usuario que creó este usuario
2. Endpoints no implementados:
   - GET /users/managed - Listar SALES gestionados por OWNER
   - POST /users/:id/transfer-owner - Transferencia individual
   - POST /users/batch-transfer - Transferencia masiva
   - Filtros: ?role=SALES, ?managed=true
3. UI/UX no existente:
   - Visualización de jerarquía OWNER → SALES
   - Modal de transferencia de ownership
   - Filtros avanzados en UsersPage
   - Indicadores visuales de relaciones
   - Búsqueda de usuarios

---

🎯 PLAN DE IMPLEMENTACIÓN DETALLADO
FASE 1: Actualización de Interfaces y Tipos
Prioridad: CRÍTICA | Estimación: 30 min
1.1 Actualizar src/interfases/user.interfase.ts
Cambios necesarios:
export interface User {
\_id: string;
id?: string;
username: string;
name?: string;
email?: string;
phone?: string;
roles: Role[];
factoryId?: string;
ownerId?: string; // ⬅️ NUEVO: Ref al OWNER gestor
createdBy?: string; // ⬅️ NUEVO: Ref al creador
createdAt: string;
updatedAt: string;
password?: string;
}
Ubicación: D:\Proyectos\DEV\presupuesto-encimeras\frontend\src\interfases\user.interfase.ts:11-23
1.2 Crear DTOs para transferencias
Archivo nuevo: src/interfases/user-transfer.interfase.ts
export interface TransferOwnerDto {
newOwnerId: string;
}
export interface BatchTransferDto {
userIds: string[];
newOwnerId: string;
}
export interface BatchTransferResponse {
transferred: number;
failed: string[];
}

---

FASE 2: Servicios de API
Prioridad: CRÍTICA | Estimación: 1h
2.1 Crear src/services/user.service.ts
Propósito: Centralizar todas las operaciones de usuarios (actualmente dispersas en UsersPage y api.service)
Métodos necesarios:
// Operaciones básicas (migrar de api.service)
export const getUsers = (params?: { role?: string; managed?: boolean }) => {...}
export const getUserById = (id: string) => {...}
export const createUser = (data: Partial<User>) => {...}
export const updateUser = (id: string, data: Partial<User>) => {...}
export const deleteUser = (id: string) => {...}
// ⬇️ NUEVOS endpoints para jerarquía
export const getManagedUsers = () => {...} // GET /users/managed
export const transferOwner = (userId: string, dto: TransferOwnerDto) => {...}
export const batchTransferOwner = (dto: BatchTransferDto) => {...}
export const getOwnerUsers = () => {...} // GET /users?role=OWNER (para select)
export const getSalesUsers = (params?: { ownerId?: string }) => {...} // Filtro SALES
Patrón a seguir: Inspirarse en customer.service.ts:1-100 que ya tiene batch operations

---

FASE 3: Actualización de UserModal
Prioridad: ALTA | Estimación: 1.5h
3.1 Modificar UserModal.tsx
Ubicación: D:\Proyectos\DEV\presupuesto-encimeras\frontend\src\pages\admin\components\users\UserModal.tsx
Cambios necesarios:
A) Añadir campo ownerId para ADMIN creando SALES
// Línea ~50: Determinar si mostrar selector de OWNER
const isAdmin = currentUser?.roles.includes("ADMIN");
const showOwnerSelector = isAdmin && roles.includes(Role.SALES);
B) Agregar selector de OWNER (solo visible para ADMIN creando SALES)
{showOwnerSelector && (
<FormControl fullWidth margin="normal" required>
<InputLabel>OWNER Gestor</InputLabel>
<Select
name="ownerId"
value={formData.ownerId || ""}
onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))} >
{ownerUsers.map(owner => (
<MenuItem key={owner._id} value={owner._id}>
{owner.name || owner.username} ({owner.username})
</MenuItem>
))}
</Select>
<FormHelperText>
Selecciona el OWNER que gestionará este usuario SALES
</FormHelperText>
</FormControl>
)}
C) Cargar lista de OWNERs en useEffect
const [ownerUsers, setOwnerUsers] = useState<User[]>([]);
useEffect(() => {
if (isAdmin) {
getOwnerUsers().then(setOwnerUsers);
}
}, [isAdmin]);
D) Validación automática según reglas de negocio
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

// Validación: ADMIN creando SALES requiere ownerId
if (isAdmin && roles.includes(Role.SALES) && !formData.ownerId && !isEditMode) {
alert("Debes seleccionar un OWNER gestor para usuarios SALES");
return;
}

// ... resto del submit
};
Alertas informativas:

- Para OWNER: "Este usuario será gestionado automáticamente por ti"
- Para ADMIN: "Selecciona el OWNER responsable de este comercial"

---

FASE 4: Mejoras en UsersPage
Prioridad: ALTA | Estimación: 2h
4.1 Añadir Filtros y Búsqueda
Ubicación: D:\Proyectos\DEV\presupuesto-encimeras\frontend\src\pages\admin\UsersPage.tsx:124-132
Componentes a añadir (inspirarse en CustomersPage.tsx:42-69):
// Estado para filtros
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState<string>("ALL");
const [managedOnlyFilter, setManagedOnlyFilter] = useState(false); // Solo OWNER
// Barra de filtros (antes del DataGrid)
<Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
<TextField
placeholder="Buscar por nombre, username, email..."
value={search}
onChange={(e) => setSearch(e.target.value)}
InputProps={{
      startAdornment: <InputAdornment><SearchIcon /></InputAdornment>
    }}
sx={{ flexGrow: 1 }}
/>

<Select
value={roleFilter}
onChange={(e) => setRoleFilter(e.target.value)}
sx={{ minWidth: 150 }}

>

    <MenuItem value="ALL">Todos los roles</MenuItem>
    {Object.values(Role).map(role => (
      <MenuItem key={role} value={role}>{role}</MenuItem>
    ))}

  </Select>
  
  {isOwner && (
    <FormControlLabel
      control={
        <Checkbox
          checked={managedOnlyFilter}
          onChange={(e) => setManagedOnlyFilter(e.target.checked)}
        />
      }
      label="Solo mis SALES"
    />
  )}
</Box>
Lógica de filtrado:
useEffect(() => {
  const term = search.toLowerCase();
  const filtered = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(term) ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term));
    const matchesRole = roleFilter === "ALL" || user.roles.includes(roleFilter as Role);
    
    // Si isOwner y managedOnlyFilter activo, filtrar solo sus SALES
    const matchesManaged = !managedOnlyFilter || 
      (user.ownerId === currentUser?.id && user.roles.includes(Role.SALES));
    return matchesSearch && matchesRole && matchesManaged;
  });
  
  setFilteredUsers(filtered);
}, [search, roleFilter, managedOnlyFilter, users, isOwner, currentUser]);
4.2 Añadir columnas de jerarquía al DataGrid
Nuevas columnas:
{
  field: "ownerId",
  headerName: "Gestionado por",
  width: 200,
  renderCell: (params) => {
    if (!params.value) return <Chip label="N/A" size="small" />;
    
    const owner = users.find(u => u._id === params.value);
    return (
      <Chip
        label={owner?.name || owner?.username || "Unknown"}
        size="small"
        variant="outlined"
        color="secondary"
        icon={<PersonIcon />}
      />
    );
  },
},
{
  field: "createdBy",
  headerName: "Creado por",
  width: 180,
  renderCell: (params) => {
    const creator = users.find(u => u._id === params.value);
    return creator ? (creator.name || creator.username) : "-";
  },
},
Mejorar columna de roles con indicadores:
{
  field: "roles",
  headerName: "Roles",
  width: 280,
  renderCell: (params) => (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
      {params.value?.map((role: string) => (
        <Chip
          key={role}
          label={role}
          size="small"
          variant="outlined"
          color={
            role === "ADMIN" ? "error" :
            role === "OWNER" ? "secondary" :
            role === "SALES" ? "success" :
            "default"
          }
          icon={
            role === "ADMIN" ? <AdminPanelSettingsIcon /> :
            role === "OWNER" ? <BusinessIcon /> :
            role === "SALES" ? <SellIcon /> :
            undefined
          }
        />
      ))}
    </Box>
  ),
}
4.3 Añadir Batch Operations (Selección Múltiple)
Patrón: Seguir exactamente CustomersPage.tsx:50-70 (estado de selección)
// Estado de selección
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
// En DataGrid
<DataGrid
  checkboxSelection
  onRowSelectionModelChange={(newSelection) => {
    setSelectedIds(new Set(newSelection as string[]));
  }}
  rowSelectionModel={Array.from(selectedIds)}
  // ... resto props
/>
// Botones de acción masiva
{selectedIds.size > 0 && (
  <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
    <Typography variant="body2" sx={{ mb: 1 }}>
      {selectedIds.size} usuario(s) seleccionado(s)
    </Typography>
    <Stack direction="row" spacing={2}>
      {isAdmin && (
        <Button
          variant="contained"
          startIcon={<SwapHorizIcon />}
          onClick={() => setTransferDialogOpen(true)}
        >
          Transferir Ownership
        </Button>
      )}
      <Button
        variant="outlined"
        color="error"
        startIcon={<DeleteIcon />}
        onClick={() => setDeleteDialogOpen(true)}
      >
        Eliminar Seleccionados
      </Button>
      <Button variant="text" onClick={() => setSelectedIds(new Set())}>
        Limpiar Selección
      </Button>
    </Stack>
  </Box>
)}
---
FASE 5: Modal de Transferencia de Ownership
Prioridad: ALTA | Estimación: 2h
5.1 Crear componente TransferOwnerDialog.tsx
Ubicación nueva: src/pages/admin/components/users/TransferOwnerDialog.tsx
Props:
interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];      // IDs de SALES a transferir
  users: User[];          // Lista completa para nombres
  onSubmit: (newOwnerId: string) => Promise<void>;
}
Funcionalidades:
1. Validación previa: Verificar que todos los seleccionados sean SALES
const salesUsers = users.filter(u => 
  userIds.includes(u._id) && u.roles.includes(Role.SALES)
);
const invalidUsers = userIds.length - salesUsers.length;
if (invalidUsers > 0) {
  return (
    <Alert severity="warning">
      {invalidUsers} usuario(s) seleccionado(s) no son SALES y serán ignorados
    </Alert>
  );
}
2. Selector de nuevo OWNER con información visual
<FormControl fullWidth required>
  <InputLabel>Nuevo OWNER Gestor</InputLabel>
  <Select
    value={selectedOwnerId}
    onChange={(e) => setSelectedOwnerId(e.target.value)}
  >
    {ownerUsers.map(owner => (
      <MenuItem key={owner._id} value={owner._id}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24 }}>
            {owner.name?.[0] || owner.username[0]}
          </Avatar>
          <Box>
            <Typography variant="body2">
              {owner.name || owner.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Factory: {owner.factoryId || 'N/A'}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
    ))}
  </Select>
</FormControl>
3. Preview de cambios
<Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
  <Typography variant="subtitle2" gutterBottom>
    Usuarios a transferir:
  </Typography>
  {salesUsers.map(user => {
    const currentOwner = users.find(u => u._id === user.ownerId);
    return (
      <Box key={user._id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
        <PersonIcon fontSize="small" />
        <Typography variant="body2">{user.name || user.username}</Typography>
        <Typography variant="caption" color="text.secondary">
          {currentOwner?.username || 'Sin owner'} → {selectedOwnerUsername}
        </Typography>
      </Box>
    );
  })}
</Box>
4. Confirmación y feedback
const handleSubmit = async () => {
  setLoading(true);
  try {
    if (userIds.length === 1) {
      await transferOwner(userIds[0], { newOwnerId: selectedOwnerId });
    } else {
      await batchTransferOwner({ userIds, newOwnerId: selectedOwnerId });
    }
    
    setSnackbar({
      open: true,
      message: `${userIds.length} usuario(s) transferidos exitosamente`,
      severity: 'success'
    });
    
    onClose();
    // Recargar usuarios
  } catch (error) {
    setSnackbar({
      open: true,
      message: `Error: ${error.message}`,
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
---
FASE 6: Mejoras Visuales y UX
Prioridad: MEDIA | Estimación: 1.5h
6.1 Indicadores de Jerarquía en DataGrid
A) Tooltip con información completa
import { Tooltip, IconButton } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
{
  field: "hierarchy",
  headerName: "Info",
  width: 60,
  renderCell: (params) => {
    const user = params.row as User;
    const owner = users.find(u => u._id === user.ownerId);
    const creator = users.find(u => u._id === user.createdBy);
    
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" display="block">
              <strong>Creado por:</strong> {creator?.name || creator?.username || 'N/A'}
            </Typography>
            {user.ownerId && (
              <Typography variant="caption" display="block">
                <strong>Gestionado por:</strong> {owner?.name || owner?.username}
              </Typography>
            )}
            <Typography variant="caption" display="block">
              <strong>Factory:</strong> {user.factoryId || 'N/A'}
            </Typography>
          </Box>
        }
        arrow
      >
        <IconButton size="small">
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  },
}
B) Badge visual para SALES con OWNER
{
  field: "roles",
  renderCell: (params) => {
    const user = params.row as User;
    const hasSalesRole = user.roles.includes(Role.SALES);
    const hasOwner = !!user.ownerId;
    
    return (
      <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
        {params.value?.map((role: string) => (
          <Badge
            key={role}
            badgeContent={
              role === Role.SALES && hasOwner ? "👤" : 0
            }
            color="secondary"
          >
            <Chip label={role} size="small" variant="outlined" {...} />
          </Badge>
        ))}
      </Box>
    );
  },
}
6.2 Vista de "Mis
Excelente. Ahora voy a crear el plan de implementación detallado basado en tus preferencias.
📋 PLAN DE IMPLEMENTACIÓN UI/UX - SISTEMA DE JERARQUÍAS Y GESTIÓN DE USUARIOS
📊 RESUMEN EJECUTIVO
Objetivo: Implementar UI/UX completa para el sistema de jerarquías OWNER-SALES documentado en la API actualizada.
Estado actual: 
- ✅ UI básica de CRUD usuarios funcional
- ✅ Sistema de roles implementado
- ❌ Sin campos ownerId ni createdBy en UI
- ❌ Sin endpoints de transferencia integrados
- ❌ Sin filtros avanzados ni búsqueda
- ❌ Sin indicadores visuales de jerarquía
Alcance: 4 funcionalidades prioritarias seleccionadas
- Sistema jerarquía OWNER-SALES
- Transferencia de usuarios (individual y masiva)
- Filtros y búsqueda avanzada
- Mejoras visuales y UX
---
🎯 FASE 1: ACTUALIZACIÓN DE INTERFACES Y MODELOS
1.1 Actualizar Interface User
Archivo: src/interfases/user.interfase.ts
Cambios necesarios:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  
  // ✨ NUEVOS CAMPOS
  ownerId?: string;        // ID del OWNER que gestiona este usuario
  createdBy?: string;      // ID del usuario que creó este registro
  
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Impacto: Afecta a todos los componentes que usan User interface
---
1.2 Crear DTOs de Transferencia
Archivos nuevos:
src/interfases/transfer-owner.dto.ts:
export interface TransferOwnerDto {
  newOwnerId: string;
}
export interface BatchTransferDto {
  userIds: string[];
  newOwnerId: string;
}
export interface BatchTransferResponse {
  transferred: number;
  failed: Array<{ userId: string; reason: string }>;
}
---
🎯 FASE 2: SERVICIOS Y API INTEGRATION
2.1 Extender API Service para nuevos endpoints
Archivo: src/services/api.service.ts (si es necesario) o crear src/services/user.service.ts
Opción recomendada: Crear servicio dedicado
Archivo nuevo: src/services/user.service.ts
import { get, post, patch, remove } from './api.service';
import type { User } from '@/interfases/user.interfase';
import type { TransferOwnerDto, BatchTransferDto, BatchTransferResponse } from '@/interfases/transfer-owner.dto';
export class UserService {
  // Obtener usuarios con filtros
  static async getUsers(filters?: { role?: string; managed?: boolean }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.managed) params.append('managed', 'true');
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return get<User[]>(`/users${query}`);
  }
  // Obtener usuarios SALES gestionados por el OWNER actual
  static async getManagedUsers(): Promise<User[]> {
    return get<User[]>('/users/managed');
  }
  // Transferencia individual
  static async transferOwnership(userId: string, dto: TransferOwnerDto): Promise<User> {
    return post<User>(`/users/${userId}/transfer-owner`, dto);
  }
  // Transferencia masiva
  static async batchTransfer(dto: BatchTransferDto): Promise<BatchTransferResponse> {
    return post<BatchTransferResponse>('/users/batch-transfer', dto);
  }
  // Obtener usuarios con rol OWNER (para selector de transferencias)
  static async getOwners(): Promise<User[]> {
    return this.getUsers({ role: 'OWNER' });
  }
  // CRUD tradicional
  static async createUser(data: Partial<User>): Promise<User> {
    return post<User>('/users', data);
  }
  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return patch<User>(`/users/${id}`, data);
  }
  static async deleteUser(id: string): Promise<void> {
    return remove('/users', [id]);
  }
}
Impacto: Centraliza lógica de usuarios y facilita testing
---
🎯 FASE 3: COMPONENTES UI - ACTUALIZACIÓN Y NUEVOS
3.1 Actualizar UserModal
Archivo: src/pages/admin/components/users/UserModal.tsx
Cambios necesarios:
1. Añadir selector de Owner (solo ADMIN creando SALES):
// Nuevo estado
const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
const [owners, setOwners] = useState<User[]>([]);
// Cargar owners si es ADMIN
useEffect(() => {
  if (currentUser?.roles.includes('ADMIN')) {
    UserService.getOwners().then(setOwners);
  }
}, [currentUser]);
// Nuevo campo en formulario (solo visible para ADMIN creando SALES)
{isAdmin && roles.includes(Role.SALES) && !isEditMode && (
  <FormControl fullWidth margin="normal" required>
    <InputLabel>Owner Asignado</InputLabel>
    <Select
      value={selectedOwnerId}
      onChange={(e) => setSelectedOwnerId(e.target.value)}
      label="Owner Asignado"
    >
      {owners.map(owner => (
        <MenuItem key={owner._id} value={owner._id}>
          {owner.name || owner.username} ({owner.email})
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      Selecciona el OWNER que gestionará este usuario SALES
    </FormHelperText>
  </FormControl>
)}
2. Modificar lógica de submit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const submissionData: any = {
    ...formData,
    roles,
  };
  // Si es ADMIN creando SALES, incluir ownerId
  if (isAdmin && roles.includes(Role.SALES) && selectedOwnerId) {
    submissionData.ownerId = selectedOwnerId;
  }
  
  // OWNER creando SALES: backend auto-asigna ownerId
  // No enviamos ownerId en este caso
  if (password) {
    submissionData.password = password;
  }
  if (autoFactoryId) {
    submissionData.factoryId = autoFactoryId;
  }
  await onSubmit(submissionData);
  onClose();
};
3. Añadir validación visual:
- Warning si ADMIN crea SALES sin seleccionar owner
- Info alert explicando que OWNER auto-asigna ownership
---
3.2 NUEVO COMPONENTE: TransferOwnerDialog
Archivo nuevo: src/pages/admin/components/users/TransferOwnerDialog.tsx
Propósito: Diálogo para transferir usuarios SALES entre OWNERs
Props:
interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: User[]; // Usuarios a transferir
  onTransferComplete: () => void; // Callback después de transferencia exitosa
}
Features:
- Selector de nuevo OWNER (dropdown)
- Lista de usuarios a transferir (chips o lista)
- Confirmación visual
- Manejo de errores por usuario (en batch)
- Progress indicator durante transferencia
Estructura visual:
┌─────────────────────────────────────┐
│ Transferir Usuarios                 │
├─────────────────────────────────────┤
│ Usuarios seleccionados:             │
│ ┌─────────────────────────────────┐ │
│ │ [Chip] Juan Pérez (SALES)       │ │
│ │ [Chip] María López (SALES)      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Nuevo Owner:                        │
│ [Select: Pedro García (Factory A)]  │
│                                     │
│ ⚠️ Esta acción transferirá la       │
│    gestión de 2 usuarios            │
│                                     │
│        [Cancelar]  [Transferir]     │
└─────────────────────────────────────┘
Implementación:
const TransferOwnerDialog: React.FC<TransferOwnerDialogProps> = ({
  open,
  onClose,
  selectedUsers,
  onTransferComplete,
}) => {
  const [owners, setOwners] = useState<User[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      UserService.getOwners().then(setOwners);
    }
  }, [open]);
  const handleTransfer = async () => {
    if (!selectedOwnerId) return;
    
    setLoading(true);
    setError(null);
    try {
      if (selectedUsers.length === 1) {
        // Transferencia individual
        await UserService.transferOwnership(selectedUsers[0]._id, {
          newOwnerId: selectedOwnerId
        });
      } else {
        // Transferencia masiva
        const result = await UserService.batchTransfer({
          userIds: selectedUsers.map(u => u._id),
          newOwnerId: selectedOwnerId
        });
        
        if (result.failed.length > 0) {
          setError(`${result.failed.length} usuarios no pudieron ser transferidos`);
        }
      }
      
      onTransferComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al transferir usuarios');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Implementación completa del diálogo */}
    </Dialog>
  );
};
---
3.3 NUEVO COMPONENTE: UserHierarchyChip
Archivo nuevo: src/pages/admin/components/users/UserHierarchyChip.tsx
Propósito: Mostrar visualmente la relación jerárquica en la tabla
Props:
interface UserHierarchyChipProps {
  user: User;
  ownerName?: string; // Nombre del owner si está disponible
  compact?: boolean;
}
Visual:
┌──────────────────────────┐
│ 👤 Gestionado por:       │
│    Pedro García          │
└──────────────────────────┘
o versión compacta:
[👤 Pedro García]
Implementación:
const UserHierarchyChip: React.FC<UserHierarchyChipProps> = ({
  user,
  ownerName,
  compact = false
}) => {
  if (!user.ownerId) return null;
  if (compact) {
    return (
      <Chip
        size="small"
        icon={<PersonIcon />}
        label={ownerName || user.ownerId}
        color="secondary"
        variant="outlined"
      />
    );
  }
  return (
    <Tooltip title={`Creado por: ${user.createdBy || 'Desconocido'}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PersonIcon fontSize="small" color="secondary" />
        <Typography variant="caption" color="text.secondary">
          {ownerName || user.ownerId}
        </Typography>
      </Box>
    </Tooltip>
  );
};
---
3.4 ACTUALIZAR UsersPage
Archivo: src/pages/admin/UsersPage.tsx
**Cambios principales
Perfecto! Ahora voy a crear el plan de implementación detallado.
📋 Plan de Implementación: Sistema de Jerarquías y Gestión Avanzada de Usuarios
Basándome en el análisis de los documentos API actualizados y el estado actual del frontend, he identificado las siguientes brechas y oportunidades de mejora:
---
🎯 Resumen Ejecutivo
Estado Actual
- ✅ CRUD básico de usuarios funcional (UsersPage.tsx + UserModal.tsx)
- ✅ Sistema de roles implementado (ADMIN, OWNER, SALES, USER, WORKER)
- ✅ Auto-asignación de factoryId para usuarios OWNER
- ❌ NO existe campo ownerId en la interfaz User
- ❌ NO existe campo createdBy en la interfaz User
- ❌ NO hay UI para gestionar jerarquías OWNER-SALES
- ❌ NO hay endpoints de transferencia implementados
- ❌ NO hay filtros avanzados en UsersPage (a diferencia de CustomersPage)
- ❌ NO hay indicadores visuales de relaciones entre usuarios
Nuevas Funcionalidades del Backend (según docs)
1. Campos nuevos: ownerId, createdBy
2. Endpoints nuevos:
   - GET /users/managed - Lista SALES gestionados por OWNER
   - POST /users/:id/transfer-owner - Transferencia individual
   - POST /users/batch-transfer - Transferencia masiva
3. Parámetros de filtrado: ?role=SALES, ?managed=true
4. Reglas de jerarquía automáticas al crear usuarios
---
📦 Fases de Implementación
FASE 1: Actualización de Interfaces y Tipos 
Prioridad: CRÍTICA | Esfuerzo: 1-2 horas
1.1 Actualizar user.interface.ts
Archivo: src/interfases/user.interfase.ts
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  
  // 🆕 NUEVOS CAMPOS
  ownerId?: string;        // Referencia al OWNER que gestiona este usuario
  createdBy?: string;       // ID del usuario que creó este registro
  
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Validaciones:
- ownerId debe ser opcional (solo para usuarios SALES)
- createdBy será read-only desde la UI
---
FASE 2: Mejoras en UserModal 
Prioridad: ALTA | Esfuerzo: 3-4 horas
2.1 Añadir lógica de ownerId para ADMIN
Archivo: src/pages/admin/components/users/UserModal.tsx
Cambios necesarios:
1. Añadir estado para selección de OWNER:
const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
const [ownersList, setOwnersList] = useState<User[]>([]);
2. Cargar lista de OWNERs al abrir el modal (solo para ADMIN):
useEffect(() => {
  if (open && !isOwner && currentUser?.roles.includes("ADMIN")) {
    // Fetch owners: GET /users?role=OWNER
    fetchOwners();
  }
}, [open]);
3. Añadir Select de OWNER (solo visible para ADMIN creando SALES):
{isAdmin && roles.includes(Role.SALES) && (
  <FormControl fullWidth margin="normal" required>
    <InputLabel>Owner Asignado</InputLabel>
    <Select
      value={selectedOwnerId}
      onChange={(e) => setSelectedOwnerId(e.target.value)}
      label="Owner Asignado"
    >
      {ownersList.map((owner) => (
        <MenuItem key={owner._id} value={owner._id}>
          {owner.name || owner.username} - {owner.email}
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      Requerido para crear usuarios SALES
    </FormHelperText>
  </FormControl>
)}
4. Incluir ownerId en submission:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const submissionData: any = {
    ...formData,
    roles,
  };
  // Si ADMIN está creando SALES, incluir ownerId
  if (isAdmin && roles.includes(Role.SALES) && selectedOwnerId) {
    submissionData.ownerId = selectedOwnerId;
  }
  
  // ... resto del código
};
2.2 Validaciones adicionales
- Si rol SALES está seleccionado y usuario es ADMIN → ownerId requerido
- Mostrar error si ADMIN intenta crear SALES sin seleccionar owner
- Deshabilitar botón "Guardar" si falta ownerId en modo creación SALES
---
FASE 3: Mejoras en UsersPage - Filtros y Búsqueda 
Prioridad: ALTA | Esfuerzo: 4-5 horas
3.1 Añadir barra de búsqueda y filtros
Archivo: src/pages/admin/UsersPage.tsx
Componentes a añadir:
const [search, setSearch] = useState("");
const [roleFilter, setRoleFilter] = useState<string>("ALL");
const [managedFilter, setManagedFilter] = useState(false); // Solo para OWNER
const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
UI de filtros (inspirada en CustomersPage):
<Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
  <TextField
    placeholder="Buscar por nombre, username, email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      ),
    }}
    sx={{ flexGrow: 1 }}
  />
  
  <Select
    value={roleFilter}
    onChange={(e) => setRoleFilter(e.target.value)}
    sx={{ minWidth: 150 }}
  >
    <MenuItem value="ALL">Todos los roles</MenuItem>
    <MenuItem value="ADMIN">ADMIN</MenuItem>
    <MenuItem value="OWNER">OWNER</MenuItem>
    <MenuItem value="SALES">SALES</MenuItem>
    <MenuItem value="USER">USER</MenuItem>
    <MenuItem value="WORKER">WORKER</MenuItem>
  </Select>
  {isOwnerUser && (
    <FormControlLabel
      control={
        <Checkbox
          checked={managedFilter}
          onChange={(e) => setManagedFilter(e.target.checked)}
        />
      }
      label="Solo mis SALES"
    />
  )}
</Box>
3.2 Lógica de filtrado
useEffect(() => {
  let result = [...users];
  
  // Filtro por búsqueda
  if (search) {
    const term = search.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }
  
  // Filtro por rol
  if (roleFilter !== "ALL") {
    result = result.filter(u => u.roles.includes(roleFilter as Role));
  }
  
  setFilteredUsers(result);
}, [users, search, roleFilter]);
3.3 Modificar loadUsers() para soportar query params
const loadUsers = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    let url = "/users";
    
    // Si OWNER y tiene activado el filtro "Solo mis SALES"
    if (isOwnerUser && managedFilter) {
      url = "/users/managed"; // Nuevo endpoint
    }
    
    const data = await get<User[]>(url);
    setUsers(data);
  } catch (err) {
    console.error("Error loading users:", err);
    setError(err);
  } finally {
    setLoading(false);
  }
}, [managedFilter, isOwnerUser]);
---
FASE 4: Indicadores Visuales de Jerarquía 
Prioridad: MEDIA | Esfuerzo: 2-3 horas
4.1 Añadir columnas informativas al DataGrid
Archivo: src/pages/admin/UsersPage.tsx
const columns: GridColDef<User>[] = [
  { field: "username", headerName: "Usuario", width: 150 },
  { field: "name", headerName: "Nombre", width: 200 },
  { field: "email", headerName: "Email", width: 200 },
  
  // ... roles y factoryId existentes ...
  
  // 🆕 NUEVA COLUMNA: Owner Asignado
  {
    field: "ownerId",
    headerName: "Gestionado por",
    width: 180,
    renderCell: (params) => {
      if (!params.value) return <Chip label="-" size="small" variant="outlined" />;
      
      // Buscar el owner en la lista de usuarios
      const owner = users.find(u => u._id === params.value);
      return (
        <Chip 
          label={owner?.name || owner?.username || "Owner"} 
          size="small" 
          color="secondary"
          icon={<PersonIcon />}
        />
      );
    },
  },
  
  // 🆕 NUEVA COLUMNA: Creado por
  {
    field: "createdBy",
    headerName: "Creado por",
    width: 150,
    renderCell: (params) => {
      const creator = users.find(u => u._id === params.value);
      return (
        <Tooltip title={creator?.email || ""}>
          <Chip 
            label={creator?.username || "-"} 
            size="small" 
            variant="outlined"
          />
        </Tooltip>
      );
    },
  },
  
  // ... resto de columnas ...
];
4.2 Añadir badge visual para SALES con owner
{
  field: "roles",
  headerName: "Roles",
  width: 250,
  renderCell: (params) => (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
      {params.value?.map((role: string) => (
        <Chip 
          key={role} 
          label={role} 
          size="small" 
          variant="outlined" 
          color={
            role === "ADMIN" ? "primary" : 
            role === "OWNER" ? "secondary" : 
            "default"
          } 
        />
      ))}
      
      {/* 🆕 Badge si es SALES con owner asignado */}
      {params.row.ownerId && params.value?.includes("SALES") && (
        <Tooltip title={`Gestionado por ${users.find(u => u._id === params.row.ownerId)?.name || 'Owner'}`}>
          <Chip 
            label={<AccountTreeIcon fontSize="small" />}
            size="small" 
            color="info"
            variant="filled"
          />
        </Tooltip>
      )}
    </Box>
  ),
},
---
FASE 5: Sistema de Transferencia de Usuarios 
Prioridad: ALTA | Esfuerzo: 6-8 horas
5.1 Crear componente TransferOwnerDialog
Archivo nuevo: src/pages/admin/components/users/TransferOwnerDialog.tsx
Funcionalidad:
- Modal para transferir uno o varios usuarios SALES a otro OWNER
- Select con lista de OWNERs disponibles
- Validación: solo usuarios SALES pueden ser transferidos
- Mostrar warning si hay múltiples usuarios seleccionados
- Confirmación antes de ejecutar transferencia
Props:
interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];  // IDs de usuarios a transferir
  users: User[];      // Lista completa para mostrar nombres
  onTransferComplete: () => void;
}
Estructura del componente:
const TransferOwnerDialog: React.FC<TransferOwnerDialogProps> = ({
  open,
  onClose,
  userIds,
  users,
  onTransferComplete,
}) => {
  const [newOwnerId, setNewOwnerId] = useState("");
  const [ownersList, setOwnersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      // Fetch GET /users?role=OWNER
      fetchOwners();
    }
  }, [open]);
  
  const handleTransfer = async () => {
    try {
      setLoading(true);
      
      if (userIds.length === 1) {
        // POST /users/:id/transfer-owner
        await post(`/users/${userIds[0]}/transfer-owner`, { newOwnerId });
      } else {
        // POST /users/batch-transfer
        await post("/users/batch-transfer", { userIds, newOwnerId });
      }
      
      setSnackbar
Perfecto! Ahora voy a crear el plan detallado de implementación basado en tus preferencias.
📋 Plan de Implementación: Sistema de Jerarquía OWNER-SALES y Mejoras UI/UX
---
📊 RESUMEN EJECUTIVO
Basado en el análisis de los documentos de API actualizados y el estado actual del frontend, se requiere implementar:
1. Sistema de jerarquía OWNER-SALES con campos ownerId y createdBy
2. Transferencia de usuarios (individual y masiva) entre OWNERs
3. Filtros avanzados en gestión de usuarios
4. Mejoras visuales para representar jerarquías y relaciones
Estado actual detectado:
- ✅ Estructura base de usuarios con roles implementada
- ✅ UserModal con creación/edición funcional
- ✅ UsersPage con DataGrid básico
- ❌ No hay campos ownerId ni createdBy en la interfaz
- ❌ No existe UI para transferencias
- ❌ No hay filtros ni búsqueda en UsersPage
- ❌ No hay indicadores visuales de jerarquía
---
🎯 FASE 1: ACTUALIZACIÓN DE INTERFACES Y TIPOS
Objetivo: Sincronizar el modelo de datos del frontend con la API actualizada
1.1 Actualizar src/interfases/user.interfase.ts
Cambios requeridos:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;        // ⭐ NUEVO: Referencia al OWNER que gestiona este usuario
  createdBy?: string;      // ⭐ NUEVO: ID del usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Archivos afectados:
- src/interfases/user.interfase.ts
Validaciones a considerar:
- ownerId debe ser opcional (solo aplica a rol SALES)
- createdBy se debe poblar automáticamente desde el backend
- Ambos campos son tipo ObjectId (strings en frontend)
---
🎯 FASE 2: NUEVO COMPONENTE - TRANSFERENCIA DE USUARIOS
Objetivo: Crear UI para transferir usuarios SALES entre OWNERs (solo ADMIN)
2.1 Crear src/pages/admin/components/users/TransferUserDialog.tsx
Características:
- Dialog modal similar al patrón usado en CustomersPage.tsx:assignDialogOpen
- Solo visible para usuarios con rol ADMIN
- Permite transferencia individual o masiva
- Muestra información del OWNER actual vs nuevo OWNER
- Confirmación antes de ejecutar
Props del componente:
interface TransferUserDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[], newOwnerId: string) => Promise<void>;
  selectedUsers: User[];  // Usuarios seleccionados para transferir
  ownersList: User[];     // Lista de OWNERs disponibles
}
Estructura visual:
┌─────────────────────────────────────────┐
│ Transferir Usuarios SALES               │
├─────────────────────────────────────────┤
│ Usuarios seleccionados: 3               │
│ ┌─────────────────────────────────────┐ │
│ │ • Juan Pérez (SALES) - Owner: ABC   │ │
│ │ • María López (SALES) - Owner: ABC  │ │
│ │ • Carlos Ruiz (SALES) - Owner: ABC  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Seleccionar nuevo OWNER:                │
│ ┌─────────────────────────────────────┐ │
│ │ [Dropdown: OWNERs disponibles]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⚠️ Esta acción no se puede deshacer    │
│                                         │
│ [Cancelar]  [Transferir]               │
└─────────────────────────────────────────┘
Validaciones UI:
- Solo mostrar usuarios con rol SALES en la selección
- Deshabilitar botón si no hay OWNER seleccionado
- Mostrar warning si algún usuario seleccionado no es SALES
- Feedback de éxito/error con Snackbar
---
2.2 Crear servicios API para transferencia
Archivo: src/services/user.service.ts (NUEVO)
import { post } from './api.service';
import type { User } from '@/interfases/user.interfase';
export interface TransferOwnerDto {
  newOwnerId: string;
}
export interface BatchTransferDto {
  userIds: string[];
  newOwnerId: string;
}
export interface BatchTransferResponse {
  transferred: number;
  failed: string[];
}
export const UserService = {
  // Transferencia individual
  transferOwner: async (userId: string, newOwnerId: string): Promise<User> => {
    return post<User>(`/users/${userId}/transfer-owner`, { newOwnerId });
  },
  // Transferencia masiva
  batchTransfer: async (userIds: string[], newOwnerId: string): Promise<BatchTransferResponse> => {
    return post<BatchTransferResponse>('/users/batch-transfer', { userIds, newOwnerId });
  },
  // Obtener usuarios gestionados por el OWNER actual
  getManagedUsers: async (): Promise<User[]> => {
    return get<User[]>('/users/managed');
  },
  // Obtener usuarios con filtros
  getUsers: async (params?: { role?: string; managed?: boolean }): Promise<User[]> => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.managed) queryParams.append('managed', 'true');
    
    const query = queryParams.toString();
    return get<User[]>(`/users${query ? '?' + query : ''}`);
  },
};
---
🎯 FASE 3: MEJORAR USERSPAGE CON FILTROS Y SELECCIÓN MÚLTIPLE
Objetivo: Convertir UsersPage en una interfaz completa similar a CustomersPage
3.1 Actualizar src/pages/admin/UsersPage.tsx
Nuevas funcionalidades a agregar:
A. Barra de búsqueda
const [search, setSearch] = useState("");
// Filtrado similar a CustomersPage
useEffect(() => {
  const term = search.toLowerCase();
  const filtered = users.filter((u) => {
    return (
      u.username.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
  });
  setFilteredUsers(filtered);
}, [search, users]);
B. Filtro por rol
const [roleFilter, setRoleFilter] = useState<string>("ALL");
// Opciones: ALL, ADMIN, OWNER, SALES, USER, WORKER
C. Filtro "Mis usuarios gestionados" (solo OWNER)
const [showManagedOnly, setShowManagedOnly] = useState(false);
// Cuando está activo, llama a UserService.getManagedUsers()
D. Selección múltiple para transferencias
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
// Usar DataGrid checkboxSelection prop
// Similar a CustomersPage.tsx líneas 50-52
E. Barra de acciones masivas
// Mostrar solo cuando selectedIds.size > 0 y user es ADMIN
<Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2 }}>
  <Stack direction="row" spacing={2} alignItems="center">
    <Typography>{selectedIds.size} usuarios seleccionados</Typography>
    <Button 
      startIcon={<SwapHorizIcon />}
      onClick={() => setTransferDialogOpen(true)}
      disabled={!canTransferSelected()}
    >
      Transferir a otro OWNER
    </Button>
    <Button onClick={clearSelection}>Cancelar</Button>
  </Stack>
</Paper>
Layout visual de la página actualizada:
┌─────────────────────────────────────────────────────────────┐
│ Gestión de Usuarios                    [+ Añadir Usuario]   │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Rol: ALL ▼] [☐ Solo mis
Excelente! Ahora voy a crear el plan detallado de implementación.
📋 Plan de Implementación UI/UX - Sistema de Jerarquía de Usuarios
📊 Resumen Ejecutivo
Basado en el análisis de la documentación API actualizada (users-api.md y sistema-de-jerarquias-usuarios.md) y el estado actual del frontend, se requiere implementar:
Nuevas Funcionalidades del Backend a Integrar:
1. ✅ Campos ownerId y createdBy en modelo User
2. ✅ Endpoint GET /users/managed (OWNER)
3. ✅ Endpoint POST /users/:id/transfer-owner (ADMIN)
4. ✅ Endpoint POST /users/batch-transfer (ADMIN)
5. ✅ Lógica de auto-asignación de ownerId (OWNER → SALES)
6. ✅ Filtro ?managed=true en GET /users
Estado Actual del Frontend:
- ✅ Componente UsersPage con DataGrid funcional
- ✅ UserModal para crear/editar usuarios
- ✅ Sistema de roles implementado
- ✅ Patrón de asignación masiva en CustomersPage (referencia)
- ❌ NO EXISTE: Visualización de jerarquía OWNER-SALES
- ❌ NO EXISTE: UI para transferencia de usuarios
- ❌ NO EXISTE: Filtros avanzados en UsersPage
- ❌ NO EXISTE: Búsqueda en UsersPage
---
🎯 Plan de Implementación Detallado
FASE 1: Actualización del Modelo de Datos y Tipos 
Prioridad: 🔴 CRÍTICA  
Estimación: 30 min  
Archivos a modificar: 1
1.1 Actualizar Interface User
Archivo: src/interfases/user.interfase.ts
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;      // ⭐ NUEVO: Referencia al OWNER que gestiona este usuario
  createdBy?: string;    // ⭐ NUEVO: ID del usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Consideraciones:
- Ambos campos son opcionales en TypeScript (backend los maneja automáticamente)
- ownerId solo se usa en usuarios con rol SALES
- createdBy se registra automáticamente en backend
---
FASE 2: Actualización de UserModal - Creación con ownerId
Prioridad: 🔴 CRÍTICA  
Estimación: 1.5 horas  
Archivos a modificar: 1
2.1 Modificar UserModal.tsx
Archivo: src/pages/admin/components/users/UserModal.tsx
Cambios necesarios:
1. Agregar selector de OWNER (solo para ADMIN creando SALES)
      // Nuevo estado
   const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
   const [ownersList, setOwnersList] = useState<User[]>([]);
   
   // Cargar lista de OWNERs al abrir modal
   useEffect(() => {
     if (open && !isOwner && !isEditMode) {
       loadOwners();
     }
   }, [open]);
   
   const loadOwners = async () => {
     const owners = await get<User[]>("/users?role=OWNER");
     setOwnersList(owners);
   };
   
2. Agregar campo condicional en el formulario
      {/* Mostrar solo si es ADMIN creando SALES */}
   {!isOwner && roles.includes(Role.SALES) && (
     <FormControl fullWidth margin="normal">
       <InputLabel>OWNER Responsable</InputLabel>
       <Select
         value={selectedOwnerId}
         onChange={(e) => setSelectedOwnerId(e.target.value)}
         required
       >
         {ownersList.map((owner) => (
           <MenuItem key={owner._id} value={owner._id}>
             {owner.name || owner.username} - {owner.factoryId}
           </MenuItem>
         ))}
       </Select>
       <FormHelperText>
         Selecciona el OWNER que gestionará este vendedor
       </FormHelperText>
     </FormControl>
   )}
   
3. Modificar envío de datos
      const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     const submissionData: any = {
       ...formData,
       roles,
     };
   
     if (password) {
       submissionData.password = password;
     }
   
     // Si es ADMIN creando SALES, incluir ownerId
     if (!isOwner && roles.includes(Role.SALES) && selectedOwnerId) {
       submissionData.ownerId = selectedOwnerId;
     }
   
     // Si es OWNER, se auto-asigna en backend
     if (autoFactoryId) {
       submissionData.factoryId = autoFactoryId;
     }
   
     await onSubmit(submissionData);
     onClose();
   };
   
4. Agregar validación visual
      {!isOwner && (
     <Alert severity="info" sx={{ mt: 1 }}>
       {roles.includes(Role.SALES) 
         ? "Debes asignar un OWNER responsable para usuarios SALES"
         : "Los usuarios USER no requieren asignación de OWNER"
       }
     </Alert>
   )}
   
   {isOwner && roles.includes(Role.SALES) && (
     <Alert severity="success" sx={{ mt: 1 }}>
       Este usuario SALES será gestionado automáticamente por tu cuenta
     </Alert>
   )}
   
Validaciones:
- ✅ Deshabilitar botón "Guardar" si es ADMIN creando SALES sin ownerId
- ✅ Mostrar mensaje de ayuda según el contexto
- ✅ Ocultar selector de OWNER si el creador es OWNER (auto-asignado)
---
FASE 3: Mejora de UsersPage - Visualización de Jerarquía
Prioridad: 🟠 ALTA  
Estimación: 2 horas  
Archivos a modificar: 1
3.1 Agregar columnas de jerarquía en DataGrid
Archivo: src/pages/admin/UsersPage.tsx
Nuevas columnas:
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
          <Chip 
            key={role} 
            label={role} 
            size="small" 
            variant="outlined" 
            color={
              role === "ADMIN" ? "primary" : 
              role === "OWNER" ? "secondary" : 
              role === "SALES" ? "success" : 
              "default"
            } 
          />
        ))}
      </Box>
    ),
  },
  
  // ⭐ NUEVA COLUMNA: Owner Manager
  {
    field: "ownerId",
    headerName: "Gestionado por",
    width: 180,
    renderCell: (params) => {
      if (!params.value) return <Chip label="N/A" size="small" variant="outlined" />;
      
      // Buscar el owner en la lista de usuarios
      const owner = users.find(u => u._id === params.value);
      
      return (
        <Chip 
          label={owner?.name || owner?.username || params.value.slice(0, 8)}
          size="small" 
          variant="filled"
          color="secondary"
          icon={<PersonIcon />}
        />
      );
    },
  },
  
  // ⭐ NUEVA COLUMNA: Created By
  {
    field: "createdBy",
    headerName: "Creado por",
    width: 150,
    renderCell: (params) => {
      if (!params.value) return "-";
      const creator = users.find(u => u._id === params.value);
      return (
        <Tooltip title={creator?.email || ""}>
          <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
            {creator?.name || creator?.username || params.value.slice(0, 8)}
          </Typography>
        </Tooltip>
      );
    },
  },
  
  {
    field: "factoryId",
    headerName: "Factory ID",
    width: 180,
    renderCell: (params) => (
      <Chip 
        label={params.value || "-"} 
        size="small" 
        variant="outlined" 
        color={params.value ? "info" : "default"} 
      />
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
      <GridActionsCellItem 
        icon={<EditIcon />} 
        label="Editar" 
        onClick={() => handleOpen(params.row)} 
      />,
      <GridActionsCellItem 
        icon={<DeleteIcon />} 
        label="Eliminar" 
        onClick={() => handleDelete(params.id as string)} 
      />,
    ],
  },
];
Imports necesarios:
import PersonIcon from "@mui/icons-material/Person";
import Tooltip from "@mui/material/Tooltip";
---
FASE 4: Sistema de Filtros Avanzados en UsersPage
Prioridad: 🟠 ALTA  
Estimación: 2.5 horas  
Archivos a crear: 1  
Archivos a modificar: 1
4.1 Crear componente UserFilters
Archivo nuevo: src/pages/admin/components/users/UserFilters.tsx
import React from "react";
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  Chip,
  InputAdornment 
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { Role } from "@/interfases/user.interfase";
import type { User } from "@/interfases/user.interfase";
export interface UserFiltersState {
  search: string;
  roleFilter: string;
  ownerFilter: string;
  showManagedOnly: boolean;
}
interface UserFiltersProps {
  filters: UserFiltersState;
  onFiltersChange: (filters: UserFiltersState) => void;
  owners: User[];
  isOwner: boolean;
}
const UserFilters: React.
Perfecto! Ahora voy a crear el plan de implementación detallado.
📋 Plan de Implementación UI/UX - Sistema de Jerarquía de Usuarios
Basado en el análisis de los documentos API actualizados y la exploración del código existente, he identificado las siguientes necesidades de implementación y actualización en el frontend.
---
🎯 RESUMEN EJECUTIVO
Estado Actual
- ✅ Implementado: CRUD básico de usuarios, roles, autenticación JWT, factory scoping
- ❌ Falta: Sistema de jerarquía OWNER-SALES, transferencias, filtros avanzados, visualización de relaciones
Nuevas Funcionalidades API Detectadas
1. Campos nuevos: ownerId, createdBy 
2. Endpoints nuevos: 
   - GET /users/managed - Usuarios gestionados por OWNER
   - POST /users/:id/transfer-owner - Transferencia individual
   - POST /users/batch-transfer - Transferencia masiva
3. Lógica de negocio: Reglas de asignación automática según rol del creador
---
📊 FASE 1: Actualización del Modelo de Datos Frontend
1.1 Actualizar Interface User
Archivo: src/interfases/user.interfase.ts
Cambios necesarios:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  
  // ⚡ NUEVOS CAMPOS
  ownerId?: string;           // ID del OWNER que gestiona este usuario
  createdBy?: string;         // ID del usuario que creó este registro
  
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Justificación: 
- ownerId es fundamental para la jerarquía OWNER → SALES
- createdBy permite auditoría y trazabilidad
- Ambos campos son opcionales porque solo aplican a usuarios SALES
---
🔧 FASE 2: Servicios API - Nuevos Endpoints
2.1 Crear user.service.ts
Archivo nuevo: src/services/user.service.ts
Funcionalidades:
// Obtener usuarios gestionados por el OWNER actual
export const getManagedUsers = async (): Promise<User[]>
// Transferencia individual
export const transferUserOwnership = async (
  userId: string, 
  newOwnerId: string
): Promise<User>
// Transferencia masiva
export const batchTransferUsers = async (
  userIds: string[], 
  newOwnerId: string
): Promise<{ transferred: number; failed: string[] }>
// Obtener usuarios con rol OWNER (para selector de transferencia)
export const getOwnerUsers = async (): Promise<User[]>
Patrón: Seguir el mismo estilo que customer.service.ts (ya existente en el proyecto)
---
🎨 FASE 3: Componentes UI - Creación y Actualización
3.1 Actualizar UserModal.tsx ⚙️ MODIFICAR EXISTENTE
Archivo: src/pages/admin/components/users/UserModal.tsx
Cambios necesarios:
A) Añadir campo ownerId para ADMIN creando SALES
// Mostrar selector de OWNER solo si:
// - Usuario actual es ADMIN
// - Está creando un nuevo usuario SALES
// - O está editando un usuario SALES existente
{isAdmin && roles.includes(Role.SALES) && (
  <FormControl fullWidth margin="normal" required={!isEditMode}>
    <InputLabel>OWNER Responsable</InputLabel>
    <Select
      value={formData.ownerId || ''}
      onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
    >
      {ownerUsers.map(owner => (
        <MenuItem key={owner._id} value={owner._id}>
          {owner.name || owner.username} - {owner.factoryId}
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      Selecciona el OWNER que gestionará este usuario SALES
    </FormHelperText>
  </FormControl>
)}
B) Mostrar información del creador (modo edición)
{isEditMode && formData.createdBy && (
  <Alert severity="info" icon={<PersonIcon />}>
    Creado por: {creatorInfo?.name || 'Sistema'}
  </Alert>
)}
C) Lógica de validación
- Si el usuario actual es ADMIN y crea un SALES → ownerId es requerido
- Si el usuario actual es OWNER → ownerId se auto-asigna (no mostrar campo)
- Para roles USER, WORKER → ownerId no aplica (ignorar)
Estado necesario:
const [ownerUsers, setOwnerUsers] = useState<User[]>([]);
const [creatorInfo, setCreatorInfo] = useState<User | null>(null);
useEffect(() => {
  // Cargar lista de OWNERs si es ADMIN
  if (isAdmin) {
    getOwnerUsers().then(setOwnerUsers);
  }
  
  // Cargar info del creador si estamos en modo edición
  if (isEditMode && formData.createdBy) {
    getUserById(formData.createdBy).then(setCreatorInfo);
  }
}, [isAdmin, isEditMode, formData.createdBy]);
---
3.2 Actualizar UsersPage.tsx 🔄 MODIFICAR EXISTENTE
Archivo: src/pages/admin/UsersPage.tsx
A) Añadir columnas a DataGrid
const columns: GridColDef<User>[] = [
  { field: "username", headerName: "Usuario", width: 150 },
  { field: "name", headerName: "Nombre", width: 200 },
  { field: "email", headerName: "Email", width: 200 },
  
  // ⚡ NUEVA COLUMNA: Owner Manager
  {
    field: "ownerId",
    headerName: "Gestionado por",
    width: 180,
    renderCell: (params) => {
      const owner = ownerUsersMap.get(params.value);
      return params.value ? (
        <Chip 
          label={owner?.name || 'OWNER'} 
          size="small" 
          color="secondary"
          icon={<SupervisorAccountIcon />}
        />
      ) : <span>-</span>;
    }
  },
  
  // ⚡ NUEVA COLUMNA: Creado por
  {
    field: "createdBy",
    headerName: "Creado por",
    width: 150,
    renderCell: (params) => {
      const creator = usersMap.get(params.value);
      return creator?.name || creator?.username || '-';
    }
  },
  
  { field: "roles", ... }, // existente
  { field: "factoryId", ... }, // existente
  { field: "createdAt", ... }, // existente
  { field: "actions", ... }, // existente
];
B) Añadir filtros avanzados
// Estados de filtrado
const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
const [ownerFilter, setOwnerFilter] = useState<string | 'ALL'>('ALL');
const [searchTerm, setSearchTerm] = useState('');
const [showManagedOnly, setShowManagedOnly] = useState(false);
// UI de filtros (antes del DataGrid)
<Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
  <TextField
    placeholder="Buscar por nombre, username, email..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    InputProps={{
      startAdornment: <SearchIcon />
    }}
    sx={{ minWidth: 300 }}
  />
  
  <FormControl sx={{ minWidth: 150 }}>
    <InputLabel>Rol</InputLabel>
    <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
      <MenuItem value="ALL">Todos</MenuItem>
      {Object.values(Role).map(role => (
        <MenuItem key={role} value={role}>{role}</MenuItem>
      ))}
    </Select>
  </FormControl>
  
  {isOwner && (
    <FormControlLabel
      control={
        <Switch 
          checked={showManagedOnly} 
          onChange={(e) => setShowManagedOnly(e.target.checked)}
        />
      }
      label="Solo mis usuarios SALES"
    />
  )}
  
  {isAdmin && (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>Filtrar por OWNER</InputLabel>
      <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
        <MenuItem value="ALL">Todos los OWNERs</MenuItem>
        {ownerUsers.map(owner => (
          <MenuItem key={owner._id} value={owner._id}>
            {owner.name || owner.username}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )}
</Box>
C) Lógica de filtrado
const filteredUsers = useMemo(() => {
  return users.filter(user => {
    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = 
        user.username.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term);
      if (!matches) return false;
    }
    
    // Filtro por rol
    if (roleFilter !== 'ALL' && !user.roles.includes(roleFilter)) {
      return false;
    }
    
    // Filtro por owner (solo ADMIN)
    if (ownerFilter !== 'ALL' && user.ownerId !== ownerFilter) {
      return false;
    }
    
    // Filtro "mis gestionados" (solo OWNER)
    if (showManagedOnly && user.ownerId !== currentUser?.id) {
      return false;
    }
    
    return true;
  });
}, [users, searchTerm, roleFilter, ownerFilter, showManagedOnly]);
D) Acciones de selección múltiple (solo ADMIN)
// Estado de selección
const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
// Toolbar personalizado cuando hay selección
{isAdmin && selectedUserIds.size > 0 && (
  <Paper sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant="body1">
        {selectedUserIds.size} usuarios seleccionados
      </Typography>
      <Button
        variant="contained"
        startIcon={<SwapHorizIcon />}
        onClick={() => setTransferDialogOpen(true)}
        disabled={!areAllSelectedSales()}
      >
        Transferir a otro OWNER
      </Button>
      <Button
        variant="text"
        onClick={() => setSelectedUserIds(new Set())}
      >
        Cancelar selección
      </Button>
    </Box>
  </Paper>
)}
// DataGrid con selección
<DataGrid
  checkboxSelection={isAdmin}
  onRowSelectionModelChange={(newSelection) => {
    setSelectedUserIds(new Set(newSelection as string[]));
  }}
  rowSelectionModel={Array.from(selectedUserIds)}
  ...
/>
---
3.3 Crear TransferOwnerDialog.tsx ✨ NUEVO COMPONENTE
Archivo nuevo: src/pages/admin/components/users/TransferOwnerDialog.tsx
Propósito: Dialog para transferir usuarios SALES a otro OWNER (individual o masivo)
Props:
interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];           // IDs de usuarios a transferir
  users: User[];               // Datos completos para mostrar
  onConfirm: (newOwnerId: string) => Promise<void>;
}
UI:
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>
    Transferir usuarios a otro OWNER
  </DialogTitle>
  
  <DialogContent>
    <Alert severity="warning" sx={{ mb: 2 }}>
      Vas a transferir {userIds.length} usuario(s) SALES a un nuevo OWNER.
      Esta acción actualizará el campo <code>ownerId</code> pero mantendrá
      el registro de quién los creó originalmente.
    </Alert>
    
    {/* Lista de usuarios a transferir */}
    <Typography variant="subtitle2" gutterBottom>
      Usuarios a transferir:
    </Typography>
    <Paper variant="outlined" sx={{ p: 1, mb: 2, maxHeight: 200, overflow: 'auto' }}>
      {users.map(user => (
        <Chip 
          key={user._id} 
          label={`${user.name || user.username} (${user.roles.join(', ')})`}
          size="small"
          sx={{ m: 0.5 }}
        />
      ))}
    </Paper>
    
    {/* Selector de nuevo OWNER */}
    <FormControl fullWidth required>
      <InputLabel>Nuevo OWNER responsable</InputLabel>
      <Select
        value={newOwnerId}
        onChange={(e) => setNewOwnerId(e.target.value)}
      >
        {ownerUsers.map(owner => (
          <MenuItem key={owner._id} value={owner._id}>
            <Box>
              <Typography variant="body1">
                {owner.name || owner.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Factory: {owner.factoryId} • {owner.email}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </DialogContent>
  
  <DialogActions>
    <Button onClick={onClose}>Cancelar</Button>
    <Button 
      onClick={handleConfirm} 
      variant="contained"
      disabled={!newOwnerId || loading}
    >
      {loading ? <CircularProgress size={20} /> : 'Transferir'}
    </Button>
  </DialogActions>
</Dialog>
Lógica de confirmación:
const handleConfirm = async () => {
  setLoading(true);
  try {
    if (userIds.length === 1) {
      // Transferencia individual
      await transferUserOwnership(userIds[0], newOwnerId);
      showSnackbar('Usuario transferido exitosamente', 'success');
    } else {
      // Transferencia masiva
      const result = await batchTransferUsers(userIds, newOwnerId);
      showSnackbar(
        `${result.transferred} usuarios transferidos. ${result.failed.length} fallidos.`,
        result.failed.length > 0 ? 'warning' : 'success'
      );
    }
    onConfirm(newOwnerId);
    onClose();
  } catch (error) {
    showSnackbar('Error al transferir usuarios', 'error');
  } finally {
    setLoading(false);
  }
};
---
3.4 Crear UserHierarchyView.tsx ✨ NUEVO COMPONENTE (Opcional - Mejora UX)
Archivo nuevo: src/pages/admin/components/users/UserHierarchyView.tsx
Propósito: Vista visual de la jerarquía ADMIN → OWNER → SALES
Tecnología sugerida: 
- react-organizational-chart (librería NPM)
- O implementación custom con CSS Grid/Flexbox
Vista propuesta:
┌─────────────────┐
│  ADMIN Users    │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
┌───▼───┐ ┌──▼───┐ ┌───▼───┐ ┌───▼───┐
│OWNER 1│ │OWNER2│ │OWNER 3│ │USER(s)│
│Factory│ │Facto │ │Factory│ │       │
│  A    │ │ry B  │ │  C    │ │       │
└───┬───┘ └──┬───┘ └───┬───┘ └───────┘
    │        │         │
┌───┴─┐   ┌──┴──┐   ┌──┴──┐
│SALES│   │SALES│   │SALES│
│  1  │   │  3  │   │  5  │
└─────┘   └─────┘   └─────┘
┌─────┐   ┌─────┐
│SALES│   │SALES│
│  2  │   │  4  │
└─────┘   └─────┘
UI Features:
- Click en nodo para ver detalles
- Botón "Transferir" en nodos SALES (solo ADMIN)
- Color coding por rol
- Tooltips con información completa
Integración: Añadir pestaña en UsersPage
<Tabs value={viewMode} onChange={(e, v) => setViewMode(v)}>
  <Tab label="Vista de Tabla" value="table" />
  <Tab label="Vista de Jerarquía" value="hierarchy" />
</Tabs>
---
🎨 FASE 4: Mejoras Visuales y UX
4.1 Indicadores Visuales en UserModal
Objetivo: Hacer obvio quién creó el usuario y quién lo gestiona
{isEditMode && (
  <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon fontSize="small" color="action" />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Creado por
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {creatorInfo?.name || 'Sistema'}
            </Typography>
          </Box>
        </Box>
      </Grid>
      
      {formData.ownerId && (
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SupervisorAccountIcon fontSize="small" color="secondary" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Gestionado por
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {ownerInfo?.name || 'OWNER'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      )}
    </Grid>
  </Paper>
)}
4.2 Chips con Tooltips en DataGrid
{
  field: "ownerId",
  headerName: "Gestionado por",
  width: 180,
  renderCell: (params) => {
    const owner = ownerUsersMap.get(params.value);
    if (!owner) return <span>-</span>;
    
    return (
      <Tooltip title={
        <Box>
          <Typography variant="caption">OWNER: {owner.name}</Typography>
          <Typography variant="caption" display="block">
            Email: {owner.email}
          </Typography>
          <Typography variant="caption" display="block">
            Factory: {owner.factoryId}
          </Typography>
        </Box>
      }>
        <Chip 
          label={owner.
Perfecto! Ahora voy a crear un plan detallado completo. Primero, déjame revisar la estructura de carpetas para asegurarme de ubicar bien los nuevos componentes:
# List admin components directory structure
$ ls -la src/pages/admin/components/
total 9
drwxr-xr-x 1 dmnvl 197609   0 Feb 24 18:20 .
drwxr-xr-x 1 dmnvl 197609   0 Apr  7 11:09 ..
-rw-r--r-- 1 dmnvl 197609 595 Feb 19 14:58 AdminPageTitle.tsx
drwxr-xr-x 1 dmnvl 197609   0 Feb 24 18:23 dashboard
drwxr-xr-x 1 dmnvl 197609   0 Feb 19 15:36 users
# List users components directory
$ ls -la src/pages/admin/components/users/
total 8
drwxr-xr-x 1 dmnvl 197609    0 Feb 19 15:36 .
drwxr-xr-x 1 dmnvl 197609    0 Feb 24 18:20 ..
-rw-r--r-- 1 dmnvl 197609 5554 Apr  8 17:47 UserModal.tsx
Excelente! Ahora voy a crear el plan de implementación detallado:
📋 Plan de Implementación: Sistema de Jerarquía OWNER-SALES y Mejoras UI/UX
📊 Resumen Ejecutivo
Basado en la documentación actualizada de la API (users-api.md y sistema-de-jerarquias-usuarios.md), se requiere implementar en el frontend:
Funcionalidades Nuevas a Implementar:
1. ✅ Sistema de Jerarquía OWNER-SALES (campos ownerId y createdBy)
2. ✅ Transferencia de Usuarios (individual y masiva entre OWNERs)
3. ✅ Filtros y Búsqueda Avanzada (por rol, owner, texto libre)
4. ✅ Mejoras Visuales y UX (indicadores de jerarquía, tooltips, mejor feedback)
Estado Actual del Frontend:
- ✅ CRUD básico de usuarios funcionando (UsersPage.tsx, UserModal.tsx)
- ✅ Sistema de roles implementado (5 roles: ADMIN, OWNER, SALES, USER, WORKER)
- ✅ Autenticación y autorización con JWT
- ✅ Patrón de código establecido en CustomersPage.tsx (selección múltiple, batch operations)
- ❌ FALTA: Campos ownerId y createdBy en interfaz y formularios
- ❌ FALTA: UI para transferencia de usuarios
- ❌ FALTA: Filtros y búsqueda en UsersPage
- ❌ FALTA: Indicadores visuales de jerarquía
---
🎯 FASE 1: Actualización de Tipos e Interfaces
Ubicación: src/interfases/user.interfase.ts
Cambios Necesarios:
1.1 Actualizar interfaz User
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;      // ⭐ NUEVO: Referencia al OWNER que gestiona este usuario
  createdBy?: string;    // ⭐ NUEVO: Usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string;
}
1.2 Crear DTOs para transferencias
Archivo nuevo: src/interfases/user-transfer.interfase.ts
export interface TransferOwnerDto {
  newOwnerId: string;
}
export interface BatchTransferDto {
  userIds: string[];
  newOwnerId: string;
}
export interface BatchTransferResult {
  transferred: number;
  failed: string[];
}
Entregables:
- [ ] Archivo modificado: user.interfase.ts
- [ ] Archivo nuevo: user-transfer.interfase.ts
---
🔧 FASE 2: Servicios y API Integration
Ubicación: Nuevo archivo src/services/user.service.ts
Motivación:
Actualmente las llamadas API están inline en UsersPage.tsx. Para mantener separación de responsabilidades y facilitar reutilización, crear servicio dedicado.
Implementación:
// src/services/user.service.ts
import { get, create, update, remove, post } from './api.service';
import type { User } from '@/interfases/user.interfase';
import type { TransferOwnerDto, BatchTransferDto, BatchTransferResult } from '@/interfases/user-transfer.interfase';
export class UserService {
  private static readonly BASE_PATH = '/users';
  // ===== CRUD Básico =====
  static async getAll(params?: { role?: string; managed?: boolean }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.managed) queryParams.append('managed', 'true');
    
    const url = queryParams.toString() 
      ? `${this.BASE_PATH}?${queryParams.toString()}`
      : this.BASE_PATH;
    
    return get<User[]>(url);
  }
  static async getById(id: string): Promise<User> {
    return get<User>(`${this.BASE_PATH}/${id}`);
  }
  static async createUser(data: Partial<User>): Promise<User> {
    return create<User>(this.BASE_PATH, data);
  }
  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return update<User>(this.BASE_PATH, id, data);
  }
  static async deleteUser(id: string): Promise<void> {
    return remove(this.BASE_PATH, [id]);
  }
  // ===== Jerarquía OWNER-SALES =====
  static async getManagedUsers(): Promise<User[]> {
    return get<User[]>(`${this.BASE_PATH}/managed`);
  }
  // ===== Transferencias =====
  static async transferOwner(userId: string, dto: TransferOwnerDto): Promise<User> {
    return post<User>(`${this.BASE_PATH}/${userId}/transfer-owner`, dto);
  }
  static async batchTransferOwners(dto: BatchTransferDto): Promise<BatchTransferResult> {
    return post<BatchTransferResult>(`${this.BASE_PATH}/batch-transfer`, dto);
  }
  // ===== Helpers para UI =====
  static async getOwners(): Promise<User[]> {
    return this.getAll({ role: 'OWNER' });
  }
  static async getSalesUsers(): Promise<User[]> {
    return this.getAll({ role: 'SALES' });
  }
}
Entregables:
- [ ] Archivo nuevo: src/services/user.service.ts
- [ ] Refactor: Migrar UsersPage.tsx para usar UserService
---
🎨 FASE 3: Componentes UI - Sistema de Jerarquía
3.1 Actualizar UserModal.tsx
Ubicación: src/pages/admin/components/users/UserModal.tsx
Cambios Necesarios:
A) Agregar selector de Owner (solo visible para ADMIN creando SALES)
// Dentro del componente
const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
const [owners, setOwners] = useState<User[]>([]);
useEffect(() => {
  const loadOwners = async () => {
    if (currentUser?.roles.includes("ADMIN")) {
      const ownersList = await UserService.getOwners();
      setOwners(ownersList);
    }
  };
  loadOwners();
}, [currentUser]);
// Renderizado condicional
{isAdmin && roles.includes(Role.SALES) && !isEditMode && (
  <FormControl fullWidth margin="normal" required>
    <InputLabel id="owner-label">Owner Asignado</InputLabel>
    <Select
      labelId="owner-label"
      value={selectedOwnerId}
      onChange={(e) => setSelectedOwnerId(e.target.value)}
      label="Owner Asignado"
    >
      {owners.map((owner) => (
        <MenuItem key={owner._id} value={owner._id}>
          {owner.name || owner.username} ({owner.factoryId})
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      Requerido para usuarios con rol SALES
    </FormHelperText>
  </FormControl>
)}
B) Actualizar lógica de submit
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const submissionData: any = {
    ...formData,
    roles,
  };
  if (password) {
    submissionData.password = password;
  }
  // Auto-asignar factoryId si es OWNER
  if (autoFactoryId) {
    submissionData.factoryId = autoFactoryId;
  }
  // ⭐ NUEVO: Asignar ownerId si es ADMIN creando SALES
  if (isAdmin && roles.includes(Role.SALES) && selectedOwnerId && !isEditMode) {
    submissionData.ownerId = selectedOwnerId;
  }
  await onSubmit(submissionData);
  onClose();
};
Entregables:
- [ ] Archivo modificado: UserModal.tsx con selector de Owner
---
3.2 Crear Componente de Jerarquía Visual
Archivo nuevo: src/pages/admin/components/users/UserHierarchyChip.tsx
Propósito: Mostrar visualmente la relación OWNER → SALES
import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import type { User } from '@/interfases/user.interfase';
interface UserHierarchyChipProps {
  user: User;
  ownerData?: User; // Datos del owner si existe
}
const UserHierarchyChip: React.FC<UserHierarchyChipProps> = ({ user, ownerData }) => {
  if (!user.ownerId) return null;
  return (
    <Tooltip 
      title={`Gestionado por: ${ownerData?.name || ownerData?.username || user.ownerId}`}
      arrow
    >
      <Chip
        icon={<AccountTreeIcon />}
        label={ownerData?.name?.split(' ')[0] || 'OWNER'}
        size="small"
        color="secondary"
        variant="outlined"
        sx={{ fontSize: '0.75rem' }}
      />
    </Tooltip>
  );
};
export default UserHierarchyChip;
Entregables:
- [ ] Archivo nuevo: UserHierarchyChip.tsx
---
🔍 FASE 4: Filtros y Búsqueda Avanzada en UsersPage
4.1 Crear Componente de Filtros
Archivo nuevo: src/pages/admin/components/users/UserFilters.tsx
Inspirado en: CustomersPage.tsx (líneas 93-111)
import React from 'react';
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, InputAdornment, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Role } from '@/interfases/user.interfase';
interface UserFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  owners: Array<{ _id: string; name?: string; username: string }>;
  showOwnerFilter: boolean; // Solo para ADMIN
}
const UserFilters: React.FC<UserFiltersProps> = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  owners,
  showOwnerFilter,
}) => {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
      {/* Búsqueda por texto */}
      <TextField
        placeholder="Buscar por nombre, email o username..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: 1, minWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      {/* Filtro por Rol */}
      <FormControl sx={{ minWidth: 150 }}>
        <InputLabel>Rol</InputLabel>
        <Select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          label="Rol"
        >
          <MenuItem value="ALL">Todos</MenuItem>
          <MenuItem value={Role.ADMIN}>Admin</MenuItem>
          <MenuItem value={Role.OWNER}>Owner</MenuItem>
          <MenuItem value={Role.SALES}>Sales</MenuItem>
          <MenuItem value={Role.USER}>User</MenuItem>
          <MenuItem value={Role.WORKER}>Worker</MenuItem>
        </Select>
      </FormControl>
      {/* Filtro por Owner (solo ADMIN) */}
      {showOwnerFilter && (
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Owner</InputLabel>
          <Select
            value={ownerFilter}
            onChange={(e) => onOwnerFilterChange(e.target.value)}
            label="Owner"
          >
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="NONE">Sin Owner</MenuItem>
            {owners.map((owner) => (
              <MenuItem key={owner._id} value={owner._id}>
                {owner.name || owner.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
};
export default UserFilters;
Entregables:
- [ ] Archivo nuevo: UserFilters.tsx
---
4.2 Actualizar UsersPage.tsx con Filtros
**Cambios principales
Excelente. Ahora tengo toda la información necesaria. Voy a crear el plan de implementación detallado.
📋 Plan de Implementación: Sistema de Jerarquía y Gestión Avanzada de Usuarios
---
📊 Resumen Ejecutivo
Basado en el análisis de los documentos actualizados de API y el estado actual del frontend, se requiere implementar:
1. Sistema de Jerarquía OWNER-SALES: Agregar campos ownerId y createdBy al modelo de usuario
2. Transferencia de Usuarios: UI para transferir SALES entre OWNERs (individual y masiva)
3. Filtros y Búsqueda Avanzada: Mejorar UsersPage con capacidades de filtrado
4. Mejoras Visuales y UX: Indicadores visuales de jerarquía, feedback mejorado
Estado actual del Frontend:
- ✅ CRUD básico de usuarios funcional
- ✅ Control de acceso basado en roles
- ✅ Componente UserModal para crear/editar
- ✅ DataGrid con columnas básicas
- ❌ Sin soporte para ownerId/createdBy
- ❌ Sin funcionalidad de transferencia
- ❌ Sin filtros avanzados o búsqueda
- ❌ Sin indicadores visuales de jerarquía
---
🎯 FASE 1: Actualización del Modelo de Datos Frontend
1.1 Actualizar Interface User
Archivo: src/interfases/user.interfase.ts
Cambios requeridos:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;        // ⭐ NUEVO - Referencia al OWNER que gestiona este usuario
  createdBy?: string;      // ⭐ NUEVO - ID del usuario que creó este usuario
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Razón: El backend ya soporta estos campos según la documentación API actualizada. El frontend debe reflejar esta estructura.
---
🎯 FASE 2: Actualización de UserModal (Creación/Edición)
2.1 Modificar UserModal.tsx
Archivo: src/pages/admin/components/users/UserModal.tsx
Objetivos:
1. Mostrar información de ownerId cuando sea relevante (modo visualización)
2. Para ADMIN: permitir seleccionar OWNER al crear SALES
3. Para OWNER: auto-asignar ownerId (ya hace factoryId, similar)
4. Mostrar createdBy como información de auditoría (solo lectura)
Cambios específicos:
a) Agregar selector de OWNER para ADMIN creando SALES:
// Nuevo estado
const [selectedOwner, setSelectedOwner] = useState<string>("");
const [owners, setOwners] = useState<User[]>([]);
// Cargar lista de OWNERs cuando se abre el modal (solo ADMIN)
useEffect(() => {
  if (open && !isOwner && !isEditMode) {
    loadOwners();
  }
}, [open]);
// Mostrar selector solo cuando:
// - Es ADMIN creando usuario
// - Los roles seleccionados incluyen SALES
{!isOwner && !isEditMode && roles.includes(Role.SALES) && (
  <FormControl fullWidth margin="normal" required>
    <InputLabel>OWNER Asignado</InputLabel>
    <Select
      value={selectedOwner}
      onChange={(e) => setSelectedOwner(e.target.value)}
      label="OWNER Asignado"
    >
      {owners.map(owner => (
        <MenuItem key={owner._id} value={owner._id}>
          {owner.name || owner.username} ({owner.email})
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      Selecciona el OWNER que gestionará este usuario SALES
    </FormHelperText>
  </FormControl>
)}
b) Mostrar información de jerarquía en modo edición:
{isEditMode && user?.ownerId && (
  <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
    Gestionado por: {getOwnerName(user.ownerId)}
  </Alert>
)}
{isEditMode && user?.createdBy && (
  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
    Creado por: {getCreatorName(user.createdBy)}
  </Typography>
)}
Estimación: 3-4 horas
---
🎯 FASE 3: Actualización de UsersPage (Lista Principal)
3.1 Agregar Columnas al DataGrid
Archivo: src/pages/admin/UsersPage.tsx
Nuevas columnas a agregar:
{
  field: "ownerId",
  headerName: "Gestionado Por",
  width: 180,
  renderCell: (params) => {
    if (!params.value) return <Chip label="N/A" size="small" variant="outlined" />;
    
    const owner = users.find(u => u._id === params.value);
    return (
      <Chip 
        label={owner?.name || owner?.username || params.value.slice(0, 8)}
        size="small"
        color="secondary"
        variant="outlined"
        icon={<AccountCircleIcon />}
      />
    );
  }
},
{
  field: "createdBy",
  headerName: "Creado Por",
  width: 150,
  renderCell: (params) => {
    if (!params.value) return "-";
    const creator = users.find(u => u._id === params.value);
    return (
      <Tooltip title={`Creado por: ${creator?.username || 'Usuario eliminado'}`}>
        <Chip 
          label={creator?.username || "N/A"}
          size="small"
          variant="filled"
        />
      </Tooltip>
    );
  }
}
3.2 Agregar Sistema de Filtros
Objetivo: Permitir filtrar usuarios por rol, owner, y búsqueda de texto
Implementación:
// Nuevos estados
const [roleFilter, setRoleFilter] = useState<string>("ALL");
const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
const [searchText, setSearchText] = useState("");
// Barra de filtros (agregar antes del DataGrid)
<Paper sx={{ p: 2, mb: 2 }}>
  <Stack direction="row" spacing={2} alignItems="center">
    <TextField
      placeholder="Buscar por nombre, email, username..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ flexGrow: 1 }}
    />
    
    <FormControl sx={{ minWidth: 150 }}>
      <InputLabel>Filtrar por Rol</InputLabel>
      <Select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        label="Filtrar por Rol"
      >
        <MenuItem value="ALL">Todos</MenuItem>
        <MenuItem value="ADMIN">ADMIN</MenuItem>
        <MenuItem value="OWNER">OWNER</MenuItem>
        <MenuItem value="SALES">SALES</MenuItem>
        <MenuItem value="USER">USER</MenuItem>
        <MenuItem value="WORKER">WORKER</MenuItem>
      </Select>
    </FormControl>
    {isAdmin && (
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Filtrar por OWNER</InputLabel>
        <Select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          label="Filtrar por OWNER"
        >
          <MenuItem value="ALL">Todos</MenuItem>
          <MenuItem value="NONE">Sin OWNER</MenuItem>
          {owners.map(owner => (
            <MenuItem key={owner._id} value={owner._id}>
              {owner.name || owner.username}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )}
    <Chip 
      label={`${filteredUsers.length} usuarios`}
      color="primary"
      variant="outlined"
    />
  </Stack>
</Paper>
// Lógica de filtrado
const filteredUsers = useMemo(() => {
  return users.filter(user => {
    // Filtro de texto
    const searchLower = searchText.toLowerCase();
    const matchesSearch = !searchText || 
      user.username.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower);
    
    // Filtro de rol
    const matchesRole = roleFilter === "ALL" || 
      user.roles.includes(roleFilter as Role);
    
    // Filtro de owner
    const matchesOwner = ownerFilter === "ALL" ||
      (ownerFilter === "NONE" && !user.ownerId) ||
      (user.ownerId === ownerFilter);
    
    return matchesSearch && matchesRole && matchesOwner;
  });
}, [users, searchText, roleFilter, ownerFilter]);
Estimación: 4-5 horas
---
🎯 FASE 4: Funcionalidad de Transferencia de Usuarios
4.1 Crear Componente TransferOwnerDialog
Archivo: src/pages/admin/components/users/TransferOwnerDialog.tsx (NUEVO)
Propósito: Diálogo para transferir uno o múltiples usuarios SALES a un nuevo OWNER
Props Interface:
interface TransferOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (userIds: string[], newOwnerId: string) => Promise<void>;
  selectedUserIds: string[];  // Usuarios a transferir
  currentOwners: User[];      // Lista de OWNERs disponibles
}
Características:
- Mostrar lista de usuarios seleccionados (con validación que sean SALES)
- Selector de OWNER destino (dropdown con búsqueda)
- Confirmación con resumen de cambios
- Manejo de errores y loading state
- Feedback de éxito/error
Estructura visual:
┌─────────────────────────────────────────┐
│ Transferir Usuarios SALES               │
├─────────────────────────────────────────┤
│ Usuarios a transferir:                  │
│ • Juan Pérez (juan.sales)
Excelente. Ahora tengo toda la información necesaria. Voy a crear el plan de implementación detallado.
📋 PLAN DE IMPLEMENTACIÓN - Sistema de Jerarquía de Usuarios y Mejoras UI/UX
🎯 Resumen Ejecutivo
Basado en el análisis de la documentación actualizada de API (users-api.md y sistema-de-jerarquias-usuarios.md) y el estado actual del frontend, este plan cubre la implementación de:
1. Sistema de jerarquía OWNER-SALES con campos ownerId y createdBy
2. Transferencia de usuarios (individual y masiva) entre OWNERs
3. Filtros y búsqueda avanzada en la gestión de usuarios
4. Mejoras visuales y UX para indicadores de jerarquía
---
📊 Estado Actual vs Requerido
✅ Lo que YA existe en el Frontend:
- ✓ UsersPage.tsx con DataGrid y CRUD básico
- ✓ UserModal.tsx para crear/editar usuarios
- ✓ Sistema de roles y permisos funcional
- ✓ Campo factoryId en interfaz User
- ✓ Auto-asignación de factoryId para OWNERs
- ✓ Integración con API /users (GET, POST, PATCH, DELETE)
❌ Lo que FALTA implementar:
- ❌ Campos ownerId y createdBy en interfaz User
- ❌ Lógica para asignación automática de ownerId cuando OWNER crea SALES
- ❌ Campo ownerId en UserModal para ADMINs creando SALES
- ❌ Endpoint /users/managed para OWNERs
- ❌ Transferencia individual /users/:id/transfer-owner
- ❌ Transferencia masiva /users/batch-transfer
- ❌ Filtros avanzados (por rol, por owner, búsqueda)
- ❌ Indicadores visuales de jerarquía
- ❌ Diálogo de transferencia de usuarios
---
🗂️ Estructura de Archivos a Crear/Modificar
📝 Modificar (4 archivos):
1. src/interfases/user.interfase.ts - Añadir campos ownerId, createdBy
2. src/pages/admin/UsersPage.tsx - Filtros, búsqueda, selección masiva
3. src/pages/admin/components/users/UserModal.tsx - Campo ownerId para ADMIN
4. src/services/api.service.ts - (Opcional) Helper para batch operations
🆕 Crear (6 archivos):
5. src/pages/admin/components/users/UserFilters.tsx - Componente de filtros
6. src/pages/admin/components/users/TransferDialog.tsx - Diálogo de transferencia
7. src/pages/admin/components/users/BatchActionsToolbar.tsx - Barra de acciones masivas
8. src/pages/admin/components/users/UserHierarchyIndicator.tsx - Indicador visual de jerarquía
9. src/services/user.service.ts - Servicio dedicado para operaciones de usuarios
10. src/types/user-transfer.types.ts - Tipos para transferencias
---
📐 FASE 1: Actualización de Interfaces y Tipos
1.1 Actualizar user.interfase.ts
Ubicación: src/interfases/user.interfase.ts
Cambios:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;        // 🆕 NUEVO: Referencia al OWNER que gestiona este usuario
  createdBy?: string;      // 🆕 NUEVO: ID del usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Detalles técnicos:
- ownerId: Opcional, solo se usa para usuarios con rol SALES
- createdBy: Opcional en la interfaz (se asigna automáticamente en backend)
- Mantener compatibilidad con usuarios existentes que no tengan estos campos
---
1.2 Crear tipos para transferencias
Nuevo archivo: src/types/user-transfer.types.ts
Contenido:
export interface TransferOwnerDto {
  newOwnerId: string;
}
export interface BatchTransferDto {
  userIds: string[];
  newOwnerId: string;
}
export interface BatchTransferResponse {
  transferred: number;
  failed: string[];
}
---
🔧 FASE 2: Servicio de Usuarios
2.1 Crear user.service.ts
Nuevo archivo: src/services/user.service.ts
Funcionalidades a implementar:
// Obtener usuarios gestionados por el OWNER actual
export async function getManagedUsers(): Promise<User[]>
// Obtener todos los usuarios con filtros opcionales
export async function getUsers(filters?: {
  role?: Role;
  managed?: boolean;
  search?: string;
}): Promise<User[]>
// Obtener usuarios con rol OWNER (para selección en transferencias)
export async function getOwnerUsers(): Promise<User[]>
// Transferencia individual
export async function transferOwnership(
  userId: string,
  newOwnerId: string
): Promise<User>
// Transferencia masiva
export async function batchTransferOwnership(
  userIds: string[],
  newOwnerId: string
): Promise<BatchTransferResponse>
// Crear usuario (con lógica de ownerId)
export async function createUser(data: Partial<User>): Promise<User>
// Actualizar usuario
export async function updateUser(
  id: string,
  data: Partial<User>
): Promise<User>
// Eliminar usuario
export async function deleteUser(id: string): Promise<void>
Detalles técnicos:
- Usar api.service.ts como base para las llamadas HTTP
- Implementar manejo de errores específico por operación
- Incluir validaciones client-side antes de enviar al backend
- Cache opcional para lista de OWNERs (se usa frecuentemente)
Integración con API:
- GET /users → Con query params ?role=SALES&managed=true
- GET /users/managed → Endpoint específico para OWNER
- POST /users/:id/transfer-owner → Con body { newOwnerId }
- POST /users/batch-transfer → Con body { userIds[], newOwnerId }
---
🎨 FASE 3: Componentes UI Nuevos
3.1 UserFilters.tsx - Filtros de búsqueda
Nuevo archivo: src/pages/admin/components/users/UserFilters.tsx
Propósito: Componente reutilizable para filtrar usuarios
Props:
interface UserFiltersProps {
  onFilterChange: (filters: UserFilterState) => void;
  currentUser: User;
  showManagedFilter?: boolean; // Solo para OWNERs
}
interface UserFilterState {
  search: string;
  role: Role | 'ALL';
  managed: boolean; // Solo mis SALES (para OWNER)
}
UI Elements:
- TextField con SearchIcon para búsqueda por nombre/username/email
- Select para filtrar por rol (ALL, ADMIN, OWNER, SALES, USER, WORKER)
- Checkbox "Solo mis usuarios gestionados" (visible solo para OWNER)
- Botón "Limpiar filtros"
Diseño: Inspirado en CustomersPage.tsx (línea 47-49)
---
3.2 UserHierarchyIndicator.tsx - Indicador visual
Nuevo archivo: src/pages/admin/components/users/UserHierarchyIndicator.tsx
Propósito: Mostrar relación jerárquica en el DataGrid
Props:
interface UserHierarchyIndicatorProps {
  user: User;
  ownerData?: User; // Datos del OWNER (si aplica)
  creatorData?: User; // Datos del creador
}
UI Elements:
- Tooltip con información de jerarquía al hacer hover
- Icono de cadena/link si tiene ownerId
- Chip pequeño con nombre del OWNER
- Indicador de "Creado por: X"
Ejemplo visual:
[SALES] Juan Pérez
  └─ 🔗 Gestionado por: María García (OWNER)
  └─ 👤 Creado por: Admin Principal
---
3.3 TransferDialog.tsx - Diálogo de transferencia
Nuevo archivo: src/pages/admin/components/users/TransferDialog.tsx
Propósito: Transferir usuarios SALES entre OWNERs
Props:
interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newOwnerId: string) => Promise<void>;
  users: User[]; // Usuario(s) a transferir
  owners: User[]; // Lista de OWNERs disponibles
  isBatch: boolean; // true si es transferencia masiva
}
UI Elements:
- DialogTitle: "Transferir N usuario(s)" o "Transferir usuario"
- Lista de usuarios a transferir (solo lectura)
- Autocomplete/Select para elegir nuevo OWNER
  - Mostrar: name, username, factoryId
  - Filtrar: solo usuarios con rol OWNER
- Advertencia/Alert: "Esta acción cambiará el gestor pero no el creador original"
- Botones: Cancelar, Confirmar
Validaciones:
- Verificar que newOwnerId sea distinto al actual
- Verificar que todos los usuarios seleccionados sean SALES
- Mostrar error si el OWNER seleccionado es el mismo
Diseño: Similar a los diálogos en CustomersPage.tsx (líneas 223-271)
---
3.4 BatchActionsToolbar.tsx - Acciones masivas
Nuevo archivo: src/pages/admin/components/users/BatchActionsToolbar.tsx
Propósito: Barra flotante con acciones para usuarios seleccionados
Props:
interface BatchActionsToolbarProps {
  selectedCount: number;
  onTransfer: () => void;
  onDelete: () => void;
  onClear: () => void;
  canTransfer: boolean; // Solo ADMIN puede transferir
}
UI Elements:
- Paper flotante en la parte superior de la página
- Chip con "N seleccionados"
- Button "Transferir a otro OWNER" (solo ADMIN)
- Button "Eliminar" (solo ADMIN)
- IconButton con CloseIcon para limpiar selección
Diseño: Inspirado en CustomersPage.tsx (líneas 360-412)
Animación: Usar Slide de MUI para entrada/salida
---
🔄 FASE 4: Actualización de Componentes Existentes
4.1 Actualizar UsersPage.tsx
Ubicación: src/pages/admin/UsersPage.tsx
Cambios a implementar:
4.1.1 Estados adicionales
const [filters, setFilters] = useState<UserFilterState>({
  search: '',
  role: 'ALL',
  managed: false
});
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [transferDialogOpen, setTransferDialogOpen] = useState(false);
const [owners, setOwners] = useState<User[]>([]);
const [ownerDataMap, setOwnerDataMap] = useState<Map<string, User>>(new Map());
4.1.2 Nuevas columnas en DataGrid
{
  field: "ownerId",
  headerName: "Gestionado por",
  width: 200,
  renderCell: (params) => (
    <UserHierarchyIndicator 
      user={params.row}
      ownerData={ownerDataMap.get(params.value)}
    />
  )
},
{
  field: "createdBy",
  headerName: "Creado por",
  width: 150,
  renderCell: (params) => (
    params.value ? <Chip label={getUserName(params.value)} size="small" /> : '-'
  )
}
4.1.3 Checkbox para selección múltiple
<DataGrid
  checkboxSelection
  onRowSelectionModelChange={(newSelection) => {
    setSelectedIds(new Set(newSelection as string[]));
  }}
  // ... resto de props
/>
4.1.4 Integrar componentes nuevos
// Antes del DataGrid
<UserFilters 
  onFilterChange={setFilters}
  currentUser={currentUser}
  showManagedFilter={isOwner}
/>
// Después del DataGrid (condicional)
{selectedIds.size > 0 && (
  <BatchActionsToolbar
    selectedCount={selectedIds.size}
    onTransfer={() => setTransferDialogOpen(true)}
    onDelete={handleBatchDelete}
    onClear={() => setSelectedIds(new Set())}
    canTransfer={isAdmin}
  />
)}
// Modal de transferencia
<TransferDialog
  open={transferDialogOpen}
  onClose={() => setTransferDialogOpen(false)}
  onConfirm={handleTransfer}
  users={Array.from(selectedIds).map(id => users.find(u => u._id === id)!)}
  owners={owners}
Excelente. Ahora voy a crear el plan completo de implementación:
📋 Plan de Implementación: Sistema de Jerarquías y Gestión Avanzada de Usuarios
📊 Resumen Ejecutivo
Según los documentos de API actualizados (users-api.md y sistema-de-jerarquias-usuarios.md), se han implementado las siguientes funcionalidades en el backend:
✅ Ya implementado en Backend:
1. Campos de jerarquía: ownerId y createdBy en el modelo User
2. Endpoints de transferencia: 
   - POST /users/:id/transfer-owner (transferencia individual)
   - POST /users/batch-transfer (transferencia masiva)
3. Endpoint de consulta: GET /users/managed (OWNER obtiene sus SALES)
4. Reglas de negocio: Validaciones automáticas de ownership y creación
❌ Falta implementar en Frontend (UI/UX):
El frontend actual NO tiene soporte para estas nuevas funcionalidades. Necesitamos:
1. Actualizar interfaces TypeScript para incluir ownerId y createdBy
2. Modificar UserModal para manejar asignación de Owner al crear SALES
3. Crear componentes para transferencia de usuarios
4. Mejorar UsersPage con filtros, búsqueda y visualización de jerarquía
5. Añadir indicadores visuales de la jerarquía OWNER-SALES
6. Crear vista de gestión para OWNERs de sus SALES
---
🎯 Objetivos del Plan
Prioridad ALTA (Crítico):
- ✅ Sistema de jerarquía OWNER-SALES completo
- ✅ Transferencia de usuarios (individual y masiva)
- ✅ Filtros y búsqueda avanzada en UsersPage
Prioridad MEDIA (Importante):
- ✅ Mejoras visuales y UX (jerarquía, tooltips, feedback)
Fuera de Scope (No prioritario por ahora):
- ❌ Gestión de Fábricas (CRUD de Factory) - No confirmado en backend
---
📐 Arquitectura de la Solución
Enfoque: Mixto (Evolutivo + Modular)
- Extender componentes existentes: UserModal, UsersPage
- Crear componentes nuevos modulares: TransferOwnerDialog, UserHierarchyChip, ManagedUsersView
- Mantener patrones existentes del proyecto (DataGrid, MUI, servicios API)
---
🗂️ Estructura de Archivos Propuesta
src/
├── interfases/
│   └── user.interfase.ts                    [MODIFICAR] - Añadir ownerId, createdBy
│
├── services/
│   └── user.service.ts                      [CREAR] - Métodos específicos de users API
│
├── pages/admin/
│   ├── UsersPage.tsx                        [MODIFICAR] - Añadir filtros, búsqueda, acciones masivas
│   │
│   └── components/users/
│       ├── UserModal.tsx                    [MODIFICAR] - Soporte ownerId, selector de Owner
│       ├── TransferOwnerDialog.tsx          [CREAR] - Dialog para transferencia individual
│       ├── BatchTransferDialog.tsx          [CREAR] - Dialog para transferencia masiva
│       ├── UserHierarchyChip.tsx            [CREAR] - Chip visual para mostrar Owner/creador
│       ├── ManagedUsersCard.tsx             [CREAR] - Card para OWNERs con sus SALES
│       └── UserFilters.tsx                  [CREAR] - Panel de filtros avanzados
│
└── hooks/
    └── useUserManagement.ts                 [CREAR] - Hook para lógica de gestión de usuarios
---
📝 Plan de Implementación Detallado
FASE 1: Actualizar Modelo de Datos y Servicios 🔧
Objetivo: Sincronizar el frontend con los cambios del backend
1.1 Actualizar Interface User
Archivo: src/interfases/user.interfase.ts
Cambios necesarios:
export interface User {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  roles: Role[];
  factoryId?: string;
  ownerId?: string;        // 🆕 NUEVO - Referencia al OWNER que gestiona este usuario
  createdBy?: string;      // 🆕 NUEVO - Usuario que creó este registro
  createdAt: string;
  updatedAt: string;
  password?: string;
}
Justificación: El backend ya devuelve estos campos en las respuestas. Son necesarios para:
- Mostrar la jerarquía visualmente
- Filtrar usuarios por Owner
- Mostrar quién creó cada usuario
---
1.2 Crear User Service Dedicado
Archivo: src/services/user.service.ts (NUEVO)
Funcionalidad: Centralizar todas las operaciones de users API
Métodos a implementar:
export class UserService {
  // CRUD básico
  static async getUsers(params?: { role?: string; managed?: boolean }): Promise<User[]>
  static async getUserById(id: string): Promise<User>
  static async createUser(data: Partial<User>): Promise<User>
  static async updateUser(id: string, data: Partial<User>): Promise<User>
  static async deleteUser(id: string): Promise<void>
  
  // 🆕 Nuevos métodos específicos de jerarquía
  static async getManagedUsers(): Promise<User[]>  // GET /users/managed
  static async transferOwner(userId: string, newOwnerId: string): Promise<User>
  static async batchTransferOwner(userIds: string[], newOwnerId: string): Promise<{ transferred: number; failed: string[] }>
  
  // Helper methods
  static async getOwners(): Promise<User[]>  // GET /users?role=OWNER
  static async getSalesUsers(): Promise<User[]>  // GET /users?role=SALES
}
Beneficios:
- Código más limpio y mantenible
- Tipado fuerte con TypeScript
- Reutilización en múltiples componentes
- Similar al patrón ya usado en customer.service.ts
---
FASE 2: Mejorar UserModal con Soporte de Jerarquía 🎨
Objetivo: Permitir asignación correcta de Owner al crear usuarios SALES
2.1 Modificar UserModal
Archivo: src/pages/admin/components/users/UserModal.tsx
Cambios necesarios:
A) Añadir selector de Owner (solo para ADMIN creando SALES)
// Nuevo estado
const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");
const [availableOwners, setAvailableOwners] = useState<User[]>([]);
// Cargar OWNERs disponibles al
