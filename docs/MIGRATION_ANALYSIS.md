# Análisis de Migración: localStorage → PostgreSQL con Prisma

## 1. Resumen Ejecutivo

El archivo `example/app.js` es una aplicación de gestión de tareas y proyectos que actualmente almacena todos los datos en `localStorage` del navegador. Esta migración requerirá:

- Crear **6 nuevos modelos Prisma**
- Establecer **relaciones uno-a-muchos y muchos-a-muchos** entre entidades
- Migrar la lógica de negocio del cliente al servidor (Next.js API routes/tRPC)
- Reemplazar localStorage con llamadas a base de datos

---

## 2. Análisis de Estructuras de Datos Actuales

### 2.1 Usuarios (`users`)

**Estructura actual:**
```javascript
{
  id: 1,
  username: 'admin',
  password: 'admin'
}
```

**Problemas identificados:**
- Contraseñas en texto plano (⚠️ CRÍTICO: no hacer esto)
- El esquema actual ya tiene `User` en Prisma

**Recomendación:** Usar modelo `User` existente, agregar campo `username`

---

### 2.2 Proyectos (`projects`)

**Estructura actual:**
```javascript
{
  id: 1,
  name: 'Proyecto Demo',
  description: 'Proyecto de ejemplo'
}
```

**Relaciones identificadas:**
- Un proyecto puede tener muchas tareas
- Un proyecto es creado por un usuario

**Proposición de modelo:**
```prisma
model Project {
  id        Int      @id @default(autoincrement())
  name      String
  description String?
  createdBy   User   @relation(fields: [createdById], references: [id])
  createdById String
  tasks     Task[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([createdById])
}
```

---

### 2.3 Tareas (`tasks`)

**Estructura actual:**
```javascript
{
  id: 1,
  title: 'Tarea 1',
  description: 'Descripción',
  status: 'Pendiente',           // Enum: Pendiente, Completada
  priority: 'Media',             // Enum: Baja, Media, Alta, Crítica
  projectId: 1,
  assignedTo: 1,                 // userId
  dueDate: '2024-01-31',
  estimatedHours: 8,
  actualHours: 0,
  createdBy: 1,                  // userId
  createdAt: '2024-01-20T10:00:00.000Z',
  updatedAt: '2024-01-20T10:00:00.000Z'
}
```

**Proposición de modelo:**
```prisma
enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

model Task {
  id             Int         @id @default(autoincrement())
  title          String
  description    String?
  status         TaskStatus  @default(PENDING)
  priority       TaskPriority @default(MEDIUM)
  
  project        Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId      Int
  
  assignedTo     User?       @relation("AssignedTasks", fields: [assignedToId], references: [id])
  assignedToId   String?
  
  createdBy      User        @relation("CreatedTasks", fields: [createdById], references: [id])
  createdById    String
  
  dueDate        DateTime?
  estimatedHours Float       @default(0)
  actualHours    Float       @default(0)
  
  comments       Comment[]
  history        History[]
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([projectId])
  @@index([assignedToId])
  @@index([createdById])
}
```

---

### 2.4 Comentarios (`comments`)

**Estructura actual:**
```javascript
{
  id: 1,
  taskId: 1,
  userId: 1,
  commentText: 'Mi comentario',
  createdAt: '2024-01-20T10:00:00.000Z'
}
```

**Proposición de modelo:**
```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    Int
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())

  @@index([taskId])
  @@index([userId])
}
```

---

### 2.5 Historial (`history`)

**Estructura actual:**
```javascript
{
  id: 1,
  taskId: 1,
  userId: 1,
  action: 'CREATED',             // CREATED, STATUS_CHANGED, TITLE_CHANGED, DELETED
  oldValue: '',
  newValue: 'Nuevo título',
  timestamp: '2024-01-20T10:00:00.000Z'
}
```

**Proposición de modelo:**
```prisma
enum HistoryAction {
  CREATED
  STATUS_CHANGED
  TITLE_CHANGED
  ASSIGNED
  PRIORITY_CHANGED
  DUE_DATE_CHANGED
  DELETED
}

model History {
  id        Int            @id @default(autoincrement())
  task      Task           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    Int
  user      User           @relation(fields: [userId], references: [id])
  userId    String
  action    HistoryAction
  oldValue  String?
  newValue  String?
  timestamp DateTime       @default(now())

  @@index([taskId])
  @@index([userId])
  @@index([timestamp])
}
```

