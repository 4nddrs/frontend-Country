# 📋 CASOS DE USO - Sistema de Gestión Country Club

## 🎯 Visión General del Sistema

Sistema web integral para la gestión de un club hípico que permite administrar empleados, caballos, planes nutricionales, procedimientos sanitarios, control económico y asignación de tareas, con tres tipos de usuarios diferenciados.

---

## 👥 ACTORES DEL SISTEMA

### 1. **Administrador**

- Gestiona todos los módulos del sistema
- Control total sobre empleados, caballos y finanzas
- Aprobación de nuevos usuarios

### 2. **Usuario Propietario**

- Visualiza información de sus caballos
- Consulta pagos y estado económico
- Accede a cámaras del establo

### 3. **Caballerizo**

- Gestiona tareas asignadas
- Visualiza caballos bajo su cuidado
- Actualiza estado de tareas

### 4. **Sistema**

- Autenticación y autorización
- Sincronización entre pestañas
- Notificaciones y validaciones

---

## 📱 MÓDULO 1: AUTENTICACIÓN Y GESTIÓN DE USUARIOS

### CU-01: Registro de Usuario

**Actor:** Usuario No Registrado  
**Descripción:** Permite a un usuario crear una cuenta en el sistema  
**Flujo Principal:**

1. Usuario accede a la pantalla de registro
2. Completa formulario con:
   - Nombre de usuario
   - Nombre y apellidos
   - CI (8 dígitos)
   - Teléfono (8 dígitos)
   - Correo electrónico
   - Contraseña y confirmación
3. Sistema valida datos
4. Crea cuenta con estado "Pendiente de aprobación"
5. Envía email de confirmación
6. Usuario espera aprobación del administrador

**Validaciones:**

- CI y teléfono deben ser numéricos de 8 dígitos
- Email debe ser válido y único
- Contraseñas deben coincidir
- Campos obligatorios completos

**Pantalla:** `AuthForm.tsx`

---

### CU-02: Inicio de Sesión

**Actor:** Usuario Registrado  
**Descripción:** Permite acceder al sistema con credenciales  
**Flujo Principal:**

1. Usuario ingresa email y contraseña
2. Sistema valida credenciales
3. Verifica estado de aprobación
4. Asigna rol correspondiente
5. Redirige según rol:
   - Admin → Dashboard administrativo
   - Propietario → Vista de usuario
   - Caballerizo → Dashboard de caballerizo

**Validaciones:**

- Cuenta debe estar aprobada
- Rol debe estar asignado
- Credenciales válidas

**Pantalla:** `AuthForm.tsx`

---

### CU-03: Recuperación de Contraseña

**Actor:** Usuario Registrado  
**Descripción:** Permite recuperar acceso mediante email  
**Flujo Principal:**

1. Usuario hace clic en "¿Olvidaste la contraseña?"
2. Ingresa su email
3. Sistema envía link de recuperación
4. Usuario hace clic en el link del email
5. Ingresa nueva contraseña
6. Confirma nueva contraseña
7. Sistema actualiza credenciales
8. Redirige a login

**Validaciones:**

- Email debe existir en el sistema
- Link tiene validez de 1 hora
- Contraseñas deben coincidir y cumplir requisitos de seguridad

**Pantallas:** `AuthForm.tsx`, `ResetPassword.tsx`

---

### CU-04: Cerrar Sesión

**Actor:** Usuario Autenticado  
**Descripción:** Termina la sesión actual y limpia tokens  
**Flujo Principal:**

1. Usuario hace clic en "Cerrar sesión"
2. Sistema cierra sesión en Supabase
3. Limpia tokens del localStorage
4. Sincroniza con otras pestañas abiertas
5. Redirige a pantalla de login

**Funcionalidades Especiales:**

- Sincronización multi-pestaña via BroadcastChannel
- Limpieza completa de cache

**Componentes:** `Sidebar.tsx`, `SidebarUser.tsx`, `SidebarCaballerizo.tsx`

---

### CU-05: Aprobar Usuarios Pendientes

**Actor:** Administrador  
**Descripción:** Revisa y aprueba cuentas de nuevos usuarios  
**Flujo Principal:**

1. Admin accede a "Usuarios Pendientes"
2. Visualiza lista de registros pendientes
3. Revisa información del usuario
4. Asigna rol (Propietario/Caballerizo)
5. Aprueba o rechaza la cuenta
6. Sistema notifica al usuario por email

**Validaciones:**

