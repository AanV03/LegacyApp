"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

export default function NotificationTab() {
    const [showUnreadOnly, setShowUnreadOnly] = useState(true);

    const { data: unreadNotifications = [], refetch: refetchUnread } =
        api.notification.getUnread.useQuery();
    const { data: allNotifications = [], refetch: refetchAll } =
        api.notification.getAll.useQuery({ limit: 50 });
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

    const handleMarkAllAsRead = async () => {
        await markAllAsReadMutation.mutateAsync();
    };

    const notifications = showUnreadOnly ? unreadNotifications : allNotifications;
    const displayCount = showUnreadOnly ? unreadCount : allNotifications.length;

    type Notif = RouterOutputs["notification"]["getAll"][number];

    const notificationsDisplay = (notifications ?? [])
        .map((n: Notif) => {
            const when = n?.createdAt ? new Date(n.createdAt).toLocaleString() : "—";
            return `${n?.read ? "✓" : "●"} [${n?.type}] ${n?.message}\n  ${when}\n`;
        })
        .join("\n");

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notificaciones {unreadCount > 0 && `(${unreadCount})`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            variant={showUnreadOnly ? "default" : "outline"}
                            onClick={() => setShowUnreadOnly(true)}
                        >
                            No Leídas ({unreadCount})
                        </Button>
                        <Button
                            variant={!showUnreadOnly ? "default" : "outline"}
                            onClick={() => setShowUnreadOnly(false)}
                        >
                            Todas
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => void handleMarkAllAsRead()}
                            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                        >
                            {markAllAsReadMutation.isPending ? "Marcando..." : "Marcar como Leídas"}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Notificaciones ({displayCount})</Label>
                        <Textarea
                            value={notificationsDisplay}
                            readOnly
                            placeholder="Las notificaciones aparecerán aquí"
                            rows={15}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
