"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";
type Task = RouterOutputs["task"]["list"][number];
type Project = RouterOutputs["project"]["list"][number];

export default function CommentTab() {
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");
    const [commentText, setCommentText] = useState("");

    // Get all tasks
    const { data: tasks = [] as Task[] } = api.task.list.useQuery();

    // Get all projects
    const { data: projects = [] as Project[] } = api.project.list.useQuery();

    const taskIdNum = selectedTaskId ? parseInt(selectedTaskId) : null;
    const { data: comments = [], refetch, isLoading } = api.comment.getByTask.useQuery(
        { taskId: taskIdNum ?? 0 },
        { enabled: !!taskIdNum }
    );

    const createMutation = api.comment.create.useMutation({
        onSuccess: () => {
            void refetch();
            setCommentText("");
            toast.success("Comentario agregado");
        },
        onError: (error) => toast.error(error.message ?? "Error al agregar comentario"),
    });

    const handleAddComment = async () => {
        if (!taskIdNum || !commentText.trim()) {
            toast.error("Seleccione una tarea e ingrese un comentario");
            return;
        }
        await createMutation.mutateAsync({ taskId: taskIdNum, text: commentText });
    };

    const handleLoadComments = () => {
        if (!taskIdNum) {
            toast.error("Seleccione una tarea");
            return;
        }
        void refetch();
    };

    type Comment = RouterOutputs["comment"]["getByTask"][number];

    const commentsDisplay = (comments ?? [])
        .map((c: Comment) => `• ${c.text}\n  Por: ${c.user?.name ?? c.user?.username}\n  ${new Date(c.createdAt).toLocaleString()}\n`)
        .join("\n");

    const selectedTask = tasks.find((t) => t.id === taskIdNum);
    const projectName = selectedTask 
        ? projects.find((p: Project) => p.id === selectedTask.projectId)?.name 
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Comentarios</h2>
                <p className="text-muted-foreground">Añade y revisa comentarios de tareas</p>
            </div>
            <Card>
                <CardHeader>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
                        <div className="space-y-2 w-full md:col-span-4">
                            <Label htmlFor="commentTaskSelect">Seleccionar Tarea</Label>
                            <Select 
                                value={selectedTaskId}
                                onValueChange={setSelectedTaskId}
                            >
                                <SelectTrigger id="commentTaskSelect" className="w-full">
                                    <SelectValue placeholder="Seleccione una tarea" />
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

                        {selectedTask && (
                            <>
                                <div className="md:col-span-4">
                                    <p className="text-sm text-gray-600">
                                        Tarea: <span className="font-medium">{selectedTask.title}</span>
                                    </p>
                                </div>
                                <div className="md:col-span-4">
                                    {projectName && (
                                        <p className="text-sm text-gray-600">
                                            Proyecto: <span className="font-medium">{projectName}</span>
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Segunda fila: Comentario */}
                    <div className="space-y-2">
                        <Label htmlFor="comment">Comentario</Label>
                        <Textarea
                            id="comment"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Ingrese su comentario"
                            rows={3}
                            disabled={!taskIdNum}
                        />
                    </div>

                    {/* Tercera fila: Botones 50-50 */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={handleAddComment}
                            disabled={createMutation.isPending || !taskIdNum}
                            className="w-full"
                        >
                            {createMutation.isPending ? "Agregando..." : "Agregar Comentario"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleLoadComments}
                            disabled={isLoading || !taskIdNum}
                            className="w-full"
                        >
                            {isLoading ? "Cargando..." : "Cargar Comentarios"}
                        </Button>
                    </div>

                    {/* Última fila: Área de comentarios */}
                    <div className="space-y-2">
                        <Label>Comentarios ({comments.length})</Label>
                        <Textarea
                            value={commentsDisplay}
                            readOnly
                            placeholder="Los comentarios aparecerán aquí"
                            rows={10}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
