# Notificaciones — Arquitectura y Flujo

## Resumen
Este documento describe cómo se generan, procesan y exponen las notificaciones en la aplicación.

## Componentes principales
- **Middleware:** middleware.ts — Detecta la primera petición a `/api/*` y hace un `GET /api/cron/init` para forzar la ejecución del cron en el runtime Node (evita ejecutar cron en edge).
- **Ruta de arranque del cron:** src/app/api/cron/init/route.ts — Endpoint que recibe la petición del middleware y delega en el inicializador del cron.
- **Inicializador de cron:** src/server/cron/init.ts — Define y programa jobs usando `node-cron` (por ejemplo, cada minuto) y ejecuta `processSystemEvents()` inmediatamente al iniciar.
- **Procesador de eventos:** src/server/cron/processEvents.ts — Lógica que detecta/recoge eventos pendientes y crea o despacha notificaciones (escribe en la base de datos o encola envíos a servicios externos).
- **Router API:** src/server/api/routers/notification.ts — tRPC protegido que expone las operaciones que consume el cliente (`getUnread`, `getAll`, `getUnreadCount`, `getByType`, `markAsRead`, `markAllAsRead`, `delete`). Usa `ctx.db.notification` (Prisma) y `ctx.session` para control de acceso.
- **Modelo de datos:** `notification` definido en `prisma/schema.prisma` — persistencia de notificaciones.

## Flujo paso a paso
1. Primera petición a `/api/*` → `middleware.ts` detecta y realiza `GET /api/cron/init`.
2. La ruta `src/app/api/cron/init/route.ts` invoca `initializeCronJobs()` en el servidor.
3. `initializeCronJobs()` en `src/server/cron/init.ts`:
   - Programa un job con `node-cron` (p. ej. `* * * * *` = cada minuto).
   - Ejecuta `processSystemEvents()` inmediatamente para no esperar el primer tick del cron.
4. `processSystemEvents()` (en `src/server/cron/processEvents.ts`):
   - Recupera eventos/tareas pendientes del sistema.
   - Crea registros en la tabla `notification` (Prisma) o encola envíos a servicios externos (email, push, etc.).
   - Marca eventos como procesados y maneja reintentos/errores según la lógica implementada.
5. Los clientes/usuarios:
   - Consultan notificaciones vía tRPC llamando al router `notificationRouter`.
   - Marcan como leídas o eliminan notificaciones a través de las mutaciones exponiendo la lógica de acceso.

## Consideraciones importantes
- **Ejecución en Node vs Edge:** La llamada desde el `middleware` asegura que `initializeCronJobs()` se ejecute en un runtime Node (no en edge), evitando limitaciones del entorno Edge.
- **Idempotencia:** `initializeCronJobs()` evita doble inicialización usando una variable local (`cronJob`).
- **Despliegues con múltiples instancias:** Si la app corre en varias instancias, cada instancia arrancará su propio cron. Si se necesita ejecución única por clúster, implementar un lock distribuido (Redis, fila DB, etc.).
- **Observabilidad:** Añadir logs y métricas para monitorizar ejecuciones, errores y eventos no procesados.
- **Escalabilidad:** Para cargas altas, considerar mover el procesamiento a workers/queues (BullMQ, RabbitMQ, etc.) en lugar de depender únicamente de `node-cron`.
- **Tiempo real:** Para notificaciones en tiempo real, añadir un mecanismo push (WebSocket/SSE/Pusher); el router tRPC seguirá siendo la fuente persistente.

## Recomendaciones
- Añadir tests unitarios e integración para `processSystemEvents()` que simulen eventos y verifiquen escrituras en BD.
- Implementar bloqueo distribuido si se requiere un único procesador por entorno.
- Exponer métricas (conteo de procesados, errores, latencias) y configurar alertas.
- Considerar un endpoint de health-check para verificar el estado del cron/processor.

---

Documento creado automáticamente para servir de referencia rápida sobre el sistema de notificaciones.
