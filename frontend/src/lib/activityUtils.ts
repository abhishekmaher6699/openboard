import type { BoardActivity } from "../types/board";

export const ACTION_LABELS: Record<string, string> = {
  create_shape: "created a shape",
  delete_shape: "deleted a shape",
  delete_many: "deleted multiple shapes",
  move_shape: "moved a shape",
  move_many: "moved multiple shapes",
  resize_shape: "resized a shape",
  resize_many: "resized multiple shapes",
  update_color: "changed color",
  update_color_many: "changed color",
  update_text: "edited text",
  update_object: "updated an object",
  bring_forward: "brought forward",
  send_back: "sent backward",
  bring_to_front: "brought to front",
  send_to_back: "sent to back",
  bold_text: "toggled bold",
  italic_text: "toggled italic",
  font_size: "changed font size",
  align_text: "changed alignment",
  font_family: "changed font",
  text_color: "changed text color",
  restore: "restored the board",
};

export function groupActivities(activities: BoardActivity[]): BoardActivity[][] {
  if (!activities) return [];
  const groups: BoardActivity[][] = [];
  activities.forEach((activity) => {
    const last = groups[groups.length - 1];
    if (
      last &&
      last[0].user?.id === activity.user?.id &&
      last[0].action_type === activity.action_type &&
      new Date(activity.created_at).getTime() -
        new Date(last[last.length - 1].created_at).getTime() < 5000
    ) {
      last.push(activity);
    } else {
      groups.push([activity]);
    }
  });
  return groups;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getAffectedCount(diff: Record<string, any> | null): number | null {
  if (!diff) return null;
  return diff.updates?.length ?? diff.moves?.length ?? diff.resizes?.length ?? diff.objects?.length ?? null;
}

export function getLabelWithCount(label: string, diff: Record<string, any> | null): string {
  const count = getAffectedCount(diff);
  return count && count > 1 ? `${label} (${count} objects)` : label;
}

export function getUserColor(username: string | undefined): string {
  return `hsl(${(username?.charCodeAt(0) ?? 0) * 20}, 60%, 60%)`;
}