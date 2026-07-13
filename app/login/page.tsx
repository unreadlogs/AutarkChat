"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("admin_secret", data.secret);
      toast.success("Authorized successfully!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-[350px] space-y-8">
        <div className="space-y-3 text-center flex flex-col items-center">
          {/* Autark Logo */}
          <div className="size-12 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-center p-2.5 shadow-sm">
            <img src="/autark.svg" alt="Autark Logo" className="size-full dark:invert" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight -tracking-[0.9px]">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Enter administrative password to proceed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-normal text-muted-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="flex h-10 w-full rounded-none border-b border-border/60 bg-transparent py-2 pr-10 text-sm transition-all focus:border-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center text-muted-foreground/80 hover:text-foreground transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Verifying..." : "Access Console"}
          </Button>
        </form>
      </div>
    </div>
  );
}
