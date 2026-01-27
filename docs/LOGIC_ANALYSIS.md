# Análisis Detallado de Lógica app.js → TypeScript + Prisma

## 1. ESTRUCTURA GENERAL DE app.js

### 1.1 Storage Layer (localStorage)
**Responsabilidad:** Persistencia de datos en cliente
**Transformación:** → API tRPC + Prisma (servidor)

#### Datos iniciales:
```javascript
- users: [{id, username, password}, ...]         → User model
- projects: [{id, name, description}, ...]        → Project model
- tasks: [{id, title, description, status, priority, projectId, assignedTo, dueDate, estimatedHours, actualHours, createdBy}, ...] → Task model
- comments: [{id, taskId, userId, commentText, createdAt}, ...]  → Comment model
- history: [{id, taskId, userId, action, oldValue, newValue, timestamp}, ...]  → History model
- notifications: [{id, userId, message, type, read, createdAt}, ...]  → Notification model
- nextTaskId, nextProjectId: Contadores      → Autoincrementales en Prisma (AUTOINCREMENT)
```

### 1.2 Estado Global (aplicación)
```javascript
currentUser     → Sesión en servidor (NextAuth)
selectedTaskId  → Estado en componente React (useState)
```

---

## 2. ANÁLISIS POR SECCIÓN FUNCIONAL

### 2.1 AUTENTICACIÓN (Login/Logout)

**Lógica actual (app.js):**
```javascript
login() {
  ✓ Validar username/password
  ✓ Buscar usuario en Storage.users
  ✓ Si existe → currentUser = user, mostrar mainPanel
  ✗ Si no existe → mostrar alert
  ✓ Cargar datos (loadTasks, loadProjects)
  ✓ Actualizar stats
}

logout() {
  ✓ Limpiar currentUser
  ✓ Limpiar selectedTaskId
  ✓ Mostrar loginPanel
}
```

**Transformación a TypeScript:**
- **Ubicación:** `src/app/login/page.tsx` (YA EXISTE)
- **Cambios necesarios:**
  - Usar NextAuth en lugar de verificación manual
  - Usar `useRouter` para redirecciones
  - Usar `localStorage` para guardar sesión (TEMPORAL) o cookies
  - Validar credenciales contra DB mediante API route

**Mapeo de datos:**
```typescript
// Cliente
interface LoginForm {
  username: string;
  password: string;
}

// Servidor
User.findUnique({
  where: { username: loginForm.username }
})
// Comparar password (en producción: bcrypt)
```

---

### 2.2 GESTIÓN DE PROYECTOS (ProjectTab)

**Lógica actual (app.js):**
```javascript
// LECTURA
getProjects() → Array de todos los proyectos

loadProjects() → Llena select#taskProject y select#searchProject
                 Carga lista en ProjectsTable

loadProjectsTable() → Renderiza tabla con: id, name, description
                      Click en fila → llena form para edición

// CREACIÓN
addProject() {
  ✓ Validar name (requerido)
  ✓ Crear objeto project
  ✓ Generar ID auto-incrementado
  ✓ Push a Storage
  ✓ Actualizar nextProjectId
  ✓ Recargar UI (loadProjects, loadProjectsTable)
  ✓ Limpiar form
}

// ACTUALIZACIÓN
updateProject(id, project) {
  ✓ Buscar por ID en array
  ✓ Reemplazar objeto
  ✓ Guardar en Storage
  ✓ Recargar UI
}

// ELIMINACIÓN
deleteProject(id) {
  ✓ Confirmar con usuario
  ✓ Filtrar array para eliminar
  ✓ Guardar en Storage
  ✓ Recargar UI
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface ProjectFormData {
  name: string;
  description?: string;
}

interface ProjectWithDetails extends Project {
  _count?: {
    tasks: number;
  }
}

// ESTADO DEL COMPONENTE
const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
const [formData, setFormData] = useState<ProjectFormData>({
  name: '',
  description: ''
});
const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);

// FUNCIONES tRPC (que crearemos)
- projects.list() → GET all projects for current user
- projects.create(data) → POST create project
- projects.update(id, data) → PUT update project
- projects.delete(id) → DELETE project (cascade delete tasks/comments/history)
- projects.getWithCount(id) → GET project with task count
```