- Solo administradores pueden aprobar
- Debe asignar un rol antes de aprobar

**Pantalla:** `PendingUsers.tsx`

---

### CU-06: Gestión de Roles de Usuario

**Actor:** Administrador  
**Descripción:** Administra los roles disponibles en el sistema  
**Flujo Principal:**

1. Admin accede a "Roles de Usuario ERP"
2. Visualiza roles existentes:
   - Administrador (ID: 6)
   - Usuario Propietario (ID: 7)
   - Staff (ID: 8)
   - Caballerizo (ID: 9)
3. Puede crear/editar/eliminar roles
4. Asigna permisos a cada rol

**Pantalla:** `UserRole.tsx`

---

### CU-07: Gestión de Usuarios ERP

**Actor:** Administrador  
**Descripción:** Administra usuarios internos del sistema  
**Flujo Principal:**

1. Admin accede a "Usuarios ERP"
2. Visualiza lista de usuarios
3. Puede:
   - Ver detalles de usuario
   - Cambiar rol asignado
   - Activar/desactivar cuenta
   - Resetear contraseña

**Pantalla:** `ErpUsers.tsx`

---

## 🐴 MÓDULO 2: GESTIÓN DE CABALLOS Y PROPIETARIOS

### CU-08: Registro de Propietarios

**Actor:** Administrador  
**Descripción:** Registra nuevos propietarios de caballos  
**Flujo Principal:**

1. Admin accede a "Propietarios"
2. Hace clic en "Nuevo Propietario"
3. Completa formulario:
   - Nombre completo
   - CI
   - Teléfono
   - Email
   - Dirección
4. Guarda información
5. Sistema crea registro

**Validaciones:**

- CI único en el sistema
- Email válido

**Pantalla:** `Owners.tsx`

---

### CU-09: Gestión de Razas

**Actor:** Administrador  
**Descripción:** Administra catálogo de razas de caballos  
**Flujo Principal:**

1. Admin accede a "Razas"
2. Visualiza razas registradas
3. Puede:
   - Agregar nueva raza
   - Editar características
   - Eliminar raza (si no tiene caballos asociados)

**Campos:**

- Nombre de raza
- Características físicas
- Origen

**Pantalla:** `Races.tsx`

---

### CU-10: Registro de Caballos

**Actor:** Administrador  
**Descripción:** Registra nuevos caballos en el sistema  
**Flujo Principal:**

1. Admin accede a "Caballos"
2. Hace clic en "Nuevo Caballo"
3. Completa formulario:
   - Nombre del caballo
   - Raza
   - Edad
   - Color
   - Sexo
   - Propietario
   - Foto (opcional)
   - Observaciones médicas
4. Guarda información

**Validaciones:**

- Propietario debe existir
- Raza debe estar registrada
- Edad debe ser positiva

**Pantalla:** `Horses.tsx`

---

### CU-11: Asignación de Caballos a Caballerizos

**Actor:** Administrador  
**Descripción:** Asigna caballos específicos a caballerizos para su cuidado  
**Flujo Principal:**

1. Admin accede a "Asignación de Caballos"
2. Selecciona un caballerizo
3. Visualiza caballos disponibles
4. Asigna uno o varios caballos
5. Define fecha de inicio y fin (opcional)
6. Sistema registra asignación

**Validaciones:**

- Caballerizo debe estar activo
- Caballo no puede estar asignado simultáneamente a otro caballerizo

**Pantalla:** `HorseAssignmentsManagement.tsx`

---

### CU-12: Visualización de Caballos (Usuario Propietario)

**Actor:** Usuario Propietario  
**Descripción:** Propietario consulta información de sus caballos  
**Flujo Principal:**

1. Usuario accede a "Mi Caballo"
2. Visualiza:
   - Datos generales del caballo
   - Foto
   - Plan nutricional actual
   - Historial de procedimientos sanitarios
   - Caballerizo asignado
   - Estado de salud

**Restricciones:**

- Solo ve sus propios caballos

**Pantalla:** `UserHorses.tsx`

---

### CU-13: Visualización de Caballos (Caballerizo)

**Actor:** Caballerizo  
**Descripción:** Caballerizo consulta caballos bajo su cuidado  
**Flujo Principal:**

1. Caballerizo accede a "Caballos asignados"
2. Visualiza lista de caballos asignados
3. Puede ver:
   - Información del caballo
   - Plan nutricional
   - Tareas pendientes relacionadas
   - Próximos procedimientos

