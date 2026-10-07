export type TaskLabelSummary = {
  id: string;
  name: string;
  color: string;
};

export type TaskLabelAssignmentSummary = {
  label: TaskLabelSummary;
};