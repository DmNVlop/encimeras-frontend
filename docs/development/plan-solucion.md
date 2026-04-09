📋 PLAN DE SOLUCIÓN COMPLETO
🎯 Objetivo
Hacer que /admin/customers funcione correctamente para usuarios SALES, mostrando solo sus clientes y permitiendo todas las operaciones (crear, editar, eliminar, batch delete), mientras se eliminan los errores 403 y 404 de la consola.

---

🔧 Cambios Propuestos

1. Actualizar customer.service.ts
   Problema: getSalesUsers() hace GET a /users?role=SALES que requiere permisos ADMIN/OWNER
   Solución:

- Hacer getSalesUsers() opcional y solo llamarlo si el usuario actual es ADMIN/OWNER
- Mover la lógica de verificación de permisos al componente

2. Actualizar global-settings.service.ts
   Problema: El endpoint /settings/global no existe (404)
   Solución:

- Manejar el error 404 de forma silenciosa (ya lo hace con try/catch)
- PERO: Cambiar el console.warn para que no aparezca en consola del usuario
- Usar valores por defecto de forma transparente

3. Actualizar CustomersPage.tsx
   Problema:

- Promise.all() falla si cualquier promesa falla, bloqueando el renderizado de customers
- La página intenta cargar datos que no necesita para usuarios SALES
  Solución:
- Cargar datos condicionalmente según el rol del usuario:
  - ADMIN/OWNER: Cargar customers + salesUsers + settings
  - SALES/USER: Cargar solo customers (sin salesUsers ni settings)
- Cambiar Promise.all() por Promise.allSettled() para que errores no bloqueen el resto
- Ocultar funcionalidades según rol:
  - Ocultar botón "Asignar Sales" para usuarios SALES/USER
  - Mantener batch delete para todos los roles con permisos

4. Actualizar CustomerList.tsx (si es necesario)
   Verificar:

- Si el componente depende de salesUsers para renderizar
- Hacerlo opcional o manejar el caso cuando salesUsers está vacío

---

📝 Detalles de Implementación
Archivo 1: customer.service.ts
// Hacer que getSalesUsers sea resistente a errores
export const getSalesUsers = (): Promise<User[]> => {
return get<User[]>(`${USERS_ENDPOINT}?role=SALES`)
.catch(error => {
// Si es 403, el usuario no tiene permisos - retornar array vacío
if (error?.originalError?.response?.status === 403) {
return [];
}
throw error; // Re-lanzar otros errores
});
};
Archivo 2: global-settings.service.ts
static async getSettings(): Promise<IGlobalSettings> {
try {
return await get<IGlobalSettings>(this.BASE_URL);
} catch (error) {
// Silenciosamente usar defaults si el endpoint no existe
return {
multiSalesPerCustomer: true,
};
}
}
Archivo 3: CustomersPage.tsx

- Importar useAuth para obtener el rol del usuario actual
- Cargar datos condicionalmente:
  const { user: currentUser } = useAuth();
  const isAdminOrOwner = currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('OWNER');
  const fetchData = useCallback(async () => {
  setLoading(true);
  try {
  // Siempre cargar customers
  const customersPromise = getCustomers();
      // Solo cargar sales users y settings si es ADMIN/OWNER
      const promises = isAdminOrOwner ? [
        customersPromise,
        getSalesUsers(),
        GlobalSettingsService.getMultiSalesPerCustomer(),
      ] : [customersPromise];

      const results = await Promise.allSettled(promises);

      // Extraer resultados
      const customersData = results[0].status === 'fulfilled' ? results[0].value : [];
      const salesData = results[1]?.status === 'fulfilled' ? results[1].value : [];
      const multiSalesEnabled = results[2]?.status === 'fulfilled' ? results[2].value : true;

      setCustomers(customersData);
      setSalesUsers(salesData);
      setMultiSalesEnabled(multiSalesEnabled);
  } catch (error) {
  console.error("Error loading customers:", error);
  } finally {
  setLoading(false);
  }
  }, [isAdminOrOwner]);
- Ocultar botón "Asignar Sales" condicionalmente:
  {isAdminOrOwner && (
  <Button
  variant="outlined"
  startIcon={<PersonAddIcon />}
  onClick={() => setAssignDialogOpen(true)}
  // ... resto del código
  >
      Asignar Sales
    </Button>
  )}
  Archivo 4: CustomerList.tsx (verificar)
- Hacer salesUsers opcional en los props
- Manejar caso cuando está vacío o undefined

---

✅ Resultados Esperados

1. ✅ No más errores 403 en consola - getSalesUsers() maneja el error silenciosamente
2. ✅ No más errores 404 en consola - getSettings() usa defaults sin mostrar error
3. ✅ Customers se muestran correctamente - Promise.allSettled() no bloquea si hay errores
4. ✅ Usuarios SALES ven solo sus clientes - El backend ya filtra automáticamente
5. ✅ Funcionalidades operativas:
   - Ver lista de clientes ✅
   - Crear nuevo cliente ✅
   - Editar cliente ✅
   - Eliminar individual ✅
   - Batch delete ✅
   - Asignar Sales (solo ADMIN/OWNER) ✅

---

🧪 Casos de Prueba
Rol Customers visibles Botón "Asignar Sales"
ADMIN Todos de la fábrica ✅ Visible
OWNER Todos de la fábrica ✅ Visible
SALES Solo sus clientes ❌ Oculto
USER Solo su cliente ❌ Oculto

---

### 📦 Archivos a Modificar

1. ✏️ `src/services/customer.service.ts` - Manejo de error 403
2. ✏️ `src/services/global-settings.service.ts` - Silenciar console.warn
3. ✏️ `src/pages/admin/CustomersPage.tsx` - Carga condicional + Promise.allSettled + UI condicional
4. 🔍 `src/pages/admin/customers/CustomerList.tsx` - Verificar dependencia de salesUsers (lectura)

---

⚠️ Consideraciones Adicionales

1. Multi-sales por defecto: Si el endpoint de settings no existe, se asume multiSalesPerCustomer: true
   - ¿Te parece bien este default? ¿O prefieres false?
2. Batch operations para SALES: Según el backend, SALES puede:
   - ✅ Eliminar clientes (DELETE /customers/:id permite ADMIN y SALES)
   - ❌ Asignar usuarios (PATCH /customers/batch/assign-users requiere ADMIN/OWNER)

   El plan ya contempla esto ocultando "Asignar Sales" para SALES.

3. Permisos de batch delete: Verificar si DELETE /customers/batch permite SALES o solo ADMIN/OWNER
   - Si solo permite ADMIN/OWNER, hay que ocultar el botón de batch delete también

---

❓ Preguntas Finales

1. Default para multiSalesPerCustomer: ¿true o false?
2. Batch delete para SALES: ¿Quieres que esté disponible o prefieres ocultarlo también?
3. ¿Procedo con la implementación de este plan?
