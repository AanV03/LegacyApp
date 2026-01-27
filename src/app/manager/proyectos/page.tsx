"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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
import { Plus, X, Save, Trash2 } from "lucide-react";

interface ProjectFormData {
    id?: number;
    name: string;
    description?: string;
}

interface Project {
    id: number;
    name: string;
    description?: string | null;
    _count?: {
        tasks?: number;
    };
}

export default function ProjectTab() {
    const [projectForm, setProjectForm] = useState<ProjectFormData>({
        name: "",
        description: "",
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // tRPC hooks
    const { data: projects = [], refetch: refetchProjects, isLoading } = api.project.list.useQuery();
    const createMutation = api.project.create.useMutation({
        onSuccess: () => {
            void refetchProjects();
            setProjectForm({ name: "", description: "" });
            setEditingId(null);
            setIsDialogOpen(false);
            toast.success("Project created successfully");
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to create project");
        },
    });
    const updateMutation = api.project.update.useMutation({
        onSuccess: () => {
            void refetchProjects();
            setProjectForm({ name: "", description: "" });
            setEditingId(null);
            setIsDialogOpen(false);
            toast.success("Project updated successfully");
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to update project");
        },
    });
    const deleteMutation = api.project.delete.useMutation({
        onSuccess: () => {
            void refetchProjects();
            setProjectForm({ name: "", description: "" });
            setEditingId(null);
            setIsDialogOpen(false);
            setIsConfirmDeleteOpen(false);
            toast.success("Project deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message ?? "Failed to delete project");
        },
    });

    const handleProjectInputChange = (field: string, value: string) => {
        setProjectForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAdd = async () => {
        if (!projectForm.name.trim()) {
            toast.error("Project name is required");
            return;
        }
        await createMutation.mutateAsync({
            name: projectForm.name,
            description: projectForm.description,
        });
    };

    const handleUpdate = async () => {
        if (!editingId) {
            toast.error("No project selected for editing");
            return;
        }
        if (!projectForm.name.trim()) {
            toast.error("Project name is required");
            return;
        }
        await updateMutation.mutateAsync({
            id: editingId,
            name: projectForm.name,
            description: projectForm.description,
        });
    };

    const handleDelete = async () => {
        if (!editingId) {
            toast.error("No project selected for deletion");
            return;
        }
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!editingId) return;
        await deleteMutation.mutateAsync({ id: editingId });
        setIsConfirmDeleteOpen(false);
    };

    const handleSelectProject = (project: Project) => {
        setProjectForm({
            id: project.id,
            name: project.name,
            description: project.description ?? undefined,
        });
        setEditingId(project.id);
    };

    const handleClear = () => {
        setProjectForm({ name: "", description: "" });
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

    return (
        <div className="space-y-4">
            {/* Tabla de Proyectos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lista de Proyectos ({projects.length})</CardTitle>
                    <Button
                        onClick={handleOpenDialog}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nuevo Proyecto</span>
                        <span className="sm:hidden">+</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center text-gray-500">Cargando...</div>
                    ) : (
                        <>
                            {/* Vista Desktop - Tabla */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Tareas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projects.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-gray-500">
                                                    No hay proyectos
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            projects.map((project: Project) => (
                                                <TableRow 
                                                    key={project.id}
                                                    onClick={() => {
                                                        handleSelectProject(project);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    className={`cursor-pointer hover:bg-gray-100 ${editingId === project.id ? 'bg-blue-50' : ''}`}
                                                >
                                                    <TableCell>{project.id}</TableCell>
                                                    <TableCell className="font-medium">{project.name}</TableCell>
                                                    <TableCell>{project.description ?? "—"}</TableCell>
                                                    <TableCell>{project._count?.tasks ?? 0}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Vista Mobile - Cards */}
                            <div className="md:hidden space-y-3">
                                {projects.length === 0 ? (
                                    <div className="text-center text-gray-500 py-4">No hay proyectos</div>
                                ) : (
                                    projects.map((project: Project) => (
                                        <div 
                                            key={project.id}
                                            onClick={() => {
                                                handleSelectProject(project);
                                                setIsDialogOpen(true);
                                            }}
                                            className={`border rounded-lg p-3 space-y-2 cursor-pointer ${
                                                editingId === project.id 
                                                    ? "border-blue-500 bg-blue-50" 
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                                                    <p className="text-xs text-gray-500">ID: {project.id}</p>
                                                </div>
                                            </div>

                                            <div className="text-xs space-y-1">
                                                <p className="text-gray-600">
                                                    <span className="font-medium">Tareas:</span> {project._count?.tasks ?? 0}
                                                </p>
                                            </div>

                                            {project.description && (
                                                <p className="text-xs text-gray-600 border-t pt-2 line-clamp-2">
                                                    {project.description}
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Editar Proyecto" : "Nuevo Proyecto"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Nombre *</Label>
                            <Input
                                id="projectName"
                                value={projectForm.name}
                                onChange={(e) =>
                                    handleProjectInputChange("name", e.target.value)
                                }
                                placeholder="Nombre del proyecto"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="projectDesc">Descripción</Label>
                            <Textarea
                                id="projectDesc"
                                value={projectForm.description ?? ""}
                                onChange={(e) =>
                                    handleProjectInputChange("description", e.target.value)
                                }
                                placeholder="Descripción del proyecto"
                                rows={3}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-4">
                            <Button 
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                                className="flex items-center justify-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                <span className="hidden sm:inline">Cancelar</span>
                            </Button>
                            <Button 
                                onClick={() => void handleAdd()}
                                disabled={editingId ? true : createMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Agregar</span>
                            </Button>
                            <Button 
                                onClick={() => void handleUpdate()}
                                disabled={!editingId || updateMutation.isPending}
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

            {/* Dialog de Confirmación para Eliminar */}
            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Confirmar eliminación</DialogTitle>
                    </DialogHeader>
                    <p className="text-gray-600">¿Estás seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.</p>
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
