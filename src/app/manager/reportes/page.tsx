"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { toast } from "sonner";
import { api } from "~/trpc/react";
const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
};
const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    CRITICAL: "Crítica",
};

export default function ReportTab() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [projectFilter, setProjectFilter] = useState<string | null>(null);
    const [userFilter, setUserFilter] = useState<string | null>(null);
    const [projectStatusFilter, setProjectStatusFilter] = useState<string>("all");
    const [projectPriorityFilter, setProjectPriorityFilter] = useState<string>("all");
    const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
    const [userPriorityFilter, setUserPriorityFilter] = useState<string>("all");

    // Status report query
    const {
        data: statusData,
        isLoading: loadingStatus,
    } = api.report.tasksByStatusDetailed.useQuery(
        { status: statusFilter === "all" ? undefined : statusFilter },
        { enabled: true }
    );

    // Priority report query
    const {
        data: priorityData,
        isLoading: loadingPriority,
    } = api.report.tasksByPriorityDetailed.useQuery(
        { priority: priorityFilter === "all" ? undefined : priorityFilter },
        { enabled: true }
    );

    // Projects list
    const { data: projectsListData } = api.report.projectsList.useQuery();

    // Project overview
    const {
        data: projectOverviewData,
    } = api.report.projectOverview.useQuery(
        { projectId: projectFilter ? parseInt(projectFilter) : 0 },
        { enabled: !!projectFilter }
    );

    // Tasks for project
    const {
        data: projectTasksData,
        isLoading: loadingProjectTasks,
    } = api.report.tasksForProject.useQuery(
        {
            projectId: projectFilter ? parseInt(projectFilter) : 0,
            status: projectStatusFilter === "all" ? undefined : projectStatusFilter,
            priority: projectPriorityFilter === "all" ? undefined : projectPriorityFilter,
        },
        { enabled: !!projectFilter }
    );

    // Users list
    const { data: usersListData } = api.report.userList.useQuery();

    // User overview
    const {
        data: userOverviewData,
    } = api.report.userOverview.useQuery(
        { userId: userFilter ?? "" },
        { enabled: !!userFilter }
    );

    // Tasks for user
    const {
        data: userTasksData,
        isLoading: loadingUserTasks,
    } = api.report.tasksForUser.useQuery(
        {
            userId: userFilter ?? "",
            status: userStatusFilter === "all" ? undefined : userStatusFilter,
            priority: userPriorityFilter === "all" ? undefined : userPriorityFilter,
        },
        { enabled: !!userFilter }
    );

    // Export mutations
    const statusExportMutation = api.report.exportTasksAsCSV.useMutation();
    const priorityExportMutation = api.report.exportTasksAsCSV.useMutation();
    const projectExportMutation = api.report.exportTasksAsCSV.useMutation();
    const userExportMutation = api.report.exportTasksAsCSV.useMutation();

    // Handle filters and refetch
    const handleStatusFilterChange = async (value: string) => {
        setStatusFilter(value);
    };

    const handlePriorityFilterChange = async (value: string) => {
        setPriorityFilter(value);
    };

    const handleProjectChange = async (value: string) => {
        setProjectFilter(value);
        setProjectStatusFilter("all");
        setProjectPriorityFilter("all");
    };

    const handleProjectStatusChange = async (value: string) => {
        setProjectStatusFilter(value);
    };

    const handleProjectPriorityChange = async (value: string) => {
        setProjectPriorityFilter(value);
    };

    const handleUserChange = async (value: string) => {
        setUserFilter(value);
        setUserStatusFilter("all");
        setUserPriorityFilter("all");
    };

    const handleUserStatusChange = async (value: string) => {
        setUserStatusFilter(value);
    };

    const handleUserPriorityChange = async (value: string) => {
        setUserPriorityFilter(value);
    };

    // Download CSV helpers
    const downloadCSV = (csv: string, filename: string) => {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadStatusCSV = async () => {
        try {
            const filters: Record<string, string | undefined> = {};
            if (statusFilter !== "all") {
                filters.status = statusFilter;
            }
            const result = await statusExportMutation.mutateAsync({ filters });
            downloadCSV(result.csv, result.filename);
            toast.success("CSV descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error descargando CSV");
        }
    };

    const handleDownloadPriorityCSV = async () => {
        try {
            const filters: Record<string, string | undefined> = {};
            if (priorityFilter !== "all") {
                filters.priority = priorityFilter;
            }
            const result = await priorityExportMutation.mutateAsync({ filters });
            downloadCSV(result.csv, result.filename);
            toast.success("CSV descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error descargando CSV");
        }
    };

    const handleDownloadProjectCSV = async () => {
        try {
            const filters: Record<string, string | number | undefined> = { projectId: projectFilter ?? undefined };
            if (projectStatusFilter !== "all") {
                filters.status = projectStatusFilter;
            }
            if (projectPriorityFilter !== "all") {
                filters.priority = projectPriorityFilter;
            }
            const result = await projectExportMutation.mutateAsync({ filters });
            downloadCSV(result.csv, result.filename);
            toast.success("CSV descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error descargando CSV");
        }
    };

    const handleDownloadUserCSV = async () => {
        try {
            const filters: Record<string, string | undefined> = { assignedToId: userFilter ?? undefined };
            if (userStatusFilter !== "all") {
                filters.status = userStatusFilter;
            }
            if (userPriorityFilter !== "all") {
                filters.priority = userPriorityFilter;
            }
            const result = await userExportMutation.mutateAsync({ filters });
            downloadCSV(result.csv, result.filename);
            toast.success("CSV descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error descargando CSV");
        }
    };

    // TaskItem component (reusable)
    const TaskItem = ({ task, showProject = false }: { task: Record<string, unknown>; showProject?: boolean }) => {
        const projectNameVal = ((task.project as Record<string, unknown>)?.name as string) ?? "N/A";
        const taskTitle = String((task.title as string | null) ?? "").trim() || "";
        const taskStatus = String((task.status as string | null) ?? "").trim() || "";
        const taskPriority = String((task.priority as string | null) ?? "").trim() || "";
        const assignedNameVal = ((task.assignedTo as Record<string, unknown>)?.name as string) ?? "Sin asignar";
        const dueDateStr = task.dueDate ? new Date(task.dueDate as string | number | Date).toLocaleDateString("es-ES") : null;

        return (
            <div className="border rounded-md p-3 text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    {showProject && (
                        <div>
                            <span className="font-semibold text-xs text-muted-foreground">Proyecto</span>
                            <p className="text-foreground">{projectNameVal}</p>
                        </div>
                    )}
                    <div>
                        <span className="font-semibold text-xs text-muted-foreground">Tarea</span>
                        <p className="text-foreground">{taskTitle}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-xs text-muted-foreground">Estado</span>
                        <p className="text-foreground text-xs">{taskStatus}</p>
                    </div>
                    <div>
                        <span className="font-semibold text-xs text-muted-foreground">Prioridad</span>
                        <p className="text-foreground text-xs">{(PRIORITY_LABELS[taskPriority] ?? taskPriority) || "—"}</p>
                    </div>
                </div>
                {dueDateStr && (
                    <div>
                        <span className="font-semibold text-xs text-muted-foreground">Vence</span>
                        <p className="text-foreground text-xs">{dueDateStr}</p>
                    </div>
                )}
                {assignedNameVal && (
                    <div>
                        <span className="font-semibold text-xs text-muted-foreground">Asignado a</span>
                        <p className="text-foreground">{assignedNameVal}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Reportes</h2>
                <p className="text-muted-foreground">Genera y exporta informes</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Generación de Reportes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="status" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="status">Estado</TabsTrigger>
                            <TabsTrigger value="priority">Prioridad</TabsTrigger>
                            <TabsTrigger value="project">Proyectos</TabsTrigger>
                            <TabsTrigger value="user">Usuarios</TabsTrigger>
                        </TabsList>

                        {/* ============= STATUS TAB ============= */}
                        <TabsContent value="status" className="space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label htmlFor="status-select" className="mb-2 block">
                                        Filtrar por Estado
                                    </Label>
                                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                                        <SelectTrigger id="status-select">
                                            <SelectValue placeholder="Selecciona un estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="PENDING">Pendiente</SelectItem>
                                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                            <SelectItem value="COMPLETED">Completado</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleDownloadStatusCSV}
                                    variant="outline"
                                    size="sm"
                                    disabled={statusExportMutation.isPending}
                                >
                                    {statusExportMutation.isPending ? "Generando..." : "CSV"}
                                </Button>
                            </div>

                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">
                                    Total de tareas:{" "}
                                    <span className="font-semibold text-foreground">
                                        {loadingStatus ? "..." : statusData?.count ?? 0}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Tareas</Label>
                                {loadingStatus && <div className="text-muted-foreground text-sm">Cargando...</div>}
                                {!loadingStatus && statusData?.tasks.length === 0 && (
                                    <div className="text-muted-foreground text-sm">No hay tareas</div>
                                )}
                                {!loadingStatus && statusData?.tasks && (
                                    <>
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>ID</TableHead>
                                                        <TableHead>Proyecto</TableHead>
                                                        <TableHead>Tarea</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead>Prioridad</TableHead>
                                                        <TableHead>Vence</TableHead>
                                                        <TableHead>Asignado</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {statusData.tasks.map((task: Record<string, unknown>) => {
                                                        const taskId = String((task.id as string) ?? "");
                                                        const projectNameVal = ((task.project as Record<string, unknown>)?.name as string) ?? "N/A";
                                                        const taskTitle = String((task.title as string | null) ?? "").trim() || "";
                                                        const taskStatus = String((task.status as string | null) ?? "").trim() || "";
                                                        const taskPriority = String((task.priority as string | null) ?? "").trim() || "";
                                                        const assignedNameVal = ((task.assignedTo as Record<string, unknown>)?.name as string) ?? "Sin asignar";
                                                        const dueDateStr = task.dueDate ? new Date(task.dueDate as string | number | Date).toLocaleDateString("es-ES") : "—";

                                                        return (
                                                            <TableRow key={taskId} className="hover:bg-muted">
                                                                    <TableCell>{taskId}</TableCell>
                                                                    <TableCell>{projectNameVal}</TableCell>
                                                                    <TableCell className="font-medium">{taskTitle}</TableCell>
                                                                    <TableCell>{(STATUS_LABELS[taskStatus] ?? taskStatus) || "—"}</TableCell>
                                                                    <TableCell>{(PRIORITY_LABELS[taskPriority] ?? taskPriority) || "—"}</TableCell>
                                                                    <TableCell>{dueDateStr}</TableCell>
                                                                    <TableCell>{assignedNameVal}</TableCell>
                                                                </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                            {statusData.tasks.map((task: Record<string, unknown>) => {
                                                const taskId = String((task.id as string) ?? "");
                                                return (
                                                    <TaskItem key={taskId} task={task} showProject={true} />
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* ============= PRIORITY TAB ============= */}
                        <TabsContent value="priority" className="space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <Label htmlFor="priority-select" className="mb-2 block">
                                        Filtrar por Prioridad
                                    </Label>
                                    <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                                        <SelectTrigger id="priority-select">
                                            <SelectValue placeholder="Selecciona una prioridad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="LOW">Baja</SelectItem>
                                            <SelectItem value="MEDIUM">Media</SelectItem>
                                            <SelectItem value="HIGH">Alta</SelectItem>
                                            <SelectItem value="CRITICAL">Crítica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    onClick={handleDownloadPriorityCSV}
                                    variant="outline"
                                    size="sm"
                                    disabled={priorityExportMutation.isPending}
                                >
                                    {priorityExportMutation.isPending ? "Generando..." : "CSV"}
                                </Button>
                            </div>

                            <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm text-muted-foreground">
                                    Total de tareas:{" "}
                                    <span className="font-semibold text-foreground">
                                        {loadingPriority ? "..." : priorityData?.count ?? 0}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Tareas</Label>
                                {loadingPriority && <div className="text-muted-foreground text-sm">Cargando...</div>}
                                {!loadingPriority && priorityData?.tasks.length === 0 && (
                                    <div className="text-muted-foreground text-sm">No hay tareas</div>
                                )}
                                {!loadingPriority && priorityData?.tasks && (
                                    <>
                                        <div className="hidden md:block overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>ID</TableHead>
                                                        <TableHead>Proyecto</TableHead>
                                                        <TableHead>Tarea</TableHead>
                                                        <TableHead>Estado</TableHead>
                                                        <TableHead>Prioridad</TableHead>
                                                        <TableHead>Vence</TableHead>
                                                        <TableHead>Asignado</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                            {priorityData.tasks.map((task: Record<string, unknown>) => {
                                                        const taskId = String((task.id as string) ?? "");
                                                        const projectNameVal = ((task.project as Record<string, unknown>)?.name as string) ?? "N/A";
                                                        const taskTitle = String((task.title as string | null) ?? "").trim() || "";
                                                        const taskStatus = String((task.status as string | null) ?? "").trim() || "";
                                                        const taskPriority = String((task.priority as string | null) ?? "").trim() || "";
                                                        const assignedNameVal = ((task.assignedTo as Record<string, unknown>)?.name as string) ?? "Sin asignar";
                                                        const dueDateStr = task.dueDate ? new Date(task.dueDate as string | number | Date).toLocaleDateString("es-ES") : "—";

                                                        return (
                                                            <TableRow key={taskId} className="hover:bg-muted">
                                                                <TableCell>{taskId}</TableCell>
                                                                <TableCell>{projectNameVal}</TableCell>
                                                                <TableCell className="font-medium">{taskTitle}</TableCell>
                                                                <TableCell>{(STATUS_LABELS[taskStatus] ?? taskStatus) || "—"}</TableCell>
                                                                <TableCell>{(PRIORITY_LABELS[taskPriority] ?? taskPriority) || "—"}</TableCell>
                                                                <TableCell>{dueDateStr}</TableCell>
                                                                <TableCell>{assignedNameVal}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                            {priorityData.tasks.map((task: Record<string, unknown>) => {
                                                const taskId = String((task.id as string) ?? "");
                                                return (
                                                    <TaskItem key={taskId} task={task} showProject={true} />
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        {/* ============= PROJECTS TAB ============= */}
                        <TabsContent value="project" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Project selector */}
                                <div>
                                    <Label htmlFor="project-select" className="mb-2 block">
                                        Selecciona Proyecto
                                    </Label>
                                    <Select value={projectFilter ?? ""} onValueChange={handleProjectChange}>
                                        <SelectTrigger id="project-select">
                                            <SelectValue placeholder="Selecciona un proyecto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projectsListData?.projects?.map((p: Record<string, unknown>) => (
                                                <SelectItem key={String(p.id)} value={String(p.id)}>
                                                    {String(p.name)} ({String(p.taskCount)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status filter */}
                                <div>
                                    <Label htmlFor="proj-status" className="mb-2 block">
                                        Estado
                                    </Label>
                                    <Select value={projectStatusFilter} onValueChange={handleProjectStatusChange}>
                                        <SelectTrigger id="proj-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="PENDING">Pendiente</SelectItem>
                                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                            <SelectItem value="COMPLETED">Completado</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority filter */}
                                <div>
                                    <Label htmlFor="proj-priority" className="mb-2 block">
                                        Prioridad
                                    </Label>
                                    <Select value={projectPriorityFilter} onValueChange={handleProjectPriorityChange}>
                                        <SelectTrigger id="proj-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="LOW">Baja</SelectItem>
                                            <SelectItem value="MEDIUM">Media</SelectItem>
                                            <SelectItem value="HIGH">Alta</SelectItem>
                                            <SelectItem value="CRITICAL">Crítica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {projectFilter && projectOverviewData && (
                                <>
                                    <div className="bg-muted p-4 rounded-md space-y-2">
                                        {/* Desktop: inline stats + CSV */}
                                        <div className="hidden md:grid grid-cols-5 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Total</span>
                                                <p className="font-semibold text-lg">{projectOverviewData.total}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Completadas</span>
                                                <p className="font-semibold text-lg">{projectOverviewData.completed}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Progreso</span>
                                                <p className="font-semibold text-lg">{projectOverviewData.completionRate}%</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Atrasadas</span>
                                                <p className="font-semibold text-lg text-destructive">{projectOverviewData.overdue}</p>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <Button
                                                    onClick={handleDownloadProjectCSV}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={projectExportMutation.isPending}
                                                >
                                                    {projectExportMutation.isPending ? "..." : "CSV"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Mobile: 2x2 grid of stats + CSV button below */}
                                        <div className="md:hidden">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Total</span>
                                                    <p className="font-semibold text-lg">{projectOverviewData.total}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Completadas</span>
                                                    <p className="font-semibold text-lg">{projectOverviewData.completed}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Progreso</span>
                                                    <p className="font-semibold text-lg">{projectOverviewData.completionRate}%</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Atrasadas</span>
                                                    <p className="font-semibold text-lg text-destructive">{projectOverviewData.overdue}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleDownloadProjectCSV}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    disabled={projectExportMutation.isPending}
                                                >
                                                    {projectExportMutation.isPending ? "..." : "crear CSV"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tareas del Proyecto</Label>
                                        {loadingProjectTasks && <div className="text-muted-foreground text-sm">Cargando...</div>}
                                        {!loadingProjectTasks && projectTasksData?.tasks.length === 0 && (
                                            <div className="text-muted-foreground text-sm">No hay tareas</div>
                                        )}
                                        {!loadingProjectTasks && projectTasksData?.tasks && (
                                            <>
                                                <div className="hidden md:block overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>ID</TableHead>
                                                                <TableHead>Tarea</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                                <TableHead>Prioridad</TableHead>
                                                                <TableHead>Vence</TableHead>
                                                                <TableHead>Asignado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {projectTasksData.tasks.map((task: Record<string, unknown>) => {
                                                                const taskId = String((task.id as string) ?? "");
                                                                const taskTitle = String((task.title as string | null) ?? "").trim() || "";
                                                                const taskStatus = String((task.status as string | null) ?? "").trim() || "";
                                                                const taskPriority = String((task.priority as string | null) ?? "").trim() || "";
                                                                const assignedNameVal = ((task.assignedTo as Record<string, unknown>)?.name as string) ?? "Sin asignar";
                                                                const dueDateStr = task.dueDate ? new Date(task.dueDate as string | number | Date).toLocaleDateString("es-ES") : "—";

                                                                return (
                                                                    <TableRow key={taskId} className="hover:bg-muted">
                                                                        <TableCell>{taskId}</TableCell>
                                                                        <TableCell className="font-medium">{taskTitle}</TableCell>
                                                                        <TableCell>{(STATUS_LABELS[taskStatus] ?? taskStatus) || "—"}</TableCell>
                                                                        <TableCell>{(PRIORITY_LABELS[taskPriority] ?? taskPriority) || "—"}</TableCell>
                                                                        <TableCell>{dueDateStr}</TableCell>
                                                                        <TableCell>{assignedNameVal}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                                    {projectTasksData.tasks.map((task: Record<string, unknown>) => {
                                                        const taskId = String((task.id as string) ?? "");
                                                        return (
                                                            <TaskItem key={taskId} task={task} />
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* ============= USERS TAB ============= */}
                        <TabsContent value="user" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* User selector */}
                                <div>
                                    <Label htmlFor="user-select" className="mb-2 block">
                                        Selecciona Usuario
                                    </Label>
                                    <Select value={userFilter ?? ""} onValueChange={handleUserChange}>
                                        <SelectTrigger id="user-select">
                                            <SelectValue placeholder="Selecciona un usuario" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {usersListData?.users?.map((u: Record<string, unknown>) => {
                                                const userId = String((u.id as string) ?? "");
                                                const userName = String(((u.name ?? u.username) as string) ?? "");
                                                return (
                                                    <SelectItem key={userId} value={userId}>
                                                        {userName}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Status filter */}
                                <div>
                                    <Label htmlFor="user-status" className="mb-2 block">
                                        Estado
                                    </Label>
                                    <Select value={userStatusFilter} onValueChange={handleUserStatusChange}>
                                        <SelectTrigger id="user-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="PENDING">Pendiente</SelectItem>
                                            <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                            <SelectItem value="COMPLETED">Completado</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority filter */}
                                <div>
                                    <Label htmlFor="user-priority" className="mb-2 block">
                                        Prioridad
                                    </Label>
                                    <Select value={userPriorityFilter} onValueChange={handleUserPriorityChange}>
                                        <SelectTrigger id="user-priority">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="LOW">Baja</SelectItem>
                                            <SelectItem value="MEDIUM">Media</SelectItem>
                                            <SelectItem value="HIGH">Alta</SelectItem>
                                            <SelectItem value="CRITICAL">Crítica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {userFilter && userOverviewData && (
                                <>
                                    <div className="bg-muted p-4 rounded-md space-y-2">
                                        {/* Desktop: inline stats + CSV */}
                                        <div className="hidden md:grid grid-cols-5 gap-4 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Asignadas</span>
                                                <p className="font-semibold text-lg">{userOverviewData.totalAssigned}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Completadas</span>
                                                <p className="font-semibold text-lg">{userOverviewData.completed}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Progreso</span>
                                                <p className="font-semibold text-lg">{userOverviewData.completionRate}%</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Atrasadas</span>
                                                <p className="font-semibold text-lg text-destructive">
                                                    {userOverviewData.overdue}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <Button
                                                    onClick={handleDownloadUserCSV}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={userExportMutation.isPending}
                                                >
                                                    {userExportMutation.isPending ? "..." : "CSV"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Mobile: 2x2 grid of stats + CSV button below */}
                                        <div className="md:hidden">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Asignadas</span>
                                                    <p className="font-semibold text-lg">{userOverviewData.totalAssigned}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Completadas</span>
                                                    <p className="font-semibold text-lg">{userOverviewData.completed}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Progreso</span>
                                                    <p className="font-semibold text-lg">{userOverviewData.completionRate}%</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Atrasadas</span>
                                                    <p className="font-semibold text-lg text-destructive">{userOverviewData.overdue}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleDownloadUserCSV}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    disabled={userExportMutation.isPending}
                                                >
                                                    {userExportMutation.isPending ? "..." : "crear CSV"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tareas de {String(usersListData?.users?.find((u: Record<string, unknown>) => u.id === userFilter)?.name ?? "")}</Label>
                                        {loadingUserTasks && <div className="text-muted-foreground text-sm">Cargando...</div>}
                                        {!loadingUserTasks && userTasksData?.tasks && (
                                            <>
                                                <div className="hidden md:block overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>ID</TableHead>
                                                                <TableHead>Proyecto</TableHead>
                                                                <TableHead>Tarea</TableHead>
                                                                <TableHead>Estado</TableHead>
                                                                <TableHead>Prioridad</TableHead>
                                                                <TableHead>Vence</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {userTasksData.tasks.map((task: Record<string, unknown>) => {
                                                                const taskId = String((task.id as string) ?? "");
                                                                const projectNameVal = ((task.project as Record<string, unknown>)?.name as string) ?? "N/A";
                                                                const taskTitle = String((task.title as string | null) ?? "").trim() || "";
                                                                const taskStatus = String((task.status as string | null) ?? "").trim() || "";
                                                                const taskPriority = String((task.priority as string | null) ?? "").trim() || "";
                                                                const dueDateStr = task.dueDate ? new Date(task.dueDate as string | number | Date).toLocaleDateString("es-ES") : "—";

                                                                return (
                                                                    <TableRow key={taskId} className="hover:bg-muted">
                                                                        <TableCell>{taskId}</TableCell>
                                                                        <TableCell>{projectNameVal}</TableCell>
                                                                        <TableCell className="font-medium">{taskTitle}</TableCell>
                                                                        <TableCell>{(STATUS_LABELS[taskStatus] ?? taskStatus) || "—"}</TableCell>
                                                                        <TableCell>{(PRIORITY_LABELS[taskPriority] ?? taskPriority) || "—"}</TableCell>
                                                                        <TableCell>{dueDateStr}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                                    {userTasksData.tasks.map((task: Record<string, unknown>) => {
                                                        const taskId = String((task.id as string) ?? "");
                                                        return (
                                                            <TaskItem key={taskId} task={task} showProject={true} />
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