**Cambios clave:**
- ✅ `createdBy` es REQUERIDO en Prisma (User relación) → obtener desde sesión
- ✅ Sin contador manual (`nextProjectId`) → autoincrement en DB
- ✅ Sin localStorage → queries tRPC + estado React
- ✅ Validación con Zod en tRPC router

---

### 2.3 GESTIÓN DE TAREAS (TaskTab)

**Lógica actual (app.js) - MÁS COMPLEJA:**

```javascript
// LECTURA
getTasks() → Array de todas las tareas

loadTasks() {
  ✓ Obtener tasks del Storage
  ✓ Obtener projects y users para joins
  ✓ Renderizar tabla con: id, title, status, priority, project, assignedTo, dueDate
  ✓ Click en fila → selectTask(id) para edición
}

selectTask(id) {
  ✓ Guardar selectedTaskId
  ✓ Buscar tarea en Storage
  ✓ Llenar form con datos de la tarea
  ✓ Poblador selects para: status, priority, project, assignedTo
  ✓ Llenar: dueDate, estimatedHours
}

// CREACIÓN
addTask() {
  ✓ Validar title (requerido)
  ✓ Obtener valores del form
  ✓ Crear objeto task con:
    - title, description, status, priority
    - projectId, assignedTo, dueDate, estimatedHours
    - actualHours = 0
    - createdBy = currentUser.id
    - createdAt, updatedAt = now()
  ✓ Generar ID auto-incrementado
  ✓ Push a Storage
  ✓ Crear entrada en History: action=CREATED
  ✓ Si assignedTo > 0 → crear Notification: "Nueva tarea asignada: {title}"
  ✓ Recargar UI
  ✓ Limpiar form
  ✓ updateStats()
}

// ACTUALIZACIÓN
updateTask(id, task) {
  ✓ Validar selectedTaskId existe
  ✓ Obtener oldTask para comparaciones
  ✓ Crear objeto task actualizado
  ✓ Comparaciones para historial:
    - Si status cambió → History: action=STATUS_CHANGED
    - Si title cambió → History: action=TITLE_CHANGED
  ✓ Guardar en Storage
  ✓ Si assignedTo > 0 → crear Notification: "Tarea actualizada: {title}"
  ✓ Recargar UI
  ✓ updateStats()
}

// ELIMINACIÓN
deleteTask(id) {
  ✓ Validar selectedTaskId
  ✓ Confirmar con usuario
  ✓ Crear History: action=DELETED, oldValue=title, newValue=""
  ✓ Eliminar de Storage
  ✓ Recargar UI
  ✓ updateStats()
}

// LIMPIEZA
clearTaskForm() {
  ✓ Vaciar todos los campos del form
  ✓ Resetear selectedTaskId = null
  ✓ Resetear dropdowns a índice 0
}

// ESTADÍSTICAS
updateStats() {
  ✓ Contar tasks totales
  ✓ Contar tasks completadas (status === 'Completada')
  ✓ Contar tasks pendientes (status !== 'Completada')
  ✓ Contar high priority (priority === 'Alta' || 'Crítica')
  ✓ Contar vencidas: dueDate < now && status !== 'Completada'
  ✓ Mostrar en stats: Total, Completadas, Pendientes, Alta Prioridad, Vencidas
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;  // enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  priority: TaskPriority;  // enum: LOW, MEDIUM, HIGH, CRITICAL
  projectId: number;
  assignedToId?: string;  // User.id (null si sin asignar)
  dueDate?: Date;
  estimatedHours: number;
}

interface TaskWithRelations extends Task {
  project: Project;
  assignedTo: User | null;
  createdBy: User;
  comments: Comment[];
  history: History[];
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  overdue: number;
}

// ESTADO DEL COMPONENTE
const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
const [formData, setFormData] = useState<TaskFormData>({
  title: '',
  description: '',
  status: TaskStatus.PENDING,
  priority: TaskPriority.MEDIUM,
  projectId: 0,
  assignedToId: undefined,
  dueDate: undefined,
  estimatedHours: 0
});
const [stats, setStats] = useState<TaskStats>({
  total: 0,
  completed: 0,
  pending: 0,
  highPriority: 0,
  overdue: 0
});

// FUNCIONES tRPC
- tasks.list() → GET all tasks with relations
- tasks.create(data) → POST create task + auto-create History entry
- tasks.update(id, data) → PUT update task + compare fields + auto-create History entries
- tasks.delete(id) → DELETE task + auto-create History entry
- tasks.getStats() → GET aggregated stats (total, completed, pending, highPriority, overdue)
```

