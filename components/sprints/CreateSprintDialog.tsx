"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { Sprint } from "./SprintCard";

type CreateSprintDialogProps = {
  projectId: string;
  onCreated: (sprint: Sprint) => void;
};

export default function CreateSprintDialog({
  projectId,
  onCreated,
}: CreateSprintDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setName("");
    setGoal("");
    setStartDate("");
    setEndDate("");
    setError("");
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);

    if (!value && !loading) {
      resetForm();
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (name.trim().length < 2) {
      setError(
        "Sprint name must be at least 2 characters.",
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      setError(
        "End date must be on or after the start date.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprints`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            goal: goal.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create sprint.",
        );
      }

      onCreated(data.sprint);

      resetForm();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create sprint.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setName(event.target.value);
  }

  function handleGoalChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    setGoal(event.target.value);
  }

  function handleStartDateChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setStartDate(event.target.value);
  }

  function handleEndDateChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setEndDate(event.target.value);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger>
        <Button type="button">
          <Plus className="size-4" />
          New Sprint
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Create Sprint
          </DialogTitle>

          <DialogDescription>
            Create a sprint and define its goal and
            timeline.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="sprint-name">
              Sprint name
            </Label>

            <Input
              id="sprint-name"
              value={name}
              onChange={handleNameChange}
              placeholder="Sprint 1"
              maxLength={100}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">
              Sprint goal
            </Label>

            <Textarea
              id="sprint-goal"
              value={goal}
              onChange={handleGoalChange}
              placeholder="What should this sprint accomplish?"
              maxLength={1000}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">
                Start date
              </Label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="sprint-start"
                  type="date"
                  value={startDate}
                  onChange={
                    handleStartDateChange
                  }
                  disabled={loading}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sprint-end">
                End date
              </Label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="sprint-end"
                  type="date"
                  value={endDate}
                  onChange={
                    handleEndDateChange
                  }
                  disabled={loading}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                loading || !name.trim()
              }
            >
              {loading && (
                <Loader2 className="size-4 animate-spin" />
              )}

              Create Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}