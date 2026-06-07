"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Select";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-primary-light flex items-center justify-center mb-3">
          <Sprout className="h-7 w-7 text-primary" />
        </div>
        <Logo className="text-2xl" />
        <p className="text-sm text-ink-grey mt-1">Soil intelligence for Zimbabwe&apos;s smallholder farmers</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <h1 className="font-semibold text-lg text-ink-dark">Sign in</h1>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-alert-red/30 px-3 py-2 text-sm text-alert-red">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@soilsense.ai"
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="text-xs text-ink-grey text-center mt-6">Mudau Technologies &middot; SoilSense AI Dashboard</p>
    </div>
  );
}