**Cambios clave respecto a app.js:**
- ✅ `selectedTaskId` → estado del componente, no global
- ✅ Conversión de strings de status a ENUM (Prisma)
  - Old: 'Pendiente', 'Completada', 'En Progreso'
  - New: TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS
- ✅ `assignedTo` puede ser null → `assignedToId?: string`
- ✅ `createdBy` es relación con User, no solo ID
- ✅ `actualHours` iniciado en 0, se puede editar luego
- ✅ Historia automática: cada cambio crea entry en History table
- ✅ Notificaciones automáticas: si `assignedToId` cambia, crear Notification
- ✅ Stats calculado en servidor con agregaciones

---

### 2.4 COMENTARIOS (CommentTab)

**Lógica actual (app.js):**
```javascript
// LECTURA
getComments() → Array de comentarios

addComment() {
  ✓ Obtener taskId del input
  ✓ Obtener text del textarea
  ✓ Validar ambos
  ✓ Crear object: {taskId, userId, commentText}
  ✓ Generar ID auto-incrementado
  ✓ Push a Storage
  ✓ Limpiar textarea
  ✓ loadComments() para refrescar
}

loadComments() {
  ✓ Obtener taskId del input
  ✓ Si no existe → mostrar "Ingresa un ID de tarea"
  ✓ Filtrar comentarios por taskId
  ✓ Obtener users para lookup
  ✓ Formatear en textarea:
    [timestamp] username: commentText
    ---
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface CommentFormData {
  taskId: number;
  text: string;
}

interface CommentWithUser extends Comment {
  user: User;
  task: Task;
}

// ESTADO
const [comments, setComments] = useState<CommentWithUser[]>([]);
const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
const [commentText, setCommentText] = useState('');

// FUNCIONES tRPC
- comments.create(taskId, text) → POST create comment
- comments.getByTask(taskId) → GET comments for task with user relation
- comments.delete(id) → DELETE comment

// AUTO-CREAR NOTIFICATION
- Cuando se agrega comentario → crear Notification para assignedTo user
  "Nuevo comentario en tarea: {taskTitle}"
```

**Cambios clave:**
- ✅ `commentText` → `text` (nombre simplificado)
- ✅ `userId` siempre es currentUser (from session)
- ✅ Textarea es read-only display, input form es por debajo
- ✅ Auto-increment en DB

---

### 2.5 HISTORIAL (HistoryTab)

**Lógica actual (app.js):**
```javascript
// LECTURA
getHistory() → Array de historial completo

loadHistory(taskId) {
  ✓ Obtener taskId del input
  ✓ Filtrar history por taskId
  ✓ Obtener users para lookup
  ✓ Formatear en textarea:
    timestamp - action
    Usuario: username
    Antes: oldValue
    Después: newValue
    ---
}

loadAllHistory() {
  ✓ Obtener todos los history
  ✓ Tomar últimos 100 entries, reverse (más recientes primero)
  ✓ Mismo formato de display
  ✓ Incluir "Tarea #taskId" en cada línea
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface HistoryEntry extends History {
  user: User;
  task: Task;
}

// ESTADO
const [history, setHistory] = useState<HistoryEntry[]>([]);
const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
const [showAll, setShowAll] = useState(false);

// FUNCIONES tRPC
- history.getByTask(taskId) → GET history for specific task with user/task relations
- history.getAll(limit?) → GET all history (most recent, limit 100)
- history.create() → AUTO called by task router when task created/updated/deleted

// AUTO-GENERADO EN SERVIDOR
- Task create → History entry: action=CREATED, newValue=title
- Task update → History entry: action=STATUS_CHANGED si cambió status
- Task update → History entry: action=TITLE_CHANGED si cambió title
- Task update → History entry: action=ASSIGNED si cambió assignedTo
- Task update → History entry: action=PRIORITY_CHANGED si cambió priority
- Task update → History entry: action=DUE_DATE_CHANGED si cambió dueDate
- Task delete → History entry: action=DELETED, oldValue=title, newValue=""
```