**Pantalla:** `CaballosCaballerizo.tsx`

---

## 🥗 MÓDULO 3: NUTRICIÓN Y ALIMENTACIÓN

### CU-14: Gestión de Proveedores de Comida

**Actor:** Administrador  
**Descripción:** Administra proveedores de alimentos para caballos  
**Flujo Principal:**

1. Admin accede a "Proveedores de Comida"
2. Puede:
   - Registrar nuevo proveedor
   - Editar información
   - Activar/desactivar proveedor
3. Datos:
   - Nombre de empresa
   - NIT
   - Teléfono
   - Dirección
   - Email
   - Productos que suministra

**Pantalla:** `FoodProviders.tsx`

---

### CU-15: Control de Stock de Comida

**Actor:** Administrador  
**Descripción:** Gestiona inventario de alimentos  
**Flujo Principal:**

1. Admin accede a "Stock de Comida"
2. Visualiza inventario actual:
   - Tipo de alimento
   - Cantidad disponible
   - Unidad de medida
   - Fecha de vencimiento
   - Proveedor
3. Puede:
   - Registrar entrada de stock
   - Registrar salida/consumo
   - Ver alertas de stock mínimo

**Validaciones:**

- Stock no puede ser negativo
- Alertas cuando stock < mínimo definido

**Pantalla:** `FoodStocks.tsx`

---

### CU-16: Crear Plan Nutricional

**Actor:** Administrador  
**Descripción:** Define planes nutricionales generales  
**Flujo Principal:**

1. Admin accede a "Planes Nutricionales"
2. Crea nuevo plan:
   - Nombre del plan
   - Descripción
   - Tipo de caballo (edad, actividad)
   - Objetivos nutricionales
3. Sistema guarda plan base

**Pantalla:** `NutritionalPlans.tsx`

---

### CU-17: Detalles de Plan Nutricional

**Actor:** Administrador  
**Descripción:** Define detalles específicos de un plan nutricional  
**Flujo Principal:**

1. Admin selecciona un plan nutricional
2. Agrega detalles:
   - Tipo de alimento
   - Cantidad por ración
   - Frecuencia (desayuno, almuerzo, cena)
   - Horarios
   - Instrucciones especiales
3. Guarda configuración

**Pantalla:** `NutritionalPlanDetails.tsx`

---

### CU-18: Asignar Plan Nutricional a Caballo

**Actor:** Administrador  
**Descripción:** Asigna un plan nutricional específico a un caballo  
**Flujo Principal:**

1. Admin accede a "Planes Nutricionales de Caballos"
2. Selecciona caballo
3. Asigna plan nutricional
4. Define:
   - Fecha de inicio
   - Fecha de fin (opcional)
   - Ajustes personalizados
5. Sistema activa el plan

**Validaciones:**

- Caballo solo puede tener un plan activo a la vez

**Pantalla:** `NutritionalPlanHorses.tsx`

---

### CU-19: Control de Consumo de Alfalfa

**Actor:** Administrador  
**Descripción:** Registra y controla consumo diario de alfalfa  
**Flujo Principal:**

1. Admin accede a "Control de Consumo de Alfalfa"
2. Registra:
   - Fecha
   - Cantidad consumida
   - Caballos que consumieron
   - Observaciones
3. Sistema actualiza stock automáticamente
4. Genera alertas si consumo es anormal

**Pantalla:** `AlphaConsumptionControl.tsx`

---

### CU-20: Control de Alfalfa (Alternativo)

**Actor:** Administrador  
**Descripción:** Control general de alfalfa disponible  
**Flujo Principal:**

1. Admin accede a "Control de Alfalfa"
2. Visualiza:
   - Stock actual
   - Consumo promedio diario
   - Proyección de duración
   - Historial de compras
3. Puede registrar nuevas compras

**Pantalla:** `AlphaControls.tsx`

---

## 💉 MÓDULO 4: ATENCIÓN VETERINARIA Y SANITARIA

### CU-21: Gestión de Medicamentos

**Actor:** Administrador  
**Descripción:** Administra catálogo de medicamentos disponibles  
**Flujo Principal:**

1. Admin accede a "Medicamentos"
2. Puede:
   - Registrar nuevo medicamento
   - Editar información
   - Controlar stock
3. Datos:
   - Nombre del medicamento
   - Principio activo
   - Presentación
   - Dosis
   - Stock actual
   - Fecha de vencimiento
   - Laboratorio

**Validaciones:**

