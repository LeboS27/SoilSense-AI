"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut, KeyRound, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSignOut } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError, HelperText } from "@/components/ui/Select";
import { useDashboardStore } from "@/store/dashboard";

const passwordSchema = z
  .object({
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const addToast = useDashboardStore((s) => s.addToast);
  const signOut = useSignOut();
  const [email, setEmail] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function onSubmit(values: PasswordFormValues) {
    setUpdating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.new_password });
      if (error) throw error;
      addToast({ variant: "success", title: "Password updated", description: "Your password has been changed successfully." });
      reset();
    } catch (e) {
      addToast({ variant: "error", title: "Could not update password", description: e instanceof Error ? e.message : "An unexpected error occurred" });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold text-ink-dark">Settings</h2>

      <Card title="Account">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary-light text-primary flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-ink-dark">{email ?? "—"}</p>
            <p className="text-xs text-ink-grey">Administrator</p>
          </div>
        </div>
      </Card>

      <Card title="Change Password">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="new_password" required>New Password</Label>
            <Input id="new_password" type="password" {...register("new_password")} placeholder="••••••••" />
            <HelperText>At least 8 characters</HelperText>
            <FieldError message={errors.new_password?.message} />
          </div>
          <div>
            <Label htmlFor="confirm_password" required>Confirm Password</Label>
            <Input id="confirm_password" type="password" {...register("confirm_password")} placeholder="••••••••" />
            <FieldError message={errors.confirm_password?.message} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={updating}>
              <KeyRound className="h-4 w-4" />
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Session">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-grey">Sign out of your account on this device.</p>
          <Button variant="danger" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