**Cambios clave:**
- ✅ Historia es READ-ONLY (no se edita, solo se ve)
- ✅ Generada automáticamente en servidor por task mutations
- ✅ Los timestamps vienen del servidor (NOW())
- ✅ Historia completa vs por tarea (botones diferentes)
- ✅ Mostrar comparaciones: Antes vs Después

---

### 2.6 NOTIFICACIONES (NotificationTab)

**Lógica actual (app.js):**
```javascript
// LECTURA
getNotifications() → Array de notificaciones

addNotification(notification) {
  ✓ Crear object: {userId, message, type, read=false, createdAt}
  ✓ Generar ID auto-incrementado
  ✓ Push a Storage
  ✓ Auto-llamado por addTask, updateTask, addComment
}

loadNotifications() {
  ✓ Filtrar por currentUser.id y read=false
  ✓ Formatear:
    • [type] message (createdAt)
}

markNotificationsRead(userId) {
  ✓ Obtener notificaciones de usuario
  ✓ Setear read=true para todas
  ✓ Guardar en Storage
  ✓ Recargar display
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface NotificationWithTask extends Notification {
  user: User;
  // Podría tener relación task si se agrega
}

// ESTADO
const [notifications, setNotifications] = useState<NotificationWithTask[]>([]);
const [unreadCount, setUnreadCount] = useState(0);

// FUNCIONES tRPC
- notifications.getUnread() → GET unread notifications for current user
- notifications.markAsRead(id) → PATCH update notification read=true
- notifications.markAllAsRead() → PATCH update all notifications read=true for current user
- notifications.create() → AUTO called by task/comment routers

// AUTO-GENERADO EN SERVIDOR
- addTask con assignedTo → Notification: type=TASK_ASSIGNED, "Nueva tarea: {title}"
- updateTask con assignedTo → Notification: type=TASK_UPDATED, "Tarea actualizada: {title}"
- addComment en task → Notification: type=COMMENT_ADDED, "Nuevo comentario en: {taskTitle}"
- updateTask con status=COMPLETED → Notification: type=TASK_COMPLETED, "Tarea completada: {title}"
```

**Cambios clave:**
- ✅ Notificaciones READ-ONLY para visualización
- ✅ Generar automáticamente en servidor
- ✅ Mostrar solo NO LEÍDAS por defecto
- ✅ Botón para marcar como leídas
- ✅ Contador de no leídas

---

### 2.7 BÚSQUEDA (SearchTab)

**Lógica actual (app.js):**
```javascript
searchTasks() {
  ✓ Obtener filtros:
    - searchText (input, case-insensitive)
    - statusFilter (select)
    - priorityFilter (select)
    - projectFilter (select)
  ✓ Filtrar tasks con AND logic:
    - Si searchText → buscar en title.toLowerCase() O description.toLowerCase()
    - Si statusFilter → task.status === statusFilter
    - Si priorityFilter → task.priority === priorityFilter
    - Si projectFilter > 0 → task.projectId === projectFilter
  ✓ Renderizar tabla con: id, title, status, priority, project
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface SearchFilters {
  text: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  projectId: number | 'all';
}

interface SearchResult extends Task {
  project: Project;
}

// ESTADO
const [filters, setFilters] = useState<SearchFilters>({
  text: '',
  status: 'all',
  priority: 'all',
  projectId: 'all'
});
const [results, setResults] = useState<SearchResult[]>([]);
const [searching, setSearching] = useState(false);

// FUNCIONES tRPC
- tasks.search(filters) → POST search with AND conditions
  - WHERE clause:
    AND [
      {OR: [
        title: {contains: text, mode: 'insensitive'}
        description: {contains: text, mode: 'insensitive'}
      ]} (if text provided)
      status: filterValue (if status !== 'all')
      priority: filterValue (if priority !== 'all')
      projectId: filterValue (if projectId !== 'all')
    ]
```