- Alertas de vencimiento próximo
- Alertas de stock mínimo

**Pantalla:** `Medicines.tsx`

---

### CU-22: Gestión de Vacunas

**Actor:** Administrador  
**Descripción:** Administra catálogo de vacunas  
**Flujo Principal:**

1. Admin accede a "Vacunas" (menú relacionado)
2. Registra:
   - Nombre de vacuna
   - Enfermedad que previene
   - Laboratorio
   - Stock
   - Fecha de vencimiento
   - Frecuencia recomendada

**Pantalla:** `Vaccines.tsx`

---

### CU-23: Crear Plan de Vacunación

**Actor:** Administrador  
**Descripción:** Define plan sanitario de vacunación  
**Flujo Principal:**

1. Admin accede a "Gestión del Plan Sanitario (Vacunas)"
2. Crea plan:
   - Nombre del plan
   - Periodo (trimestral, semestral, anual)
   - Vacunas incluidas
   - Orden de aplicación
   - Intervalos entre vacunas
3. Sistema guarda plan

**Pantalla:** `VaccinationPlan.tsx`

---

### CU-24: Aplicar Plan de Vacunación

**Actor:** Administrador  
**Descripción:** Ejecuta plan de vacunación en caballos  
**Flujo Principal:**

1. Admin accede a "Ejecución del Plan Sanitario (Vacunas)"
2. Selecciona:
   - Plan de vacunación
   - Caballo(s) a vacunar
   - Fecha de aplicación
3. Registra:
   - Vacuna aplicada
   - Dosis
   - Lote
   - Veterinario responsable
   - Observaciones
4. Sistema:
   - Actualiza stock de vacunas
   - Programa próxima vacunación
   - Notifica a propietario (opcional)

**Pantalla:** `VaccinationPlanApplication.tsx`

---

### CU-25: Programar Procedimientos Sanitarios

**Actor:** Administrador  
**Descripción:** Programa procedimientos veterinarios  
**Flujo Principal:**

1. Admin accede a "Procedimientos Sanitarios Programados"
2. Crea procedimiento:
   - Tipo (desparasitación, chequeo, etc.)
   - Caballo
   - Fecha programada
   - Veterinario asignado
   - Materiales necesarios
   - Observaciones
3. Sistema agenda el procedimiento

**Pantalla:** `ScheduledProcedures.tsx`

---

### CU-26: Ejecutar Procedimientos Sanitarios

**Actor:** Administrador  
**Descripción:** Registra ejecución de procedimientos  
**Flujo Principal:**

1. Admin accede a "Ejecución de Procedimientos Sanitarios"
2. Selecciona procedimiento programado
3. Registra:
   - Fecha real de ejecución
   - Medicamentos/vacunas aplicados
   - Dosis
   - Observaciones del veterinario
   - Estado post-procedimiento
4. Sistema:
   - Marca como completado
   - Actualiza historial del caballo
   - Actualiza stock de medicamentos

**Pantalla:** `ApplicationProcedures.tsx`

---

### CU-27: Atención a Caballos

**Actor:** Administrador  
**Descripción:** Registra atenciones veterinarias no programadas  
**Flujo Principal:**

1. Admin accede a "Atención a Caballos"
2. Selecciona caballo
3. Registra:
   - Motivo de atención
   - Síntomas
   - Diagnóstico
   - Tratamiento aplicado
   - Medicamentos recetados
   - Próximo control
4. Sistema guarda en historial médico

**Validaciones:**

- Registra fecha y hora automáticamente
- Puede adjuntar fotos

**Pantalla:** `AttentionHorses.tsx`

---

## 👷 MÓDULO 5: GESTIÓN DE EMPLEADOS Y TURNOS

### CU-28: Gestión de Empleados

**Actor:** Administrador  
**Descripción:** Administra información de empleados  
**Flujo Principal:**

1. Admin accede a "Empleados"
2. Puede:
   - Registrar nuevo empleado
   - Editar información
   - Activar/desactivar
   - Ver historial laboral
3. Datos:
   - Nombre completo
   - CI
   - Fecha de nacimiento
   - Teléfono
   - Dirección
   - Email
   - Posición
   - Fecha de contratación
   - Salario

**Validaciones:**

- CI único
- Debe asignar posición

**Pantalla:** `Employee.tsx`

---

### CU-29: Gestión de Posiciones

**Actor:** Administrador  
**Descripción:** Administra cargos laborales  
**Flujo Principal:**

