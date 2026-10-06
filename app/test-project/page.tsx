"use client";

import { useState } from "react";

export default function TestProjectPage() {
  const [result, setResult] = useState("Ready to test...");
  const [loading, setLoading] = useState(false);

  async function createProject() {
    setLoading(true);
    setResult("Creating project...");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "SprintFlow Web App",
          key: "SFW",
          description: "Main SprintFlow application project",
        }),
      });

      const data = await response.json();

      setResult(
        JSON.stringify(
          {
            status: response.status,
            data,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">
          Project API Test
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          This page tests the authenticated Project API.
        </p>

        <button
          type="button"
          onClick={createProject}
          disabled={loading}
          className="mt-6 rounded-md bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Test Project"}
        </button>

        <pre className="mt-6 overflow-auto rounded-lg border bg-muted p-4 text-sm">
          {result}
        </pre>
      </div>
    </main>
  );
}