**Cambios clave:**
- ✅ Client-side: inputs + botón "Buscar"
- ✅ Server-side: Prisma WHERE con AND conditions
- ✅ 'all' significa no aplicar ese filtro
- ✅ case-insensitive en Prisma: mode: 'insensitive'

---

### 2.8 REPORTES (ReportTab)

**Lógica actual (app.js):**
```javascript
generateReport(type) {
  ✓ Si type === 'tasks':
    - Contar tareas por status
    - Mostrar: "status: count tareas"
  
  ✓ Si type === 'projects':
    - Por cada proyecto → contar tareas
    - Mostrar: "projectName: count tareas"
  
  ✓ Si type === 'users':
    - Por cada usuario → contar tareas asignadas
    - Mostrar: "username: count tareas asignadas"
}

exportCSV() {
  ✓ Header: "ID,Título,Estado,Prioridad,Proyecto"
  ✓ Por cada task:
    - {id},{title},{status},{priority},{projectName}
  ✓ Descargar archivo CSV
}
```

**Transformación a TypeScript + Prisma:**

```typescript
// TIPOS
interface TaskStatusReport {
  status: TaskStatus;
  count: number;
}

interface ProjectTaskReport {
  projectId: number;
  projectName: string;
  count: number;
}

interface UserTaskReport {
  userId: string;
  username: string;
  count: number;
}

// ESTADO
const [reportType, setReportType] = useState<'tasks' | 'projects' | 'users' | null>(null);
const [reportData, setReportData] = useState<string>('');
const [loading, setLoading] = useState(false);

// FUNCIONES tRPC
- reports.tasksByStatus() → GET count tasks grouped by status
- reports.tasksByProject() → GET count tasks grouped by project with project details
- reports.tasksByUser() → GET count tasks assigned grouped by user with user details
- reports.exportTasksCSV() → GET all tasks formatted as CSV string (descargable en cliente)
```

**Cambios clave:**
- ✅ Reportes READ-ONLY, sin edición
- ✅ Usar agregaciones Prisma: groupBy, count
- ✅ CSV generado en servidor, descargado en cliente
- ✅ Formateo de datos en servidor

---

## 3. MAPEO DE ENUMS

### Status Conversión
```
Legacy (localStorage)     →  Prisma Enum (TaskStatus)
'Pendiente'              →  TaskStatus.PENDING
'En Progreso'            →  TaskStatus.IN_PROGRESS
'Completada'             →  TaskStatus.COMPLETED
'Cancelada'              →  TaskStatus.CANCELLED
```

### Priority Conversión
```
Legacy (localStorage)     →  Prisma Enum (TaskPriority)
'Baja'                   →  TaskPriority.LOW
'Media'                  →  TaskPriority.MEDIUM
'Alta'                   →  TaskPriority.HIGH
'Crítica'                →  TaskPriority.CRITICAL
```

### History Action Conversión
```
Legacy (app.js)          →  Prisma Enum (HistoryAction)
'CREATED'                →  HistoryAction.CREATED
'STATUS_CHANGED'         →  HistoryAction.STATUS_CHANGED
'TITLE_CHANGED'          →  HistoryAction.TITLE_CHANGED
(implicit ASSIGNED)      →  HistoryAction.ASSIGNED
(implicit PRIORITY)      →  HistoryAction.PRIORITY_CHANGED
(implicit DUE_DATE)      →  HistoryAction.DUE_DATE_CHANGED
'DELETED'                →  HistoryAction.DELETED
```

### Notification Type Conversión
```
Legacy (app.js)          →  Prisma Enum (NotificationType)
'task_assigned'          →  NotificationType.TASK_ASSIGNED
'task_updated'           →  NotificationType.TASK_UPDATED
(implicit comment)       →  NotificationType.COMMENT_ADDED
(implicit completed)     →  NotificationType.TASK_COMPLETED
```

---

## 4. FLUJOS DE DATOS (ANTES vs DESPUÉS)

### ANTES (localStorage)
```
Cliente             Storage (localStorage)        UI
  ↓                         ↓                      ↓
form input → addTask() → JSON.stringify → tasks array → loadTasks() → table display
                          ↑
                    updateStats()
```

