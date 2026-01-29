"use client";

import { api } from "~/trpc/react";
import { useMemo } from "react";

interface Task {
    id?: string | number;
    status?: string | null;
    title?: string | null;
    name?: string | null;
}

export default function MyTasksCard({ _userEmail }: { _userEmail?: string }) {
    const query = api.task.list.useQuery();
    const tasks = useMemo(() => (query.data ?? []) as Task[], [query.data]);
    const isLoading = query.isLoading;

    return (
        <div className="p-4 bg-card rounded-lg border shadow-sm">
            <div className="mb-2">
                <h4 className="font-semibold">Mis tareas</h4>
            </div>

            {isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando...</div>
            ) : tasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aún sin tareas</div>
            ) : (
                <ul className="space-y-2">
                    {tasks.map((t: Task) => (
                        <li key={t.id} className="flex items-center justify-between">
                            <div className={`text-sm ${t.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>{t.title ?? t.name}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
