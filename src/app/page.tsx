"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import LoginForm from "~/components/loginform";
import RegisterForm from "~/components/registerform";

export default function AuthPage() {
  const router = useRouter();
  const [animationDone, setAnimationDone] = useState(false);

  return (
    <>
      <div className="login-bg" />
      
      <main className="login-content p-2">
        <h1
          className={`${animationDone ? "text-white" : "text-reveal"} text-5xl font-bold mb-6 `}
          onAnimationEnd={() => setAnimationDone(true)}
        >
          Legacy App
        </h1>

        <div className="w-full max-w-md">
          <div className="portal-frame mx-auto">
            <div className="login-card">
              <Tabs defaultValue="login" className="auth-tabs w-full">
                <TabsList className="auth-tabs-list w-full mb-6">
                  <TabsTrigger value="login" className="auth-tab-trigger flex-1">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="register" className="auth-tab-trigger flex-1">
                    Registrarse
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <LoginForm onSuccess={() => router.push("/manager")} />
                </TabsContent>
                
                <TabsContent value="register">
                  <RegisterForm />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