1. Admin accede a "Posiciones"
2. Puede:
   - Crear nueva posición
   - Definir responsabilidades
   - Asignar salario base
3. Ejemplos:
   - Caballerizo
   - Veterinario
   - Administrador
   - Personal de limpieza

**Pantalla:** `PositionManagment.tsx`

---

### CU-30: Tipos de Turno

**Actor:** Administrador  
**Descripción:** Define tipos de turnos laborales  
**Flujo Principal:**

1. Admin accede a "Tipos de Turno"
2. Crea turnos:
   - Nombre (Mañana, Tarde, Noche)
   - Horario de inicio
   - Horario de fin
   - Días de la semana
   - Recargo salarial (%)
3. Sistema guarda configuración

**Pantalla:** `ShiftTypes.tsx`

---

### CU-31: Asignar Empleados a Turnos

**Actor:** Administrador  
**Descripción:** Asigna empleados a turnos específicos  
**Flujo Principal:**

1. Admin accede a "Empleados por Turno"
2. Selecciona turno
3. Asigna empleados disponibles
4. Define:
   - Fecha de inicio
   - Fecha de fin (opcional)
   - Días que trabaja
5. Sistema registra asignación

**Validaciones:**

- Empleado no puede tener turnos solapados

**Pantalla:** `ShiftEmployeds.tsx`

---

### CU-32: Gestión de Turnos de Empleados

**Actor:** Administrador  
**Descripción:** Visualiza y modifica turnos asignados  
**Flujo Principal:**

1. Admin accede a "Turnos de Empleados"
2. Visualiza calendario de turnos
3. Puede:
   - Modificar asignaciones
   - Intercambiar turnos
   - Ver cobertura por turno

**Pantalla:** `EmployeesShiftem.tsx`

---

### CU-33: Registro de Ausencias

**Actor:** Administrador  
**Descripción:** Registra ausencias de empleados  
**Flujo Principal:**

1. Admin accede a "Ausencias de Empleados"
2. Registra ausencia:
   - Empleado
   - Fecha/periodo
   - Tipo (enfermedad, permiso, vacaciones)
   - Motivo
   - Documento justificativo (opcional)
3. Sistema:
   - Registra ausencia
   - Marca turno como vacante
   - Calcula descuento salarial (si aplica)

**Validaciones:**

- Requiere justificación según tipo

**Pantalla:** `EmployeeAbsences.tsx`

---

## 📋 MÓDULO 6: GESTIÓN DE TAREAS

### CU-34: Categorías de Tareas

**Actor:** Administrador  
**Descripción:** Define categorías para clasificar tareas  
**Flujo Principal:**

1. Admin accede a "Categorías de Tareas"
2. Crea categorías:
   - Nombre
   - Descripción
   - Color identificador
3. Ejemplos:
   - Alimentación
   - Limpieza
   - Entrenamiento
   - Mantenimiento

**Pantalla:** `TaskCategories.tsx`

---

### CU-35: Crear y Asignar Tareas

**Actor:** Administrador  
**Descripción:** Crea tareas y las asigna a empleados  
**Flujo Principal:**

1. Admin accede a "Tareas"
2. Crea nueva tarea:
   - Título
   - Descripción
   - Categoría
   - Prioridad (Baja, Media, Alta)
   - Fecha límite
   - Empleado/caballerizo asignado
   - Caballo relacionado (opcional)
3. Sistema notifica al asignado

**Estados de tarea:**

- Pendiente
- En progreso
- Completada
- Cancelada

**Pantalla:** `Tasks.tsx`

---

### CU-36: Visualización de Tareas (Caballerizo)

**Actor:** Caballerizo  
**Descripción:** Caballerizo visualiza sus tareas asignadas  
**Flujo Principal:**

1. Caballerizo accede a "Tareas asignadas"
2. Visualiza:
   - Tareas pendientes
   - Tareas en progreso
   - Tareas completadas
3. Puede filtrar por:
   - Prioridad
   - Fecha
   - Caballo
4. Ve detalles de cada tarea

**Pantalla:** `TareasCaballerizo.tsx`

---

### CU-37: Actualizar Estado de Tarea (Caballerizo)

**Actor:** Caballerizo  
**Descripción:** Caballerizo actualiza progreso de tareas  
**Flujo Principal:**

1. Caballerizo selecciona tarea
2. Cambia estado a "En progreso"
3. Al finalizar:
   - Marca como "Completada"
   - Agrega observaciones
   - Adjunta evidencia (foto) opcional
