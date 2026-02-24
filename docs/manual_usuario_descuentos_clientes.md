# 📘 Manual de Gestión: Clientes y Motor de Descuentos

Bienvenido al manual operativo del sistema de presupuestación avanzada. Este documento está diseñado para ayudar a los equipos de **Administración**, **Ventas** y **Fábrica** a comprender y utilizar las nuevas funcionalidades de gestión de clientes y aplicación dinámica de descuentos.

---

## 1. Gestión de Clientes 👥

El módulo de clientes permite centralizar la información de contacto y perfiles comerciales para personalizar la experiencia de venta.

### 🔹 Tipos de Clientes

- **Individual:** Consumidor final (requiere Nombre y Apellidos).
- **Empresa (Company):** Entidades jurídicas (requiere Nombre Oficial, NIF y Representante Legal).

### 🔹 Acciones Disponibles

1.  **Alta de Clientes:** Desde el panel de Administración > Clientes.
2.  **Perfiles de Descuento:** Cada cliente puede tener un "Perfil de Descuento" preasignado (aunque el motor de reglas puede aplicar descuentos adicionales automáticos).
3.  **Seguimiento:** Los clientes quedan vinculados a cada presupuesto (borrador) y pedido final, manteniendo un historial limpio.

---

## 2. Motor de Reglas de Descuento ⚡

Esta es la herramienta más potente para automatizar la política comercial de la empresa. Permite crear reglas lógicas que el sistema aplica instantáneamente sin intervención manual.

### 🔹 Configuración de una Regla

Al crear una regla en **Administración > Reglas de Descuento**, encontrarás:

| Campo                      | Descripción                                                                                                                                      |
| :------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo**                   | Porcentaje (%) sobre el precio o Importe Fijo (€) a restar.                                                                                      |
| **Alcance (Scope)**        | ¿A qué se aplica? Puede ser al **Total del Pedido**, a **Materiales Específicos** o a una **Categoría completa** (ej: todos los "Porcelánicos"). |
| **Prioridad**              | En qué orden se aplican. Los números más altos se procesan primero.                                                                              |
| **Estrategia de Colisión** | Si coinciden dos reglas: ¿Se suman?, ¿Se aplica solo la mayor?, ¿O se aplican en cascada?                                                        |
| **Acumulable**             | Define si esta regla puede convivir con otras o si es exclusiva.                                                                                 |

### 🔹 Condiciones de Activación (Filtros)

Puedes limitar cuándo funciona una regla:

- **Fechas:** Ideal para campañas de "Black Friday" o promociones mensuales.
- **Segmentación:** Aplicar una regla solo a "Clientes Específicos" (ej: Clientes VIP).
- **Volumen:** Activar el descuento solo si el pedido supera una cantidad mínima de puntos (€).

---

## 3. Flujo en el Wizard de Presupuestos (Ventas) 🛒

El equipo de ventas ahora tiene un control total sobre cómo se aplican los descuentos durante la preventa.

### 🔹 Paso a Paso

1.  **Configura el Proyecto:** Diseña la encimera, materiales y mecanizados como siempre.
2.  **Identifica al Cliente:** En la pantalla final de **Resumen**, verás un buscador de clientes.
3.  **Recálculo Automático:** Al seleccionar un cliente, el sistema detecta si hay reglas específicas para él y **actualiza los precios inmediatamente**.
4.  **Validación Visual:**
    - Verás los precios originales tachados.
    - Aparecerá una lista detallada de qué reglas se han activado (ej: "-10% Descuento Especial").

---

## 4. Gestión de Fábrica y Pedidos 🏭

Cuando un presupuesto se convierte en **Pedido Oficial**, el sistema realiza un "Snapshot" (foto fija).

- **Precios Blindados:** Una vez que el pedido entra en producción, los descuentos aplicados quedan "quemados" en el registro. No cambiarán aunque borres o modifiques la regla de descuento en el futuro.
- **Detalle Técnico:** El operario en fábrica puede ver en la orden de trabajo si el material tiene un tratamiento de precio especial, lo cual facilita la verificación de costos.

---

## 5. Mejores Prácticas 💡

- **Reglas de Categoría:** Es más eficiente crear una regla para la categoría "Granitos" que crear 20 reglas individuales para cada granito.
- **Prioridad:** Pon las reglas de porcentaje alto (ej: 20%) con mayor prioridad que las de importe fijo para maximizar o controlar mejor el margen.
- **NIF Corrector:** Asegúrate de introducir el NIF correctamente en las empresas para que el sistema de facturación posterior no genere errores.

---

_Este documento es propiedad de la fábrica y debe ser consultado ante cualquier duda sobre la aplicación de precios especiales._