---

### 2.6 Notificaciones (`notifications`)

**Estructura actual:**
```javascript
{
  id: 1,
  userId: 1,
  message: 'Nueva tarea asignada: Tarea 1',
  type: 'task_assigned',         // task_assigned, task_updated
  read: false,
  createdAt: '2024-01-20T10:00:00.000Z'
}
```

**Proposición de modelo:**
```prisma
enum NotificationType {
  TASK_ASSIGNED
  TASK_UPDATED
  COMMENT_ADDED
  TASK_COMPLETED
}

model Notification {
  id        Int              @id @default(autoincrement())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  message   String
  type      NotificationType
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId])
  @@index([read])
}
```

---

## 3. Cambios Necesarios al Modelo `User` Existente

**Schema actual (parcial):**
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
}
```

**Cambios propuestos:**
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  username      String?   @unique          // ← NUEVO
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  
  // ← NUEVAS RELACIONES
  projects      Project[]
  tasksCreated  Task[]       @relation("CreatedTasks")
  tasksAssigned Task[]       @relation("AssignedTasks")
  comments      Comment[]
  history       History[]
  notifications Notification[]
}
```

---

## 4. Relaciones Identificadas

| Relación | Tipo | Notas |
|----------|------|-------|
| User → Project | 1:N | Un usuario crea muchos proyectos |
| User → Task (creadas) | 1:N | Un usuario crea muchas tareas |
| User → Task (asignadas) | 1:N | Un usuario puede tener muchas tareas asignadas |
| User → Comment | 1:N | Un usuario hace muchos comentarios |
| User → History | 1:N | Un usuario genera muchos registros de historial |
| User → Notification | 1:N | Un usuario recibe muchas notificaciones |
| Project → Task | 1:N | Un proyecto tiene muchas tareas |
| Task → Comment | 1:N | Una tarea puede tener muchos comentarios |
| Task → History | 1:N | Una tarea tiene historial de cambios |

---

## 5. Esquema Prisma Completo (Propuesta)

```prisma
// Enums
enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum HistoryAction {
  CREATED
  STATUS_CHANGED
  TITLE_CHANGED
  ASSIGNED
  PRIORITY_CHANGED
  DUE_DATE_CHANGED
  DELETED
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_UPDATED
  COMMENT_ADDED
  TASK_COMPLETED
}

// Modelos
model Project {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([createdById])
}

model Task {
  id             Int         @id @default(autoincrement())
  title          String
  description    String?
  status         TaskStatus  @default(PENDING)
  priority       TaskPriority @default(MEDIUM)
  
  project        Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId      Int
  
  assignedTo     User?       @relation("AssignedTasks", fields: [assignedToId], references: [id])
  assignedToId   String?
  
  createdBy      User        @relation("CreatedTasks", fields: [createdById], references: [id])
  createdById    String
  
  dueDate        DateTime?
  estimatedHours Float       @default(0)
  actualHours    Float       @default(0)
  
  comments       Comment[]
  history        History[]
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  @@index([projectId])
  @@index([assignedToId])
  @@index([createdById])
}

model Comment {
  id        Int      @id @default(autoincrement())
  text      String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    Int
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())

  @@index([taskId])
  @@index([userId])
}

model History {
  id        Int            @id @default(autoincrement())
  task      Task           @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    Int
  user      User           @relation(fields: [userId], references: [id])
  userId    String
  action    HistoryAction
  oldValue  String?
  newValue  String?
  timestamp DateTime       @default(now())

  @@index([taskId])
  @@index([userId])
  @@index([timestamp])
}

model Notification {
  id        Int              @id @default(autoincrement())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  message   String
  type      NotificationType
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId])
  @@index([read])
}

// Actualizar User model (adicionar estas relaciones)
model User {
  // ... campos existentes ...
  
  projects      Project[]
  tasksCreated  Task[]       @relation("CreatedTasks")
  tasksAssigned Task[]       @relation("AssignedTasks")
  comments      Comment[]
  history       History[]
  notifications Notification[]
}
```

