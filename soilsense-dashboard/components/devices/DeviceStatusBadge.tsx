import { Badge } from "@/components/ui/Badge";

const STATUS_TONE: Record<string, "green" | "grey" | "orange" | "red"> = {
  online: "green",
  offline: "grey",
  syncing: "orange",
  error: "red",
};

const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  syncing: "Syncing",
  error: "Error",
};

export function DeviceStatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "grey"}>{STATUS_LABEL[status] ?? status}</Badge>;
}
