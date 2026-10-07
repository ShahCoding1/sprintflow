import type { TaskLabelSummary } from "@/features/task/types/task-label.types";

type TaskLabelBadgesProps = {
  labels?: TaskLabelSummary[];
  maxVisible?: number;
};

export default function TaskLabelBadges({
  labels = [],
  maxVisible = 3,
}: TaskLabelBadgesProps) {
  if (labels.length === 0) {
    return null;
  }

  const visibleLabels = labels.slice(
    0,
    maxVisible,
  );

  const remainingCount =
    labels.length - visibleLabels.length;

  return (
    <div
      className="flex min-w-0 flex-wrap gap-1.5"
      aria-label="Task labels"
    >
      {visibleLabels.map((label) => (
        <span
          key={label.id}
          className="inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium"
          style={{
            borderColor: `${label.color}55`,
            backgroundColor: `${label.color}15`,
            color: label.color,
          }}
          title={label.name}
        >
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: label.color,
            }}
            aria-hidden="true"
          />

          <span className="truncate">
            {label.name}
          </span>
        </span>
      ))}

      {remainingCount > 0 && (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}