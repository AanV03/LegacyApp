"use client";

import { Card } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f59e0b",
    IN_PROGRESS: "#3b82f6",
    COMPLETED: "#10b981",
    CANCELLED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
};

const ACTION_LABELS: Record<string, string> = {
    CREATED: "Creada",
    STATUS_CHANGED: "Estado cambiado",
    TITLE_CHANGED: "Título cambiado",
    ASSIGNED: "Asignada",
    PRIORITY_CHANGED: "Prioridad cambiada",
    DUE_DATE_CHANGED: "Fecha de vencimiento cambiada",
    DELETED: "Eliminada",
};

// Local types to avoid `any` and unsafe member access
interface Task {
    id?: string | number;
    status?: string | null;
    dueDate?: string | Date | null;
    projectId?: string | number | null;
    title?: string | null;
    assignedTo?: { name?: string | null } | null;
    assignedToId?: string | number | null;
    createdAt?: string | Date | null;
}

interface Project {
    id?: string | number;
    name?: string | null;
}

interface HistoryEntry {
    id: string | number;
    action?: string | null;
    type?: string | null;
    user?: { name?: string | null; username?: string | null } | null;
    taskId?: string | number | null;
    task?: { id?: string | number; title?: string | null } | null;
    createdAt?: string | Date | null;
}

export default function DashboardHome() {
    // Data hooks (keep raw data ref and memoize normalized arrays)
    const tasksData = api.task.list.useQuery().data;
    const projectsData = api.project.list.useQuery().data;
    const historyData = api.history.getAll.useQuery({ limit: 10 }).data;

    const tasks = useMemo(() => (tasksData ?? []) as Task[], [tasksData]);
    const projects = useMemo(() => (projectsData ?? []) as Project[], [projectsData]);
    const history = useMemo(() => (historyData ?? []) as HistoryEntry[], [historyData]);

    // Derived values
    const totalTasks = tasks.length;
    const pendingCount = tasks.filter((t: Task) => t.status === "PENDING").length;
    const inProgressCount = tasks.filter((t: Task) => t.status === "IN_PROGRESS").length;
    const overdueCount = tasks.filter((t: Task) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate as string | number | Date);
        return d.getTime() < Date.now() && t.status !== "COMPLETED";
    }).length;

    const statusDistribution = useMemo(() => {
        const map: Record<string, number> = {};
        tasks.forEach((t: Task) => {
            const s = t.status ?? "UNKNOWN";
            map[s] = (map[s] ?? 0) + 1;
        });
        return Object.keys(map).map((k) => ({ code: k, displayName: STATUS_LABELS[k] ?? k, value: map[k] ?? 0 }));
    }, [tasks]);

    const tasksPerProject = useMemo(() => {
        const map: Record<string, number> = {};
        tasks.forEach((t: Task) => {
            const pid = String(t.projectId ?? "unassigned");
            map[pid] = (map[pid] ?? 0) + 1;
        });
        return Object.keys(map).map((pid) => ({
            project: projects.find((p: Project) => String(p.id) === pid)?.name ?? "Sin proyecto",
            value: map[pid],
        }));
    }, [tasks, projects]);

    const upcomingDue = tasks
        .filter((t: Task) => t.dueDate && t.status !== "COMPLETED")
        .map((t) => ({ ...t, due: new Date(String(t.dueDate)) }))
        .sort((a: Task & { due: Date }, b: Task & { due: Date }) => a.due.getTime() - b.due.getTime())
        .slice(0, 5);

    return (
        <main className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Panel</h2>
                <p className="text-muted-foreground">Resumen rápido de proyectos y tareas</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Tareas Totales</p>
                    <p className="text-2xl font-bold mt-2">{totalTasks}</p>
                    <div className="text-xs text-muted-foreground mt-2"> Todos los usuarios</div>
                </Card>

                <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Pendientes</p>
                    <p className="text-2xl font-bold mt-2">{pendingCount}</p>
                    <div className="text-xs text-muted-foreground mt-2">Tareas por hacer</div>
                </Card>

                <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">En Progreso</p>
                    <p className="text-2xl font-bold mt-2">{inProgressCount}</p>
                    <div className="text-xs text-muted-foreground mt-2">Trabajo en curso</div>
                </Card>

                <Card className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Atrasadas</p>
                    <p className="text-2xl font-bold mt-2">{overdueCount}</p>
                    <div className="text-xs text-muted-foreground mt-2">Vencidas y no completadas</div>
                </Card>
            </div>

            {/* Charts and lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1 p-4">
                    <h3 className="text-lg font-semibold">Distribución por Estado</h3>
                    <div className="mt-3 w-full h-56 min-h-[220px]">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusDistribution} dataKey="value" nameKey="displayName" innerRadius={40} outerRadius={80} label>
                                    {statusDistribution.map((entry, idx) => (
                                        <Cell key={`c-${idx}`} fill={STATUS_COLORS[entry.code] ?? "#9ca3af"} />
                                    ))}
                                </Pie>
                                <Legend />
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="lg:col-span-2 p-4">
                    <h3 className="text-lg font-semibold">Tareas por Proyecto</h3>
                    <div className="mt-3 w-full h-60 min-h-[240px]">
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={tasksPerProject}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="project" type="category" />
                                <YAxis type="number" />
                                <Tooltip />
                                <Bar dataKey="value" fill="#2563eb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 p-4">
                    <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                    <div className="mt-3 space-y-2">
                        {history.slice(0, 10).map((h: HistoryEntry) => (
                            <div key={h.id} className="border rounded p-2">
                                <div className="flex justify-between">
                                    {(() => {
                                        const key = (h.action ?? h.type) ?? "UNKNOWN";
                                        return <div className="text-sm font-medium">{ACTION_LABELS[key] ?? key}</div>;
                                    })()}
                                    <div className="text-xs text-muted-foreground">{h.user?.name ?? h.user?.username ?? "—"}</div>
                                </div>
                                <div className="text-xs text-muted-foreground"># {h.taskId ?? h.task?.id ?? "—"} — {h.task?.title ?? "(sin título)"}</div>
                                <div className="text-xs text-muted-foreground mt-1">{h.createdAt ? new Date(String(h.createdAt)).toLocaleString() : "—"}</div>
                            </div>
                        ))}
                        {history.length === 0 && <div className="text-center text-gray-500 py-4">No hay actividad reciente</div>}
                    </div>
                </Card>

                <Card className="p-4">
                    <h3 className="text-lg font-semibold">Próximos Vencimientos</h3>
                    <div className="mt-3 space-y-2">
                        {upcomingDue.length === 0 && <div className="text-gray-500">No hay vencimientos próximos</div>}
                        {upcomingDue.map((t: Task & { due: Date }) => (
                            <div key={t.id} className="border rounded p-2">
                                <div className="text-sm font-medium">{t.title}</div>
                                <div className="text-xs text-muted-foreground">Asignado: {t.assignedTo?.name ?? t.assignedToId ?? "Sin asignar"}</div>
                                <div className="text-xs text-muted-foreground">Vence: {t.due.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </main>
    );
}
