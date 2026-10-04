import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginRequestSchema, type LoginRequest } from "@timetable/shared";
import { Button } from "@/components/ui/button";
import { setSessionToken } from "./adminSession.js";

const inputClass =
  "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * Admin login form. Validates with the shared `loginRequestSchema`, POSTs to
 * `/api/admin/login`, stores the returned session token, and calls `onSuccess`.
 * On failure it shows an error and keeps the user on the form.
 */
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({ defaultValues: { username: "", password: "" } });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: LoginRequest) {
    setError(null);
    const parsed = loginRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
        return;
      }
      const data = (await res.json()) as { token: string };
      setSessionToken(data.token);
      onSuccess();
    } catch {
      setError("Không thể đăng nhập. Vui lòng thử lại.");
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">Đăng nhập quản trị</h1>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="username" className="text-sm font-medium">
            Tên đăng nhập
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={inputClass}
            {...register("username", { required: true })}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-destructive">
              Vui lòng nhập tên đăng nhập.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClass}
            {...register("password", { required: true })}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              Vui lòng nhập mật khẩu.
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
      </form>
    </main>
  );
}