### DESPUÉS (tRPC + Prisma)
```
Cliente (React)          Server (Next.js)                          Database (PostgreSQL)
  ↓                           ↓                                           ↓
form input → trpc mutation → tRPC router (Zod validation) → Prisma transaction → INSERT/UPDATE
                              ↓                                           ↑
                          Compare old vs new → Create History entry ← Reads old task
                              ↓
                        Create Notification
                              ↓
                        Return updated task
  ↓
setState(updated task)
  ↓
Component re-renders
```

---

## 5. VALIDACIONES CON ZOD (Por Tab)

### ProjectTab
```typescript
const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name required").max(255),
  description: z.string().max(1000).optional()
});

const UpdateProjectSchema = CreateProjectSchema.extend({
  id: z.number().int().positive()
});
```

### TaskTab
```typescript
const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title required").max(500),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  projectId: z.number().int().positive("Select project"),
  assignedToId: z.string().optional(),
  dueDate: z.date().optional(),
  estimatedHours: z.number().nonnegative("Hours must be >= 0")
});

const UpdateTaskSchema = CreateTaskSchema.extend({
  id: z.number().int().positive()
});
```

### CommentTab
```typescript
const CreateCommentSchema = z.object({
  taskId: z.number().int().positive("Task required"),
  text: z.string().min(1, "Comment required").max(5000)
});
```

### SearchTab
```typescript
const SearchTasksSchema = z.object({
  text: z.string().max(500).optional(),
  status: z.enum(['all']).or(z.nativeEnum(TaskStatus)).optional(),
  priority: z.enum(['all']).or(z.nativeEnum(TaskPriority)).optional(),
  projectId: z.enum(['all']).or(z.number().int().positive()).optional()
});
```

---

## 6. SESIÓN Y AUTENTICACIÓN

**Cambios importantes:**

```typescript
// En cada tRPC procedure, obtener usuario actual:
import { getServerSession } from "next-auth/next";

export const protectedProcedure = t.procedure
  .use(async (opts) => {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      });
    }
    
    return opts.next({
      ctx: {
        userId: session.user.id
      }
    });
  });

// Uso en router:
export const projectRouter = router({
  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.project.create({
        data: {
          ...input,
          createdById: ctx.userId  // Siempre current user
        }
      });
    })
});
```

---

## 7. TRANSACCIONES PARA OPERACIONES COMPLEJAS

### Scenario: UpdateTask
```typescript
// ANTES: updateTask() solo actualiza
// DESPUÉS: Debe:
//   1. Comparar valores antiguos vs nuevos
//   2. Crear entries de History
//   3. Crear Notifications si es necesario
//   4. Actualizar Task

prisma.$transaction(async (tx) => {
  // 1. Obtener task antigua
  const oldTask = await tx.task.findUnique({ where: { id: taskId } });
  
  // 2. Actualizar task
  const updatedTask = await tx.task.update({
    where: { id: taskId },
    data: newData,
    include: { project: true, assignedTo: true, createdBy: true }
  });
  
  // 3. Comparar y crear History entries
  if (oldTask.status !== updatedTask.status) {
    await tx.history.create({
      data: {
        taskId,
        userId,
        action: 'STATUS_CHANGED',
        oldValue: oldTask.status,
        newValue: updatedTask.status
      }
    });
  }
  
  // 4. Crear Notifications
  if (updatedTask.assignedToId && updatedTask.assignedToId !== oldTask.assignedToId) {
    await tx.notification.create({
      data: {
        userId: updatedTask.assignedToId,
        message: `Task assigned: ${updatedTask.title}`,
        type: 'TASK_ASSIGNED'
      }
    });
  }
  
  return updatedTask;
});
```

---

## 8. RESUMEN: CAMBIOS POR TAB

| Tab | Cambio Principal | Complejidad | Dependencias |
|-----|------------------|------------|--------------|
| **ProjectTab** | CRUD simple, sin historial | ⭐ | User (sesión), Project model |
| **TaskTab** | CRUD + History + Notifications automáticas | ⭐⭐⭐ | User, Project, Task, History, Notification |
| **CommentTab** | Crear + Listar, auto-notify | ⭐⭐ | User, Task, Comment, Notification |
| **HistoryTab** | Read-only, auto-generated | ⭐ | History model, User relations |
| **NotificationTab** | Read-only, mark as read | ⭐ | Notification model, User relations |
| **SearchTab** | Filtrado con WHERE conditions | ⭐⭐ | Task, Project models, Prisma search |
| **ReportTab** | Agregaciones y reportes | ⭐⭐ | Aggregations (groupBy, count) |

