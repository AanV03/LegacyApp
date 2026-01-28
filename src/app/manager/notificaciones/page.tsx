"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Clipboard, Folder, MessageSquare, Trash } from "lucide-react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type NotificationType = "TASK_ASSIGNED" | "TASK_UPDATED" | "COMMENT_ADDED" | "TASK_COMPLETED" | "PROJECT_CREATED" | "PROJECT_DELETED" | "TASK_CREATED" | "TASK_DELETED" | "TASK_STATUS_CHANGED";

export default function NotificationTab() {
    const [showUnreadOnly, setShowUnreadOnly] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState<"all" | "tasks" | "projects" | "comments">("all");

    const { data: unreadNotifications = [], refetch: refetchUnread } =
        api.notification.getUnread.useQuery();
    const { data: allNotifications = [], refetch: refetchAll } =
        api.notification.getAll.useQuery({ limit: 50 });
    const { data: me } = api.user.me.useQuery();
    const isAdmin = !!(me?.role === "ADMIN" || me?.roles?.includes?.("ADMIN"));
    const { data: unreadCountData } = api.notification.getUnreadCount.useQuery();
    const unreadCount = unreadCountData?.unreadCount ?? 0;

    const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
        onSuccess: () => {
            void refetchUnread();
            void refetchAll();
            toast.success("Marcadas como leídas");
        },
        onError: (error) => toast.error(error.message ?? "Error al marcar"),
    });

    const deleteNotificationMutation = api.notification.delete.useMutation({
        onSuccess: () => {
            void refetchUnread();
            void refetchAll();
            toast.success("Notificación eliminada");
        },
        onError: (error) => toast.error(error.message ?? "Error al eliminar"),
    });

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [selectedNotifId, setSelectedNotifId] = useState<number | null>(null);

    const handleOpenConfirm = (id: number) => {
        setSelectedNotifId(id);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedNotifId) return;
        await deleteNotificationMutation.mutateAsync({ id: selectedNotifId });
        setConfirmDeleteOpen(false);
        setSelectedNotifId(null);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsReadMutation.mutateAsync();
    };

    const notifications = showUnreadOnly ? unreadNotifications : allNotifications;
    const displayCount = showUnreadOnly ? unreadCount : allNotifications.length;

    type Notif = RouterOutputs["notification"]["getAll"][number];

    const getFilteredNotifications = () => {
        if (selectedFilter === "all") return notifications;
        
        const filterMap: Record<string, NotificationType[]> = {
            tasks: ["TASK_ASSIGNED", "TASK_UPDATED", "TASK_COMPLETED", "TASK_CREATED", "TASK_DELETED", "TASK_STATUS_CHANGED"],
            projects: ["PROJECT_CREATED", "PROJECT_DELETED"],
            comments: ["COMMENT_ADDED"],
        };

        const allowedTypes = filterMap[selectedFilter] || [];
        return notifications.filter((n: Notif) => allowedTypes.includes(n.type as NotificationType));
    };

    const filteredNotifications = getFilteredNotifications();

    const getNotificationIcon = (type: NotificationType) => {
        switch (type) {
            case "TASK_CREATED":
            case "TASK_ASSIGNED":
            case "TASK_UPDATED":
            case "TASK_COMPLETED":
            case "TASK_STATUS_CHANGED":
            case "TASK_DELETED":
                return <Clipboard size={18} />;
            case "PROJECT_CREATED":
            case "PROJECT_DELETED":
                return <Folder size={18} />;
            case "COMMENT_ADDED":
                return <MessageSquare size={18} />;
            default:
                return <Clipboard size={18} />;
        }
    };

    const getNotificationLabel = (type: NotificationType): string => {
        switch (type) {
            case "TASK_CREATED":
                return "Tarea Creada";
            case "TASK_ASSIGNED":
                return "Tarea Asignada";
            case "TASK_UPDATED":
                return "Tarea Actualizada";
            case "TASK_COMPLETED":
                return "Tarea Completada";
            case "TASK_STATUS_CHANGED":
                return "Estado de Tarea";
            case "TASK_DELETED":
                return "Tarea Eliminada";
            case "PROJECT_CREATED":
                return "Proyecto Creado";
            case "PROJECT_DELETED":
                return "Proyecto Eliminado";
            case "COMMENT_ADDED":
                return "Comentario Añadido";
            default:
                return type;
        }
    };

    const getBadgeVariant = (type: NotificationType): "default" | "secondary" | "destructive" | "outline" => {
        if (type.includes("TASK")) return "default";
        if (type.includes("PROJECT")) return "secondary";
        if (type.includes("COMMENT")) return "outline";
        return "default";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notificaciones {unreadCount > 0 && `(${unreadCount})`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-4">
                        {/* Tabs: Leídas/No leídas */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={showUnreadOnly ? "default" : "outline"}
                                onClick={() => setShowUnreadOnly(true)}
                                size="sm"
                            >
                                No Leídas ({unreadCount})
                            </Button>
                            <Button
                                variant={!showUnreadOnly ? "default" : "outline"}
                                onClick={() => setShowUnreadOnly(false)}
                                size="sm"
                            >
                                Todas
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => void handleMarkAllAsRead()}
                                disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                                size="sm"
                            >
                                {markAllAsReadMutation.isPending ? "Marcando..." : "Marcar como Leídas"}
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={selectedFilter === "all" ? "default" : "outline"}
                                onClick={() => setSelectedFilter("all")}
                                size="sm"
                                className="text-xs"
                            >
                                Todas
                            </Button>
                            <Button
                                variant={selectedFilter === "tasks" ? "default" : "outline"}
                                onClick={() => setSelectedFilter("tasks")}
                                size="sm"
                                className="text-xs flex items-center gap-2"
                            >
                                <Clipboard size={14} /> Tareas
                            </Button>
                            <Button
                                variant={selectedFilter === "projects" ? "default" : "outline"}
                                onClick={() => setSelectedFilter("projects")}
                                size="sm"
                                className="text-xs flex items-center gap-2"
                            >
                                <Folder size={14} /> Proyectos
                            </Button>
                            <Button
                                variant={selectedFilter === "comments" ? "default" : "outline"}
                                onClick={() => setSelectedFilter("comments")}
                                size="sm"
                                className="text-xs flex items-center gap-2"
                            >
                                <MessageSquare size={14} /> Comentarios
                            </Button>
                        </div>

                        {/* Notifications List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredNotifications && filteredNotifications.length > 0 ? (
                                filteredNotifications.map((n: Notif, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border transition-colors ${
                                            n.read
                                                ? "bg-muted/30 border-border"
                                                : "bg-primary/5 border-primary/30"
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg">{getNotificationIcon(n.type as NotificationType)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={getBadgeVariant(n.type as NotificationType)} className="text-xs">
                                                        {getNotificationLabel(n.type as NotificationType)}
                                                    </Badge>
                                                                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                                                                    {isAdmin && (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleOpenConfirm(n.id)}
                                                                                className="ml-2"
                                                                                disabled={deleteNotificationMutation.isPending}
                                                                            >
                                                                                <Trash size={14} />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                </div>
                                                <p className="text-sm mt-1 text-foreground wrap-break-word">{n.message}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {n.createdAt ? new Date(n.createdAt).toLocaleString("es-ES") : "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground text-sm">
                                        {selectedFilter === "all"
                                            ? showUnreadOnly
                                                ? "No hay notificaciones sin leer"
                                                : "No hay notificaciones"
                                            : `No hay notificaciones de ${selectedFilter}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">¿Estás seguro que deseas eliminar esta notificación? Esta acción no se puede deshacer.</p>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDeleteOpen(false)}
                            disabled={deleteNotificationMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleConfirmDelete()}
                            disabled={deleteNotificationMutation.isPending}
                        >
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
