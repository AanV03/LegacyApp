"use client";

import { useState, useEffect } from "react";
import type { TaskStatus, TaskPriority } from "../../../../generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "~/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "~/components/ui/input-group";
import { Calendar } from "~/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
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
import { Textarea } from "~/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, Save, Trash2 } from "lucide-react";

interface TaskFormData {
    id?: number;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId: number;
    assignedToId?: string;
    dueDate?: Date;
    estimatedHours: number;
}

interface TaskItem {
    id: number;
    title: string;
    description?: string | null;
    status?: TaskStatus | null;
    priority?: TaskPriority | null;
    projectId: number;
    assignedToId?: string | null;
    dueDate?: string | Date | null;
    estimatedHours?: number | null;
}

interface ProjectSimple {
    id: number;
    name?: string;
}

const TaskStatuses = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
const TaskPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
};

const PRIORITY_LABELS: Record<string, string> = {
    LOW: "Baja",
    MEDIUM: "Media",
    HIGH: "Alta",
    CRITICAL: "Crítica",
};

// --- Helpers for combined picker (based on your provided code) ---
function formatDateLocal(date: Date | undefined) {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function isValidDateLocal(date: Date | undefined) {
    if (!date) return false;
    return !isNaN(date.getTime());
}

function DateTimePickerCombined({
    value,
    onChange,
    _disabled,
}: {
    value?: Date | undefined;
    onChange: (d?: Date | null) => void;
    _disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(value);
    const [month, setMonth] = useState<Date | undefined>(value);
    const [val, setVal] = useState<string>(formatDateLocal(value));
    const [timeValue, setTimeValue] = useState<string>(value ? format(value, "HH:mm:ss") : "00:00:00");

    useEffect(() => {
        setDate(value);
        setMonth(value);
        setVal(formatDateLocal(value));
        if (value) setTimeValue(format(value, "HH:mm:ss"));
    }, [value]);

    return (
        <FieldGroup className="mx-auto w-full max-w-md flex-row gap-4">
            <Field className="flex-1">
                <FieldLabel htmlFor="date-required">Fecha de Vencimiento</FieldLabel>
                <InputGroup className="w-full">
                    <InputGroupInput
                        id="date-required"
                        value={val}
                        placeholder={formatDateLocal(new Date())}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const inputVal = e.target.value;
                            const d = new Date(inputVal);
                            setVal(inputVal);
                            if (isValidDateLocal(d)) {
                                setDate(d);
                                setMonth(d);
                                const [h = 0, m = 0, s = 0] = timeValue.split(":").map((x) => parseInt(x, 10) || 0);
                                d.setHours(h, m, s, 0);
                                onChange(d);
                            }
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setOpen(true);
                            }
                        }}
                    />
                    <InputGroupAddon align="inline-end">
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <InputGroupButton
                                    id="date-picker"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Select date"
                                >
                                    <CalendarIcon className="h-4 w-4" />
                                    <span className="sr-only">Select date</span>
                                </InputGroupButton>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0"
                                align="end"
                                alignOffset={-8}
                                sideOffset={10}
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    month={month}
                                    onMonthChange={(m: Date | undefined) => setMonth(m)}
                                    onSelect={(d) => {
                                        if (d instanceof Date) {
                                            setDate(d);
                                            setVal(formatDateLocal(d));
                                            const [h = 0, m = 0, s = 0] = timeValue.split(":").map((x) => parseInt(x, 10) || 0);
                                            d.setHours(h, m, s, 0);
                                            onChange(d);
                                            setOpen(false);
                                        }
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </InputGroupAddon>
                </InputGroup>
            </Field>

            <Field className="w-32">
                <FieldLabel htmlFor="time-picker">Hora de Vencimiento</FieldLabel>
                    <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    value={timeValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = e.target.value;
                        setTimeValue(v);
                        if (date) {
                            const [h = 0, m = 0, s = 0] = v.split(":").map((x) => parseInt(x, 10) || 0);
                            const newD = new Date(date);
                            newD.setHours(h, m, s, 0);
                            setDate(newD);
                            setVal(formatDateLocal(newD));
                            onChange(newD);
                        }
                    }}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </Field>
        </FieldGroup>
    );
}

