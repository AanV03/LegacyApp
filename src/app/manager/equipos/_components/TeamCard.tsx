"use client"
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

type Task = { id: string; title: string; status: string };
type Team = { id: string; name: string; members: string[]; tasks: Task[] };

export default function TeamCard({ team }: { team: Team }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex items-start justify-between px-4 pt-4">
        <div>
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <div className="text-sm text-muted-foreground">{team.members.length} miembros • {team.tasks.length} tareas</div>
        </div>
        <div className="text-sm text-muted-foreground">ADMIN</div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2">Miembros</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {team.members.map((m, idx) => (
                <div key={idx} className="px-2 py-1 bg-muted rounded-full text-sm">
                  {m}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2">Tareas</Label>
            <ul className="mt-1 space-y-2">
              {team.tasks.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{t.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1">Ver</Button>
          <Button className="flex-1">Asignar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
