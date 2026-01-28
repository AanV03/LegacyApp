# Implementación futura del módulo "Equipos"

Este documento resume los pasos necesarios para convertir la página mockup en un módulo completamente funcional (backend, modelos, seguridad, tests).

1) Modelo de datos (Prisma / BD)
   - Team: id, name, description?, createdAt, updatedAt
   - User: (usar el modelo de usuarios ya existente) relación M:N con Team vía TeamMember
   - TeamMember: id, teamId, userId, role (ADMIN|MEMBER)
   - Task: id, title, description, status (open|in-progress|done), assigneeId (User), teamId, createdBy

2) Endpoints / API
   - GET /api/teams -> listar equipos del usuario (filtrado por membership/permiso)
   - POST /api/teams -> crear equipo (validar permisos, añadir miembros iniciales)
   - GET /api/teams/:id -> detalle (miembros, tareas)
   - POST /api/teams/:id/tasks -> crear tarea en equipo
   - PATCH /api/tasks/:id -> actualizar estado/assignee

3) Autorización
   - Solo usuarios autenticados pueden acceder.
   - Roles: `ADMIN` en equipo puede crear/editar miembros y tareas; `USER` puede ver y actualizar tareas asignadas.
   - Implementar checks en servidor (trpc/router o endpoints Next.js) y en UI para ocultar acciones.

4) Migraciones
   - Añadir tablas en `schema.prisma` y generar migración.
   - Probar con datos semilla para equipos y tareas.

5) Integración con UI
   - Reemplazar datos mock por llamadas a la API.
   - Implementar formularios con validación y manejo de errores.
   - Usar SWR/React Query/trpc para cache y revalidación.

6) Notificaciones y actividad
   - Opcional: eventos en tiempo real (WebSocket) o polling para notificaciones de tareas nuevas/actualizadas.

7) Tests
   - Tests de unidad para lógica de permisos y servicios.
   - Tests de integración para endpoints y migraciones.

8) Checklist de despliegue
   - Revisar índices DB para consultas por teamId y userId.
   - Documentar API y permisos.
   - Añadir e2e tests si procede.

---

Prioridad recomendada: crear modelos + endpoints básicos -> integrar UI -> permisos -> notificaciones.
