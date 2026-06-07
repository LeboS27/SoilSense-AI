import { Badge } from "@/components/ui/Badge";

const STATUS_TONE: Record<string, "green" | "grey" | "orange" | "red"> = {
  available: "grey",
  deployed: "green",
  maintenance: "orange",
  retired: "red",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  deployed: "Deployed",
  maintenance: "Maintenance",
  retired: "Retired",
};

export function DeviceStatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "grey"}>{STATUS_LABEL[status] ?? status}</Badge>;
}