4. Sistema registra fecha/hora de completado

**Pantalla:** `TareasCaballerizo.tsx`

---

## 💰 MÓDULO 7: GESTIÓN FINANCIERA

### CU-38: Registro de Egresos

**Actor:** Administrador  
**Descripción:** Registra gastos del club  
**Flujo Principal:**

1. Admin accede a "Egresos"
2. Registra gasto:
   - Concepto
   - Monto
   - Fecha
   - Categoría (alimentos, medicamentos, salarios, etc.)
   - Proveedor (si aplica)
   - Método de pago
   - Factura/comprobante
3. Sistema:
   - Registra egreso
   - Actualiza balance

**Categorías:**

- Alimentación
- Medicamentos
- Salarios
- Mantenimiento
- Servicios

**Pantalla:** `Expenses.tsx`

---

### CU-39: Registro de Ingresos

**Actor:** Administrador  
**Descripción:** Registra ingresos del club  
**Flujo Principal:**

1. Admin accede a "Ingresos"
2. Registra ingreso:
   - Concepto
   - Monto
   - Fecha
   - Categoría (pensión, servicios, venta)
   - Propietario (si aplica)
   - Método de cobro
   - Recibo
3. Sistema:
   - Registra ingreso
   - Actualiza balance
   - Asocia a propietario si corresponde

**Categorías:**

- Pensión mensual
- Servicios veterinarios
- Entrenamiento
- Otros

**Pantalla:** `Income.tsx`

---

### CU-40: Pago de Salarios

**Actor:** Administrador  
**Descripción:** Gestiona pago de salarios a empleados  
**Flujo Principal:**

1. Admin accede a "Pagos de Salarios"
2. Selecciona periodo (mes/año)
3. Sistema calcula salarios:
   - Salario base
   - Horas extra
   - Bonos
   - Descuentos (ausencias, adelantos)
4. Admin revisa y confirma
5. Registra:
   - Fecha de pago
   - Método de pago
   - Comprobante
6. Sistema marca como pagado

**Validaciones:**

- No permite duplicar pago del mismo periodo

**Pantalla:** `SalaryPayment.tsx`

---

### CU-41: Pago de Propinas

**Actor:** Administrador  
**Descripción:** Gestiona distribución de propinas  
**Flujo Principal:**

1. Admin accede a "Pago de Propinas"
2. Registra propinas recibidas
3. Define criterio de distribución:
   - Por igual entre empleados
   - Por horas trabajadas
   - Por desempeño
4. Sistema calcula monto por empleado
5. Registra pago

**Pantalla:** `TipPayment.tsx`

---

### CU-42: Reporte Mensual de Propietario

**Actor:** Administrador  
**Descripción:** Genera reporte financiero mensual por propietario  
**Flujo Principal:**

1. Admin accede a "Reportes Mensuales de Propietario"
2. Selecciona propietario y periodo
3. Sistema genera reporte con:
   - Pensión mensual
   - Servicios adicionales
   - Procedimientos veterinarios
   - Medicamentos
   - Alimentación especial
   - Total a pagar
4. Puede exportar PDF/Excel
5. Enviar por email al propietario

**Pantalla:** `OwnerReportMonth.tsx`

---

### CU-43: Control Total Financiero

**Actor:** Administrador  
**Descripción:** Dashboard financiero general  
**Flujo Principal:**

1. Admin accede a "Control Total"
2. Visualiza:
   - Ingresos del mes/año
   - Egresos del mes/año
   - Balance
   - Proyecciones
   - Gráficos comparativos
   - Categorías de mayor gasto
3. Puede filtrar por periodo

**Pantalla:** `TotalConrtrol.tsx`

---

### CU-44: Pagos y Estado Económico (Usuario)

**Actor:** Usuario Propietario  
**Descripción:** Propietario consulta su estado de cuenta  
**Flujo Principal:**

1. Usuario accede a "Pagos y Estado Económico"
2. Visualiza:
   - Saldo actual
   - Último pago realizado
   - Próximo pago pendiente
   - Historial de pagos
   - Detalle de servicios del mes
3. Puede descargar comprobantes

**Restricciones:**

- Solo ve su propia información financiera

**Pantalla:** `UserPayments.tsx`

---

## 📊 MÓDULO 8: DASHBOARD Y REPORTES

### CU-45: Dashboard Administrativo

**Actor:** Administrador  
**Descripción:** Panel principal con métricas clave  
**Flujo Principal:**

