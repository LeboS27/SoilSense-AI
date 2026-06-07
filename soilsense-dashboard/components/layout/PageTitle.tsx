"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "./Topbar";

const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === "/", title: "Overview" },
  { match: (p) => p.startsWith("/readings"), title: "Soil Readings" },
  { match: (p) => p.startsWith("/farmers/new"), title: "Register Farmer" },
  { match: (p) => p.startsWith("/farmers/"), title: "Farmer Profile" },
  { match: (p) => p.startsWith("/farmers"), title: "Farmers" },
  { match: (p) => p.startsWith("/devices"), title: "Device Fleet" },
  { match: (p) => p.startsWith("/plots"), title: "Plot Map" },
  { match: (p) => p.startsWith("/recommendations"), title: "Recommendations" },
  { match: (p) => p.startsWith("/revenue"), title: "Revenue Tracking" },
  { match: (p) => p.startsWith("/settings"), title: "Settings" },
];

export function PageTitle() {
  const pathname = usePathname();
  const found = TITLES.find((t) => t.match(pathname));
  return <Topbar title={found?.title ?? "SoilSense AI"} />;
}