function safeFormatDateTime(value?: string | Date | null) {
    if (!value) return "—";
    const d = new Date(value);
    return !isNaN(d.getTime()) ? format(d, "Pp") : "—";
}

export default function TaskTab() {
    const [taskForm, setTaskForm] = useState<TaskFormData>({
        title: "",
        description: "",
        status: "PENDING",
        priority: "MEDIUM",
        projectId: 0,
        assignedToId: undefined,
        dueDate: undefined,
        estimatedHours: 0,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // Filtros de búsqueda
    const [searchFilters, setSearchFilters] = useState({
        text: "",
        status: "all",
        priority: "all",
        projectId: "all",
    });

    // tRPC hooks
    const { 
        data: tasks = [], 
        refetch: refetchTasks, 
        isLoading: tasksLoading 
    } = api.task.list.useQuery();
    
    // Determinar si hay filtros activos
    const hasActiveFilters = searchFilters.text.trim() !== "" || 
                            searchFilters.status !== "all" || 
                            searchFilters.priority !== "all" || 
                            searchFilters.projectId !== "all";

    const { 
        data: searchResults = [], 
        isLoading: searchLoading 
    } = api.search.tasks.useQuery(
        {
            text: searchFilters.text || undefined,
            status: searchFilters.status === "all" ? undefined : (searchFilters.status as TaskStatus),
            priority: searchFilters.priority === "all" ? undefined : (searchFilters.priority as TaskPriority),
            projectId: searchFilters.projectId === "all" ? undefined : String(parseInt(searchFilters.projectId)),
        },
        { enabled: hasActiveFilters }
    );
    
    const { 
        data: projects = [] 
    } = api.project.list.useQuery();

    const { 
        data: stats,
        refetch: refetchStats,
    } = api.task.getStats.useQuery();
    
    // Usar resultados de búsqueda si hay filtros, sino usar lista completa
    const displayTasks = hasActiveFilters ? searchResults : tasks;
    const isLoadingTasks = hasActiveFilters ? searchLoading : tasksLoading;

    const createMutation = api.task.create.useMutation({
        onSuccess: () => {
            void refetchTasks();
            setIsDialogOpen(false);
            void refetchStats?.();
            setTaskForm({
                title: "",
                description: "",
                status: "PENDING",
                priority: "MEDIUM",
                projectId: 0,
                assignedToId: undefined,
                dueDate: undefined,
                estimatedHours: 0,
            });
            toast.success("Tarea creada exitosamente");
        },
        onError: (error) => {
            toast.error(error.message ?? "Error al crear la tarea");
        },
    });

    const updateMutation = api.task.update.useMutation({
        onSuccess: () => {
            void refetchTasks();
            setIsDialogOpen(false);
            void refetchStats?.();
            setTaskForm({
                title: "",
                description: "",
                status: "PENDING",
                priority: "MEDIUM",
                projectId: 0,
                assignedToId: undefined,
                dueDate: undefined,
                estimatedHours: 0,
            });
            setEditingId(null);
            toast.success("Tarea actualizada exitosamente");
        },
        onError: (error) => {
            toast.error(error.message ?? "Error al actualizar la tarea");
        },
    });

    const deleteMutation = api.task.delete.useMutation({
        onSuccess: () => {
            void refetchTasks();
            setIsDialogOpen(false);
            void refetchStats?.();
            setTaskForm({
                title: "",
                description: "",
                status: "PENDING",
                priority: "MEDIUM",
                projectId: 0,
                assignedToId: undefined,
                dueDate: undefined,
                estimatedHours: 0,
            });
            setEditingId(null);
            toast.success("Tarea eliminada exitosamente");
        },
        onError: (error) => {
            toast.error(error.message ?? "Error al eliminar la tarea");
        },
    });

    const handleTaskInputChange = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K] | null) => {
        setTaskForm((prev) => ({
            ...prev,
            [field]: value ?? undefined,
        } as TaskFormData));
    };

    const handleAdd = async () => {
        if (!taskForm.title.trim()) {
            toast.error("Task title is required");
            return;
        }
        if (taskForm.projectId === 0) {
            toast.error("Select a project");
            return;
        }

        await createMutation.mutateAsync({
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority,
            projectId: taskForm.projectId,
            assignedToId: taskForm.assignedToId,
            dueDate: taskForm.dueDate,
            estimatedHours: taskForm.estimatedHours,
        });
    };

    const handleUpdate = async () => {
        if (!editingId) {
            toast.error("No task selected");
            return;
        }
        if (!taskForm.title.trim()) {
            toast.error("Task title is required");
            return;
        }
        if (taskForm.projectId === 0) {
            toast.error("Select a project");
            return;
        }

        await updateMutation.mutateAsync({
            id: editingId,
            title: taskForm.title,
            description: taskForm.description,
            status: taskForm.status,
            priority: taskForm.priority,
            projectId: taskForm.projectId,
            assignedToId: taskForm.assignedToId,
            dueDate: taskForm.dueDate,
            estimatedHours: taskForm.estimatedHours,
        });
    };

    const handleDelete = async () => {
        if (!editingId) {
            toast.error("No task selected");
            return;
        }

        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!editingId) return;
        await deleteMutation.mutateAsync({ id: editingId });
        setIsConfirmDeleteOpen(false);
    };

    const handleSelectTask = (task: TaskItem) => {
        setTaskForm({
            id: task.id,
            title: task.title,
            description: task.description ?? undefined,
            status: task.status ?? undefined,
            priority: task.priority ?? undefined,
            projectId: task.projectId,
            assignedToId: task.assignedToId ?? undefined,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            estimatedHours: task.estimatedHours ?? 0,
        });
        setEditingId(task.id ?? null);
    };

    const handleClear = () => {
        setTaskForm({
            title: "",
            description: "",
            status: "PENDING",
            priority: "MEDIUM",
            projectId: 0,
            assignedToId: undefined,
            dueDate: undefined,
            estimatedHours: 0,
        });
        setEditingId(null);
    };

    const handleOpenDialog = () => {
        handleClear();
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        handleClear();
    };

    const getProjectName = (projectId: number) => {
        return projects.find((p: ProjectSimple) => p.id === projectId)?.name ?? "—";
    };

    const isLoading = isLoadingTasks || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    useEffect(() => {
        // Refetch stats when the main tasks list changes (helps keep the top cards in sync)
        void refetchStats?.();
    }, [tasks?.length, refetchStats]);

    return (
        <div className="space-y-4">
            {stats && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
                    <Card className="h-full">
                        <CardContent className="pt-2 p-3 md:p-4">
                            <p className="text-xs md:text-sm text-gray-600">Total</p>
                            <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="h-full">
                        <CardContent className="pt-2 p-3 md:p-4">
                            <p className="text-xs md:text-sm text-gray-600">Completadas</p>
                            <p className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</p>
                        </CardContent>
                    </Card>
                    <Card className="h-full">
                        <CardContent className="pt-2 p-3 md:p-4">
                            <p className="text-xs md:text-sm text-gray-600">Pendientes</p>
                            <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </CardContent>
                    </Card>
                    <Card className="h-full">
                        <CardContent className="pt-2 p-3 md:p-4">
                            <p className="text-xs md:text-sm text-gray-600">Canceladas</p>
                            <p className="text-xl md:text-2xl font-bold text-red-600">{stats.total - stats.completed - stats.pending}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabla de Tareas */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista de Tareas ({displayTasks.length})</CardTitle>
                    <Button
                        onClick={handleOpenDialog}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Agregar Tarea</span>
                        <span className="sm:hidden">+</span>
                    </Button>
                </CardHeader>
                
                {/* Barra de Filtros */}
                <div className="px-6 pt-4 pb-4 border-b">
                    {/* Desktop: Flex layout - búsqueda flexible + selects adaptativos */}
                    <div className="hidden lg:flex gap-2 items-end flex-wrap">
                        <div className="flex-1 min-w-72 space-y-2">
                            <Label htmlFor="filterText">Texto</Label>
                            <Input
                                id="filterText"
                                value={searchFilters.text}
                                onChange={(e) =>
                                    setSearchFilters({
                                        ...searchFilters,
                                        text: e.target.value,
                                    })
                                }
                                placeholder="Buscar..."
                                disabled={isLoading}
                            />
                        </div>

                        <div className="shrink-0 space-y-2">
                            <Label htmlFor="filterStatus" className="text-sm">Estado</Label>
                            <Select
                                value={searchFilters.status}
                                onValueChange={(value) =>
                                    setSearchFilters({ ...searchFilters, status: value })
                                }
                            >
                                <SelectTrigger id="filterStatus" disabled={isLoading} className="h-9 text-sm">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                    <SelectItem value="COMPLETED">Completada</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="shrink-0 space-y-2">
                            <Label htmlFor="filterPriority" className="text-sm">Prioridad</Label>
                            <Select
                                value={searchFilters.priority}
                                onValueChange={(value) =>
                                    setSearchFilters({ ...searchFilters, priority: value })
                                }
                            >
                                <SelectTrigger id="filterPriority" disabled={isLoading} className="h-9 text-sm">
                                    <SelectValue placeholder="Todas" />
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

                            <div className="shrink-0 space-y-2">
                            <Label htmlFor="filterProject" className="text-sm">Proyecto</Label>
                            <Select
                                value={searchFilters.projectId}
                                onValueChange={(value) =>
                                    setSearchFilters({ ...searchFilters, projectId: value })
                                }
                            >
                                <SelectTrigger id="filterProject" disabled={isLoading} className="h-9 text-sm">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {projects.map((project: ProjectSimple) => (
                                        <SelectItem key={project.id} value={String(project.id)}>
                                            {project.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchFilters({
                                        text: "",
                                        status: "all",
                                        priority: "all",
                                        projectId: "all",
                                    });
                                }}
                                disabled={isLoading}
                                className="h-9 px-3"
                                size="sm"
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {/* Mobile y Tablet: Tres filas */}
                    <div className="lg:hidden space-y-3">
                        {/* Primera fila: Búsqueda 100% */}
                        <div className="space-y-2">
                            <Label htmlFor="filterTextMobile">Texto</Label>
                            <Input
                                id="filterTextMobile"
                                value={searchFilters.text}
                                onChange={(e) =>
                                    setSearchFilters({
                                        ...searchFilters,
                                        text: e.target.value,
                                    })
                                }
                                placeholder="Buscar..."
                                disabled={isLoading}
                            />
                        </div>

                        {/* Segunda fila: 3 selects 30% cada uno */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="filterStatusMobile" className="text-xs">Estado</Label>
                                <Select
                                    value={searchFilters.status}
                                    onValueChange={(value) =>
                                        setSearchFilters({ ...searchFilters, status: value })
                                    }
                                >
                                    <SelectTrigger id="filterStatusMobile" disabled={isLoading} className="h-9 text-xs">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="PENDING">Pendiente</SelectItem>
                                        <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                                        <SelectItem value="COMPLETED">Completada</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="filterPriorityMobile" className="text-xs">Prioridad</Label>
                                <Select
                                    value={searchFilters.priority}
                                    onValueChange={(value) =>
                                        setSearchFilters({ ...searchFilters, priority: value })
                                    }
                                >
                                    <SelectTrigger id="filterPriorityMobile" disabled={isLoading} className="h-9 text-xs">
                                        <SelectValue placeholder="Todas" />
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

                            <div className="space-y-2">
                                <Label htmlFor="filterProjectMobile" className="text-xs">Proyecto</Label>
                                <Select
                                    value={searchFilters.projectId}
                                    onValueChange={(value) =>
                                        setSearchFilters({ ...searchFilters, projectId: value })
                                    }
                                >
                                    <SelectTrigger id="filterProjectMobile" disabled={isLoading} className="h-9 text-xs">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {projects.map((project: ProjectSimple) => (
                                            <SelectItem key={project.id} value={String(project.id)}>
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Tercera fila: Botón 100% */}
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchFilters({
                                        text: "",
                                        status: "all",
                                        priority: "all",
                                        projectId: "all",
                                    });
                                }}
                                disabled={isLoading}
                                className="w-full"
                            >
                                Limpiar Filtros
                            </Button>
                        )}
                    </div>
                </div>

                <CardContent className="pt-4">
                    {isLoadingTasks ? (
                        <div className="text-center text-gray-500">Cargando...</div>
                    ) : (
                        <>
                            {/* Vista Desktop - Tabla */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Título</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead>Prioridad</TableHead>
                                            <TableHead>Proyecto</TableHead>
                                            <TableHead>Vencimiento</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {displayTasks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500">
                                                    No hay tareas
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            displayTasks.map((task: TaskItem) => (
                                                <TableRow 
                                                    key={task.id}
                                                    onClick={() => {
                                                        handleSelectTask(task);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    className={`cursor-pointer hover:bg-gray-100 ${
                                                        editingId === task.id ? "bg-blue-50" : ""
                                                    }`}
                                                >
                                                    <TableCell>{task.id}</TableCell>
                                                    <TableCell className="font-medium max-w-xs truncate">
                                                        {task.title}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            task.status === "COMPLETED"
                                                                ? "bg-green-100 text-green-800"
                                                                : task.status === "IN_PROGRESS"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : task.status === "CANCELLED"
                                                                ? "bg-gray-100 text-gray-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}>
                                                            {STATUS_LABELS[task.status ?? ""] ?? task.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            task.priority === "CRITICAL"
                                                                ? "bg-red-100 text-red-800"
                                                                : task.priority === "HIGH"
                                                                ? "bg-orange-100 text-orange-800"
                                                                : task.priority === "MEDIUM"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}>
                                                            {PRIORITY_LABELS[task.priority ?? ""] ?? task.priority}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{getProjectName(task.projectId)}</TableCell>
                                                    <TableCell>{safeFormatDateTime(task.dueDate)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Vista Mobile - Cards */}
                            <div className="md:hidden space-y-3">
                                {displayTasks.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">No hay tareas</div>
                                ) : (
                                    displayTasks.map((task: TaskItem) => (
                                        <div 
                                            key={task.id}
                                            onClick={() => {
                                                handleSelectTask(task);
                                                setIsDialogOpen(true);
                                            }}
                                            className={`border rounded-lg p-3 space-y-2 cursor-pointer ${
                                                editingId === task.id 
                                                    ? "border-blue-500 bg-blue-50" 
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                                                    <p className="text-xs text-gray-500">ID: {task.id}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    task.status === "COMPLETED"
                                                        ? "bg-green-100 text-green-800"
                                                        : task.status === "IN_PROGRESS"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : task.status === "CANCELLED"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                    {STATUS_LABELS[task.status ?? ""] ?? task.status}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    task.priority === "CRITICAL"
                                                        ? "bg-red-100 text-red-800"
                                                        : task.priority === "HIGH"
                                                        ? "bg-orange-100 text-orange-800"
                                                        : task.priority === "MEDIUM"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}>
                                                    {PRIORITY_LABELS[task.priority ?? ""] ?? task.priority}
                                                </span>
                                            </div>

                                            <div className="text-xs space-y-1">
                                                <p className="text-gray-600">
                                                    <span className="font-medium">Proyecto:</span> {getProjectName(task.projectId)}
                                                </p>
                                                {task.estimatedHours && (
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Horas:</span> {task.estimatedHours}h
                                                    </p>
                                                )}
                                                {task.dueDate && (
                                                    <p className="text-gray-600">
                                                        <span className="font-medium">Vencimiento:</span> {safeFormatDateTime(task.dueDate)}
                                                    </p>
                                                )}
                                            </div>

                                            {task.description && (
                                                <p className="text-xs text-gray-600 border-t pt-2 line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para Formulario */}
            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Tarea" : "Nueva Tarea"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Primera fila: Título (70%) y Proyecto (30%) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-10">
                            <div className="space-y-2 md:col-span-7">
                                <Label htmlFor="taskTitle">Título *</Label>
                                <Input
                                    id="taskTitle"
                                    value={taskForm.title}
                                    onChange={(e) => handleTaskInputChange("title", e.target.value)}
                                    placeholder="Título de la tarea"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-3">
                                <Label htmlFor="taskProject">Proyecto *</Label>
                                <Select 
                                    value={taskForm.projectId.toString()}
                                    onValueChange={(value) =>
                                        handleTaskInputChange("projectId", parseInt(value))
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="taskProject">
                                        <SelectValue placeholder="Select project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project: ProjectSimple) => (
                                            <SelectItem 
                                                key={project.id} 
                                                value={project.id.toString()}
                                            >
                                                {project.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Segunda fila: Prioridad (30%), Estado (30%) y Horas Estimadas (30%) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="taskPriority">Prioridad</Label>
                                <Select 
                                    value={taskForm.priority}
                                    onValueChange={(value) =>
                                        handleTaskInputChange("priority", value as TaskPriority)
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="taskPriority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TaskPriorities.map((priority) => (
                                            <SelectItem key={priority} value={priority}>{PRIORITY_LABELS[priority] ?? priority}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="taskStatus">Estado</Label>
                                <Select 
                                    value={taskForm.status}
                                    onValueChange={(value) =>
                                        handleTaskInputChange("status", value as TaskStatus)
                                    }
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="taskStatus">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TaskStatuses.map((status) => (
                                            <SelectItem key={status} value={status}>{STATUS_LABELS[status] ?? status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="taskHours">Horas Estimadas</Label>
                                <Input
                                    id="taskHours"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={taskForm.estimatedHours}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const v = parseFloat(e.target.value);
                                        handleTaskInputChange("estimatedHours", Number.isNaN(v) ? 0 : v);
                                    }}
                                    placeholder="0"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Tercera fila: Fecha de vencimiento (50%) y Hora (50%) */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <DateTimePickerCombined
                                    value={taskForm.dueDate}
                                    onChange={(d) => handleTaskInputChange("dueDate", d)}
                                    _disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Cuarta fila: Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="taskDesc">Descripción</Label>
                            <Textarea
                                id="taskDesc"
                                value={taskForm.description ?? ""}
                                onChange={(e) => handleTaskInputChange("description", e.target.value)}
                                placeholder="Descripción detallada"
                                rows={3}
                                disabled={isLoading}
                            />
                        </div>

                        {/* Última fila: Botones (25% cada uno) */}
                        <div className="grid grid-cols-4 gap-2 pt-4">
                            <Button 
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Cancelar</span>
                            </Button>
                            <Button 
                                onClick={() => void handleAdd()}
                                disabled={editingId ? true : isLoading}
                                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Agregar</span>
                            </Button>
                            <Button 
                                onClick={() => void handleUpdate()}
                                disabled={!editingId || isLoading}
                                className="flex items-center justify-center gap-2"
                            >
                                <Save className="h-4 w-4" />
                                <span className="hidden sm:inline">Actualizar</span>
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => void handleDelete()}
                                disabled={!editingId || deleteMutation.isPending}
                                className="flex items-center justify-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Eliminar</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">¿Estás seguro que deseas eliminar esta tarea? Esta acción no se puede deshacer.</p>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button 
                            variant="outline"
                            onClick={() => setIsConfirmDeleteOpen(false)}
                            disabled={deleteMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={() => void handleConfirmDelete()}
                            disabled={deleteMutation.isPending}
                        >
                            Eliminar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
