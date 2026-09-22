"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<
    "google" | "github" | null
  >(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Invalid email or password.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleOAuth(provider: "google" | "github") {
    setOauthLoading(provider);
    setError("");

    await signIn(provider, {
      callbackUrl: "/dashboard",
    });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tight">
              SprintFlow
            </Link>

            <div className="mt-24 max-w-lg">
              <p className="text-sm font-medium uppercase tracking-widest opacity-80">
                Project management
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                Welcome back.
              </h1>

              <p className="mt-6 text-base leading-7 opacity-80">
                Continue planning sprints, managing tasks, collaborating with
                your team, and tracking project performance.
              </p>
            </div>
          </div>

          <p className="text-sm opacity-70">
            SprintFlow — Modern agile project management.
          </p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link
                href="/"
                className="text-2xl font-bold tracking-tight lg:hidden"
              >
                SprintFlow
              </Link>

              <h2 className="mt-8 text-2xl font-semibold tracking-tight lg:mt-0">
                Sign in to SprintFlow
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Enter your credentials to continue.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={oauthLoading !== null || isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
              >
                {oauthLoading === "google" && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Google
              </button>

              <button
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={oauthLoading !== null || isLoading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
              >
                {oauthLoading === "github" && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                GitHub
              </button>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />

              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Or continue with email
              </span>

              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Forgot password?
                  </Link>
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  maxLength={128}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || oauthLoading !== null}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
              >
                {isLoading && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}