"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check, X } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Allow common provider domains
  const allowedDomains = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "ymail.com",
    "aol.com",
    "icloud.com",
    "protonmail.com"
  ];

  // Validation
  const nameValid = name.trim().length >= 3;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailFormatValid = emailRegex.test(email.trim());
  
  // Check domain validity
  let emailDomainValid = true;
  if (emailFormatValid) {
    const domain = email.trim().split("@")[1]?.toLowerCase();
    if (domain && !allowedDomains.includes(domain)) {
      emailDomainValid = false;
    }
  }
  
  const emailValidRegister = emailFormatValid && emailDomainValid;
  
  const pwHasMin = password.length >= 8;
  const pwHasNumber = /[0-9]/.test(password);
  const pwHasUpper = /[A-Z]/.test(password);
  const pwHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(password);
  const pwAllValid = pwHasMin && pwHasNumber && pwHasUpper && pwHasSpecial;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    // Build list of invalid fields
    const errors: string[] = [];
    
    if (!name.trim()) errors.push("nombre");
    if (!email.trim()) errors.push("email");
    if (!password) errors.push("contraseña");

    // If fields are empty
    if (errors.length > 0) {
      const errorText = errors.length === 3
        ? "campos vacíos, favor de llenarlos"
        : errors.length === 2
        ? `${errors[0]} y ${errors[1]} vacíos, favor de llenarlos`
        : `${errors[0]} vacío, favor de llenarlo`;
      
      toast.error(errorText);
      return;
    }

    // Validate specific fields
    const fieldErrors: string[] = [];
    
    if (!nameValid) fieldErrors.push("nombre");
    if (!emailValidRegister) fieldErrors.push("email");
    if (!pwAllValid) fieldErrors.push("contraseña");

    if (fieldErrors.length > 0) {
      const errorText = fieldErrors.length === 3
        ? "campos inválidos, favor de corregirlos"
        : fieldErrors.length === 2
        ? `${fieldErrors[0]} y ${fieldErrors[1]} inválidos, favor de corregirlos`
        : `${fieldErrors[0]} inválido, favor de corregirlo`;
      
      toast.error(errorText);
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: trimmedEmail, password: trimmedPassword }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Error creando el usuario");
        setLoading(false);
        return;
      }

      // Try auto-login after successful registration
      try {
        const loginRes = await fetch(`/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: trimmedEmail, password: trimmedPassword }),
        });

        if (!loginRes.ok) {
          // Registration succeeded but login failed — inform the user and stop loading
          toast.success("Usuario creado correctamente. Inicia sesión");
          setLoading(false);
          onSuccess?.();
          return;
        }

        // Store basic user info and redirect to manager
        localStorage.setItem("user", JSON.stringify({ email: trimmedEmail, name: name.trim() }));
        toast.success("Usuario creado y sesión iniciada");
        setLoading(false);
        router.push("/manager");
      } catch {
        toast.success("Usuario creado correctamente. Inicia sesión");
        setLoading(false);
        onSuccess?.();
      }
    } catch {
      toast.error("Error de red, intenta de nuevo");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleRegister}>
      <div className="mb-1">
        <Label className="text-white mb-0.5 block text-xs font-medium">Nombre</Label>
        <Input 
          className={`glass-input transition-colors ${touchedName ? (nameValid ? 'border-success' : 'border-error') : ''}`}
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          onBlur={() => setTouchedName(true)}
          placeholder="Nombre" 
        />
        {touchedName && !nameValid && <p className="text-error text-xs mt-0.5">Mínimo 3 caracteres</p>}
      </div>

      <div className="mb-1">
        <Label className="text-white mb-0.5 block text-xs font-medium">Correo</Label>
        <Input 
          className={`glass-input transition-colors ${touchedEmail ? (emailValidRegister ? 'border-success' : 'border-error') : ''}`}
          type="text" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          onBlur={() => setTouchedEmail(true)}
          placeholder="email@ejemplo.com" 
        />
        {touchedEmail && !emailFormatValid && <p className="text-error text-xs mt-0.5">Formato inválido</p>}
        {touchedEmail && emailFormatValid && !emailDomainValid && <p className="text-error text-xs mt-0.5">Dominio no permitido</p>}
      </div>

      <div className="mb-1">
        <Label className="text-white mb-0.5 block text-xs font-medium">Contraseña</Label>
        <Input 
          className={`glass-input transition-colors ${touchedPassword ? (pwAllValid ? 'border-success' : 'border-error') : ''}`}
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          onBlur={() => setTouchedPassword(true)}
          placeholder="Contraseña" 
        />
        {touchedPassword && !pwAllValid && (
          <div className="mt-0.5 text-xs grid gap-0.5">
            <div className="flex items-center gap-1">
              <div className={`${pwHasMin ? 'text-success' : 'text-gray-400'}`}>
                {pwHasMin ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <div className={`${pwHasMin ? 'text-success' : 'text-gray-400'}`}>8+ caracteres</div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`${pwHasNumber ? 'text-success' : 'text-gray-400'}`}>
                {pwHasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <div className={`${pwHasNumber ? 'text-success' : 'text-gray-400'}`}>Número</div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`${pwHasUpper ? 'text-success' : 'text-gray-400'}`}>
                {pwHasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <div className={`${pwHasUpper ? 'text-success' : 'text-gray-400'}`}>Mayúscula</div>
            </div>
            <div className="flex items-center gap-1">
              <div className={`${pwHasSpecial ? 'text-success' : 'text-gray-400'}`}>
                {pwHasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
              <div className={`${pwHasSpecial ? 'text-success' : 'text-gray-400'}`}>Especial</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={loading} className="glass-button text-sm">
          {loading ? "Creando..." : "Crear cuenta"}
        </Button>
      </div>
    </form>
  );
}
