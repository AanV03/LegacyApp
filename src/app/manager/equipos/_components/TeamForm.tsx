"use client"
import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export default function TeamForm({ onCreate, onCancel }: { onCreate: (t: { name: string; members: string[]; tasks: string[] }) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [membersText, setMembersText] = useState("");
  const [tasksText, setTasksText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const members = membersText.split(",").map((s) => s.trim()).filter(Boolean);
    const tasks = tasksText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!name) return alert("Nombre requerido");
    onCreate({ name, members, tasks });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="mb-1">Nombre del equipo</Label>
            <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="p.ej. Front-end" />
          </div>

          <div>
            <Label className="mb-1">Miembros (separados por coma)</Label>
            <Input value={membersText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMembersText(e.target.value)} placeholder="Ana, Luis, María" />
            <p className="text-xs text-muted-foreground mt-1">Puedes pegar correos o nombres separados por coma.</p>
          </div>

          <div>
            <Label className="mb-1">Tareas iniciales (una por línea)</Label>
            <Textarea value={tasksText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTasksText(e.target.value)} rows={4} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} type="button">Cancelar</Button>
            <Button type="submit">Crear equipo</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