---

## 9. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **ProjectTab** → Más simple, no hay dependencias de historia
2. **TaskTab** → Tarea central, pero depende de Project
3. **CommentTab** → Depende de Task router
4. **HistoryTab** → Depende de Task router (auto-generated)
5. **NotificationTab** → Depende de Task/Comment routers (auto-generated)
6. **SearchTab** → Depende de Task router, simple filtrado
7. **ReportTab** → Agregaciones, sin escritura

---

## 10. PUNTOS CRÍTICOS PARA NO ROMPER LÓGICA

### ✅ HACER:
1. Cada mutation en tRPC debe usar `protectedProcedure` (verificar usuario)
2. Historia debe generarse EN EL SERVIDOR (no en cliente)
3. Notificaciones deben crear PARA EL USUARIO ASIGNADO, no para el que hace la acción
4. Usar transacciones para operaciones que tocan múltiples tables (Task + History + Notification)
5. Validar con Zod ANTES de enviar a DB
6. Comparar valores OLD vs NEW en task updates
7. Usar enums de Prisma, no strings
8. IDs de User son UUIDS en Prisma (cuid), no números
9. actualHours es separado de estimatedHours
10. dueDate puede ser null

### ❌ EVITAR:
1. ❌ Generar Historia en cliente
2. ❌ Crear Notification para currentUser (solo para assignedTo)
3. ❌ Usar strings en lugar de enums
4. ❌ Asumir User.id es número (es string/uuid)
5. ❌ Modificar History (es audit log inmutable)
6. ❌ Olvidar cascada de eliminación (si Task se elimina → Comment, History también)
7. ❌ No validar entrada con Zod
8. ❌ Mezclar lógica de negocio en componentes (debe estar en router)

---

## 11. EJEMPLO: FLUJO COMPLETO DE addTask()

```typescript
// CLIENTE (TaskTab.tsx)
const handleAddTask = async (formData: TaskFormData) => {
  try {
    const newTask = await trpc.tasks.create.mutate(formData);
    setTasks([...tasks, newTask]);
    setFormData(initialFormData);
    toast.success("Task created");
  } catch (error) {
    toast.error(error.message);
  }
};

// SERVIDOR (routers/task.ts)
export const taskRouter = router({
  create: protectedProcedure
    .input(CreateTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.$transaction(async (tx) => {
        // 1. Crear Task
        const task = await tx.task.create({
          data: {
            ...input,
            createdById: ctx.userId
          },
          include: { project: true, assignedTo: true, createdBy: true }
        });
        
        // 2. Crear History entry
        await tx.history.create({
          data: {
            taskId: task.id,
            userId: ctx.userId,
            action: 'CREATED',
            oldValue: '',
            newValue: task.title
          }
        });
        
        // 3. Si assignedTo, crear Notification
        if (input.assignedToId) {
          await tx.notification.create({
            data: {
              userId: input.assignedToId,
              message: `New task assigned: ${task.title}`,
              type: 'TASK_ASSIGNED'
            }
          });
        }
        
        return task;
      });
    })
});

// DB (Prisma)
- INSERT INTO Task (title, description, status, priority, projectId, assignedToId, createdById, dueDate, estimatedHours)
- INSERT INTO History (taskId, userId, action, oldValue, newValue, timestamp)
- INSERT INTO Notification (userId, message, type, read, createdAt)
```

---

## CONCLUSIÓN

La migración requiere cambiar la mentalidad de "localStorage en cliente" a "API en servidor".
Pero la LÓGICA DE NEGOCIO es la misma:
- Usuarios crean/editan/eliminan tareas
- Sistema registra cambios en Historia
- Sistema notifica usuarios asignados
- Sistema permite búsqueda y reportes

Lo que cambia es DÓNDE ocurre (servidor en lugar de cliente) y HOW (tRPC + Prisma en lugar de localStorage).