1. Admin inicia sesión
2. Visualiza dashboard con:
   - Total de caballos
   - Total de empleados
   - Tareas pendientes
   - Balance financiero del mes
   - Próximos procedimientos sanitarios
   - Alertas de stock bajo
   - Empleados ausentes hoy
   - Caballos con atención pendiente
3. Gráficos:
   - Ingresos vs Egresos (mensual)
   - Ocupación de establos
   - Distribución de tareas

**Pantalla:** `Dashboard.tsx`

---

### CU-46: Inicio Usuario Propietario

**Actor:** Usuario Propietario  
**Descripción:** Página principal del propietario  
**Flujo Principal:**

1. Usuario inicia sesión
2. Visualiza:
   - Resumen de sus caballos
   - Estado de salud general
   - Próximos procedimientos
   - Último reporte mensual
   - Notificaciones importantes
3. Accesos rápidos a:
   - Mi Caballo
   - Cámara del Establo
   - Estado de pagos

**Pantalla:** `UserHome.tsx`

---

### CU-47: Perfil de Usuario Propietario

**Actor:** Usuario Propietario  
**Descripción:** Gestiona información personal  
**Flujo Principal:**

1. Usuario accede a "Perfil"
2. Visualiza/edita:
   - Nombre completo
   - Email
   - Teléfono
   - Dirección
   - Foto de perfil
3. Puede cambiar contraseña
4. Guarda cambios

**Pantalla:** `UserProfile.tsx`

---

### CU-48: Perfil de Caballerizo

**Actor:** Caballerizo  
**Descripción:** Gestiona información personal del caballerizo  
**Flujo Principal:**

1. Caballerizo accede a "Perfil"
2. Visualiza:
   - Información personal
   - Posición
   - Fecha de contratación
   - Caballos asignados
   - Estadísticas de tareas:
     - Completadas
     - Pendientes
     - Promedio de completado
3. Puede editar datos de contacto
4. Cambiar contraseña

**Pantalla:** `PerfilCaballerizo.tsx`

---

### CU-49: Cámara del Establo

**Actor:** Usuario Propietario  
**Descripción:** Visualiza cámaras en tiempo real  
**Flujo Principal:**

1. Usuario accede a "Cámara del Establo"
2. Selecciona establo de su caballo
3. Visualiza transmisión en vivo
4. Puede:
   - Cambiar entre cámaras
   - Capturar foto
   - Ver historial de grabaciones (si disponible)

**Restricciones:**

- Solo accede a cámaras del establo de su caballo

**Pantalla:** `UserCamera.tsx`

---

## 🔄 MÓDULO 9: FUNCIONALIDADES DEL SISTEMA

### CU-50: Sincronización Multi-Pestaña

**Actor:** Sistema  
**Descripción:** Sincroniza estado de autenticación entre pestañas  
**Flujo Principal:**

1. Usuario abre múltiples pestañas
2. Inicia sesión en Pestaña A
3. Sistema usa BroadcastChannel para notificar
4. Pestaña B detecta cambio y actualiza
5. Ambas pestañas muestran sesión activa
6. Si cierra sesión en Pestaña A:
   - Sistema notifica a Pestaña B
   - Ambas regresan a login

**Tecnología:**

- BroadcastChannel API
- Supabase onAuthStateChange
- localStorage compartido

**Componente:** `App.tsx`

---

### CU-51: Gestión de Tokens y Sesiones

**Actor:** Sistema  
**Descripción:** Maneja tokens de autenticación de forma segura  
**Flujo Principal:**

1. Usuario inicia sesión
2. Sistema recibe token de Supabase
3. Almacena en localStorage con clave única
4. Configura auto-refresh de token
5. Al cerrar sesión:
   - Limpia todos los tokens con prefijo `sb-`
   - Cierra sesión en Supabase
   - Notifica a otras pestañas

**Seguridad:**

- Tokens encriptados
- Auto-refresh antes de expiración
- Limpieza completa en logout

**Componente:** `supabaseClient.ts`, `auth.ts`

---

### CU-52: Validación de Roles y Permisos

**Actor:** Sistema  
**Descripción:** Verifica permisos según rol del usuario  
**Flujo Principal:**

1. Usuario accede a una ruta
2. Sistema verifica:
   - Sesión activa
   - Cuenta aprobada
   - Rol asignado
3. Según rol, permite/deniega acceso
4. Redirige a vista correspondiente:
   - Admin → Dashboard administrativo
   - Propietario → Vista usuario
   - Caballerizo → Dashboard caballerizo
   - Sin rol → Pantalla de error

