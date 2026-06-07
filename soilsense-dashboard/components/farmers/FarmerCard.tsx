import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { avatarColour, initials, timeAgo, cn } from "@/lib/utils";
import { LANGUAGE_FLAGS, type Farmer, type Language } from "@/types";

const SUBSCRIPTION_TONE: Record<string, "green" | "grey" | "red"> = {
  active: "green",
  paused: "grey",
  cancelled: "red",
};

const SUBSCRIPTION_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
};

export interface FarmerCardData extends Farmer {
  plotCount: number;
  deviceCount: number;
  lastReadingAt: string | null;
}

export function FarmerCard({ farmer }: { farmer: FarmerCardData }) {
  const lang = (["en", "sn", "nd"].includes(farmer.language) ? farmer.language : "en") as Language;

  return (
    <Link href={`/farmers/${farmer.id}`} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("h-11 w-11 rounded-full flex items-center justify-center font-semibold text-sm shrink-0", avatarColour(farmer.full_name))}>
            {initials(farmer.full_name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-dark truncate">{farmer.full_name}</p>
            <p className="text-xs text-ink-grey truncate">{farmer.phone_number}</p>
          </div>
        </div>
        <Badge tone={SUBSCRIPTION_TONE[farmer.subscription_status] ?? "grey"} strikethrough={farmer.subscription_status === "cancelled"}>
          {SUBSCRIPTION_LABEL[farmer.subscription_status] ?? farmer.subscription_status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-grey flex-wrap">
        <span>{farmer.district}</span>
        <span>&middot;</span>
        <span className="font-medium text-ink-dark">{LANGUAGE_FLAGS[lang]}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-100 pt-3">
        <div>
          <p className="font-semibold text-ink-dark">{farmer.plotCount}</p>
          <p className="text-ink-grey">Plots</p>
        </div>
        <div>
          <p className="font-semibold text-ink-dark">{farmer.deviceCount}</p>
          <p className="text-ink-grey">Devices</p>
        </div>
        <div>
          <p className="font-semibold text-ink-dark">{farmer.lastReadingAt ? timeAgo(farmer.lastReadingAt) : "—"}</p>
          <p className="text-ink-grey">Last reading</p>
        </div>
      </div>

      {farmer.cooperative && <p className="text-xs italic text-ink-grey truncate">{farmer.cooperative}</p>}
    </Link>
  );
}

export function FarmerCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-11 w-11 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-3 w-1/3" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
