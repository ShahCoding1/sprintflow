"use client";

import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

import type {
  Sprint,
  SprintStatus,
} from "./SprintCard";

type EditSprintDialogProps = {
  projectId: string;
  sprint: Sprint;
  onUpdated: (sprint: Sprint) => void;
};

function formatDateForInput(
  date: string | null,
) {
  return date ? date.slice(0, 10) : "";
}

export default function EditSprintDialog({
  projectId,
  sprint,
  onUpdated,
}: EditSprintDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(
    sprint.name,
  );
  const [goal, setGoal] = useState(
    sprint.goal ?? "",
  );
  const [status, setStatus] =
    useState<SprintStatus>(sprint.status);
  const [startDate, setStartDate] = useState(
    formatDateForInput(sprint.startDate),
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(sprint.endDate),
  );
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(value: boolean) {
    if (loading) {
      return;
    }

    if (value) {
      setName(sprint.name);
      setGoal(sprint.goal ?? "");
      setStatus(sprint.status);
      setStartDate(
        formatDateForInput(
          sprint.startDate,
        ),
      );
      setEndDate(
        formatDateForInput(
          sprint.endDate,
        ),
      );
      setError("");
    }

    setOpen(value);
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
      new Date(endDate) <
        new Date(startDate)
    ) {
      setError(
        "End date must be on or after the start date.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprints/${sprint.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            goal: goal.trim() || null,
            status,
            startDate: startDate || null,
            endDate: endDate || null,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update sprint.",
        );
      }

      onUpdated(data.sprint);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update sprint.",
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${sprint.name}`}
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit Sprint
          </DialogTitle>

          <DialogDescription>
            Update the sprint name, goal,
            status, and timeline.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-sprint-name">
              Sprint name
            </Label>

            <Input
              id="edit-sprint-name"
              value={name}
              onChange={handleNameChange}
              maxLength={100}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sprint-goal">
              Sprint goal
            </Label>

            <Textarea
              id="edit-sprint-goal"
              value={goal}
              onChange={handleGoalChange}
              maxLength={1000}
              disabled={loading}
              rows={4}
              placeholder="What should this sprint accomplish?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sprint-status">
              Status
            </Label>

            <select
              id="edit-sprint-status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as SprintStatus,
                )
              }
              disabled={loading}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="PLANNED">
                Planned
              </option>
              <option value="ACTIVE">
                Active
              </option>
              <option value="COMPLETED">
                Completed
              </option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-sprint-start">
                Start date
              </Label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="edit-sprint-start"
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
              <Label htmlFor="edit-sprint-end">
                End date
              </Label>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="edit-sprint-end"
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
              onClick={() =>
                setOpen(false)
              }
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

              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}