**Validaciones:**

- RLS (Row Level Security) en Supabase
- Verificación en frontend
- Protección de rutas con React Router

**Componente:** `App.tsx`

---

### CU-53: Manejo de Errores y Recuperación

**Actor:** Sistema  
**Descripción:** Gestiona errores de conexión y estado  
**Flujo Principal:**

1. Detecta error (red, autenticación, validación)
2. Muestra mensaje amigable al usuario
3. Registra error en consola (desarrollo)
4. Ofrece opciones de recuperación:
   - Reintentar
   - Recargar página
   - Volver a inicio
5. Mantiene estado anterior cuando es posible

**Tipos de errores manejados:**

- Error de red
- Token expirado
- Sesión inválida
- Cuenta no aprobada
- Sin rol asignado
- Error de base de datos

**Componentes:** `App.tsx`, toast notifications

---

### CU-54: Búsqueda en Menú

**Actor:** Todos los usuarios  
**Descripción:** Permite buscar opciones en el menú lateral  
**Flujo Principal:**

1. Usuario hace clic en campo de búsqueda
2. Escribe término de búsqueda
3. Sistema filtra opciones en tiempo real
4. Muestra solo coincidencias
5. Usuario hace clic en resultado
6. Navega a la opción seleccionada

**Características:**

- Búsqueda instantánea
- Ignora mayúsculas/minúsculas
- Resalta coincidencias

**Componentes:** `Sidebar.tsx`, `SidebarUser.tsx`, `SidebarCaballerizo.tsx`

---

### CU-55: Responsividad Multi-Dispositivo

**Actor:** Sistema  
**Descripción:** Adapta interfaz según dispositivo  
**Flujo Principal:**

1. Sistema detecta tipo de dispositivo
2. Aplica estilos responsive:
   - Desktop: Sidebar siempre visible
   - Tablet: Sidebar colapsable
   - Móvil: Menú hamburguesa
3. Ajusta:
   - Tamaño de fuentes
   - Espaciado
   - Navegación
   - Formularios
4. Optimiza interacciones táctiles

**Características especiales:**

- Touch-action optimizado
- Prevención de zoom en inputs
- BroadcastChannel para sincronización
- Gestos táctiles nativos

**Componentes:** `index.css`, todos los componentes

---

## 📈 RESUMEN CUANTITATIVO

### **Total de Casos de Uso: 55**

**Por Módulo:**

- 🔐 Autenticación y Usuarios: 7 casos
- 🐴 Caballos y Propietarios: 6 casos
- 🥗 Nutrición y Alimentación: 7 casos
- 💉 Atención Veterinaria: 7 casos
- 👷 Empleados y Turnos: 6 casos
- 📋 Gestión de Tareas: 4 casos
- 💰 Gestión Financiera: 7 casos
- 📊 Dashboard y Reportes: 5 casos
- 🔄 Funcionalidades del Sistema: 6 casos

**Por Actor:**

- Administrador: 40 casos de uso
- Usuario Propietario: 6 casos de uso
- Caballerizo: 3 casos de uso
- Sistema: 6 casos de uso

**Pantallas Totales:**

- Admin: 36 pantallas
- Usuario: 6 pantallas
- Caballerizo: 4 pantallas
- Autenticación: 2 pantallas
- **Total: 48 pantallas**

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Frontend:**

- React 18+ con TypeScript
- React Router v6 para navegación
- Tailwind CSS para estilos
- Radix UI para componentes
- Vite como build tool

### **Backend:**

- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Autenticación con JWT
- Storage para archivos

### **Funcionalidades Especiales:**

- Sincronización multi-pestaña con BroadcastChannel
- Optimización táctil para móviles
- Sistema de roles y permisos
- Gestión automática de tokens
- PWA-ready

---

## 📝 NOTAS PARA TESIS

Este sistema representa una solución integral para la gestión de un club hípico, abarcando:

1. **Gestión Administrativa Completa**
2. **Control Veterinario y Sanitario**
3. **Gestión Nutricional Especializada**
4. **Control Financiero y Contable**
5. **Gestión de Recursos Humanos**
6. **Portal de Autogestión para Propietarios**
7. **Sistema de Tareas para Personal Operativo**

El sistema implementa **arquitectura de microservicios** con separación clara de responsabilidades, **seguridad multi-capa**, y **experiencia de usuario optimizada** para diferentes tipos de dispositivos y roles.