---

## 6. Funcionalidades a Migrar

### 6.1 Gestión de Tareas
- `addTask()` → Crear endpoint tRPC `task.create`
- `updateTask()` → Crear endpoint tRPC `task.update`
- `deleteTask()` → Crear endpoint tRPC `task.delete`
- `loadTasks()` → Crear endpoint tRPC `task.list`

### 6.2 Gestión de Proyectos
- `addProject()` → Crear endpoint tRPC `project.create`
- `updateProject()` → Crear endpoint tRPC `project.update`
- `deleteProject()` → Crear endpoint tRPC `project.delete`
- `loadProjects()` → Crear endpoint tRPC `project.list`

### 6.3 Gestión de Comentarios
- `addComment()` → Crear endpoint tRPC `comment.create`
- `loadComments()` → Crear endpoint tRPC `comment.list`

### 6.4 Historial y Notificaciones
- `addHistory()` → Lógica automática en actualización de tareas
- `addNotification()` → Lógica automática al asignar tareas
- `loadNotifications()` → Crear endpoint tRPC `notification.list`

### 6.5 Búsqueda y Reportes
- `searchTasks()` → Crear endpoint tRPC `task.search`
- `generateReport()` → Crear endpoint tRPC `report.generate`
- `exportCSV()` → Crear endpoint tRPC `task.exportCSV`

---

## 7. Consideraciones Importantes

### 7.1 Seguridad
- ⚠️ **NO almacenar contraseñas en texto plano** → Usar `next-auth` (ya configurado)
- Validar permisos de usuario en backend
- Sanitizar inputs en formularios

### 7.2 Autenticación
- El proyecto ya usa `next-auth` → Reutilizar
- Mapear `username` del formulario actual al modelo `User` de Prisma

### 7.3 Migración de Datos
- Crear script de migración para convertir datos de localStorage a BD
- O crear endpoint de "import" para usuarios existentes

### 7.4 Performance
- Agregar índices en campos frecuentemente filtrados (projectId, assignedToId, userId)
- Usar Prisma Select para traer solo campos necesarios

### 7.5 Validación
- Usar Zod o similar para validar datos en tRPC
- Validar enums (TaskStatus, TaskPriority, etc.)

---

## 8. Pasos de Implementación Recomendados

1. **Actualizar schema.prisma** con todos los nuevos modelos
2. **Crear migration** con Prisma Migrate
3. **Generar Prisma Client** con los nuevos tipos
4. **Crear routers tRPC** para cada entidad (project, task, comment, etc.)
5. **Actualizar UI** en `src/app/manager/` para consumir tRPC en lugar de localStorage
6. **Crear script de migración** de datos (opcional)
7. **Testing** de funcionalidades críticas

---

## 9. Archivos a Crear/Modificar

### Crear:
- `src/server/api/routers/project.ts` → Router tRPC para proyectos
- `src/server/api/routers/task.ts` → Router tRPC para tareas
- `src/server/api/routers/comment.ts` → Router tRPC para comentarios
- `src/server/api/routers/notification.ts` → Router tRPC para notificaciones
- `scripts/migrate-legacy-data.ts` → Script de migración (opcional)
- `src/app/manager/_components/` → Componentes React actualizados

### Modificar:
- `prisma/schema.prisma` → Agregar nuevos modelos
- `src/server/api/root.ts` → Agregar routers
- `src/app/manager/page.tsx` → Consumir tRPC

---

## 10. Línea de Tiempo Estimada

| Tarea | Estimado |
|-------|----------|
| Actualizar schema.prisma | 30 min |
| Crear migration | 15 min |
| Implementar routers tRPC | 2-3 horas |
| Actualizar UI/Manager | 2-3 horas |
| Testing y fixes | 1 hora |
| **TOTAL** | **~6-8 horas** |

---

## 11. Notas Finales

- Este es un proyecto complejo con múltiples entidades interconectadas
- La estrategia de usar tRPC es excelente para evitar creación manual de endpoints REST
- Se recomienda un refactor gradual: empezar por Proyectos → Tareas → Comentarios
- La autenticación ya está configurada con NextAuth, solo falta mapear username

**¿Listo para la implementación? Confirma y comenzaremos con los routers tRPC.**
