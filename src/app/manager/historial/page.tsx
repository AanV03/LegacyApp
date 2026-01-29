"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export default function HistoryTab() {
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");
    const [showAllHistory, setShowAllHistory] = useState(false);

    // Get all tasks
    const { data: tasks = [] } = api.task.list.useQuery();

    const taskIdNum = selectedTaskId ? parseInt(selectedTaskId) : null;
    const { data: taskHistory = [], refetch: refetchTask, isLoading: taskLoading } = api.history.getByTask.useQuery(
        { taskId: taskIdNum ?? 0 },
        { enabled: !!taskIdNum && !showAllHistory }
    );

    const { data: allHistory = [], refetch: refetchAll, isLoading: allLoading } = api.history.getAll.useQuery(
        { limit: 100 },
        { enabled: showAllHistory }
    );

    const handleLoadTaskHistory = () => {
        if (!taskIdNum) {
            toast.error("Seleccione una tarea");
            return;
        }
        setShowAllHistory(false);
        void refetchTask();
    };

    const handleLoadAllHistory = () => {
        setShowAllHistory(true);
        void refetchAll();
    };

    const translateAction = (action: string): string => {
        const translations: Record<string, string> = {
            CREATED: "Creada",
            STATUS_CHANGED: "Estado Cambiado",
            TITLE_CHANGED: "Título Cambiado",
            ASSIGNED: "Asignada",
            PRIORITY_CHANGED: "Prioridad Cambiada",
            DUE_DATE_CHANGED: "Fecha Vencimiento Cambiada",
            DELETED: "Eliminada",
        };
        return translations[action] ?? action;
    };

    const historyData = showAllHistory ? allHistory : taskHistory;
    const isLoading = showAllHistory ? allLoading : taskLoading;

    interface Task {
        id: number;
        title: string;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Historial</h2>
                <p className="text-muted-foreground">Revisa cambios y actividad del sistema</p>
            </div>
            {/* Card para Select */}
            <Card>
                <CardHeader>
                    <CardTitle>Seleccionar Tarea</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="historyTaskSelect">Tarea</Label>
                        <Select
                            value={showAllHistory ? "" : selectedTaskId}
                            onValueChange={(value) => {
                                setSelectedTaskId(value);
                                setShowAllHistory(false);
                            }}
                        >
                            <SelectTrigger id="historyTaskSelect" className="w-full">
                                <SelectValue placeholder={showAllHistory ? "Todas las tareas" : "Seleccione una tarea"} />
                            </SelectTrigger>
                            <SelectContent>
                                {tasks.map((task: Task) => (
                                    <SelectItem key={task.id} value={task.id.toString()}>
                                        #{task.id} - {task.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={handleLoadTaskHistory}
                            disabled={isLoading || !taskIdNum}
                            className="w-full"
                        >
                            {isLoading && !showAllHistory ? "Cargando..." : "Cargar Historial"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleLoadAllHistory}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading && showAllHistory ? "Cargando..." : "Cargar Todo el Historial"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Card para Historial */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Cambios ({historyData.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Vista Desktop - Tabla */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha/Hora</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead>Tarea</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Antes</TableHead>
                                    <TableHead>Después</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500">
                                            No hay historial
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    historyData.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="text-sm">
                                                {new Date(h.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-sm font-medium">{translateAction(h.action)}</TableCell>
                                            <TableCell className="text-sm">
                                                #{h.taskId} - {h.task?.title ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {h.user?.name ?? h.user?.username ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {h.oldValue ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {h.newValue ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Vista Mobile - Cards */}
                    <div className="md:hidden space-y-3">
                        {historyData.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">No hay historial</div>
                        ) : (
                            historyData.map((h) => (
                                <div
                                    key={h.id}
                                    className="border border-gray-200 rounded-lg p-3 space-y-2"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">{translateAction(h.action)}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(h.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-xs space-y-1 border-t pt-2">
                                        <p className="text-gray-600">
                                            <span className="font-medium">Tarea:</span> #{h.taskId} - {h.task?.title ?? "—"}
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium">Usuario:</span> {h.user?.name ?? h.user?.username ?? "—"}
                                        </p>
                                        {h.oldValue && (
                                            <p className="text-gray-600">
                                                <span className="font-medium">Antes:</span> {h.oldValue}
                                            </p>
                                        )}
                                        {h.newValue && (
                                            <p className="text-gray-600">
                                                <span className="font-medium">Después:</span> {h.newValue}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
