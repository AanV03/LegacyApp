"use client";

import React, { useState } from "react";
// using our custom JWT login endpoint instead of next-auth
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailFormatValid = emailRegex.test(email.trim());

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate before submit
    const errors: string[] = [];
    if (!email.trim()) errors.push("email");
    if (!password) errors.push("contraseña");

    if (errors.length > 0) {
      const errorText = errors.length === 2 
        ? "email y contraseña vacíos, favor de llenarlos"
        : `${errors[0]} vacío, favor de llenarlo`;
      toast.error(errorText);
      return;
    }

    // Validate email format
    if (!emailFormatValid) {
      toast.error("Email inválido, favor de corregirlo");
      return;
    }

    const response = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
    });

    const data = (await response.json()) as { ok?: boolean; token?: string; role?: string };
    if (!response.ok) {
      toast.error("Credenciales inválidas, verifica tu correo y contraseña");
      return;
    }

    // Guardar información del usuario en localStorage (incluir role si el backend lo devolvió)
    const storedUser: Record<string, any> = { email, name: email.split("@")[0] };
    if (data?.role) storedUser.role = data.role;
    try {
      localStorage.setItem("user", JSON.stringify(storedUser));
    } catch {}

    toast.success("¡Sesión iniciada!");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="mb-2">
        <Label className="text-white block text-sm font-medium">Correo:</Label>
        <Input 
          className="glass-input"
          type="text"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="email@ejemplo.com" 
        />
      </div>

      <div className="mb-4">
        <Label className="text-white mb-2 block text-sm font-medium">Contraseña:</Label>
        <Input 
          className="glass-input"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder="Contraseña" 
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" className="glass-button">Entrar</Button>
      </div>
    </form>
  );
}
