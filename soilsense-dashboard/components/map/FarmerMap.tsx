"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { STATUS_COLOURS } from "@/lib/utils";
import { cropLabel } from "@/types";
import type { OverallStatus } from "@/lib/soil-thresholds";

const STATUS_HEX: Record<OverallStatus | "stale", string> = {
  good: "#1A6B3A",
  warning: "#F57C00",
  critical: "#D32F2F",
  stale: "#9CA3AF",
};

export interface MapPlotMarker {
  id: string;
  farmerId: string;
  farmerName: string;
  plotName: string;
  crop: string;
  cropOther?: string | null;
  latitude: number;
  longitude: number;
  status: OverallStatus | "stale";
  latestReadingId?: string | null;
  ph?: number | null;
  moisture?: number | null;
  nitrogen?: number | null;
}

const BULAWAYO: [number, number] = [-20.15, 28.58];

function buildPopupHtml(marker: MapPlotMarker): string {
  const statusLabel = marker.status === "stale" ? "No recent data" : marker.status[0].toUpperCase() + marker.status.slice(1);
  const statusColour = STATUS_HEX[marker.status];
  return `
    <div style="font-family: inherit; min-width: 200px;">
      <p style="font-weight:600;color:#1A1A1A;margin:0 0 2px;">${marker.farmerName}</p>
      <p style="font-size:12px;color:#555;margin:0 0 8px;">${cropLabel(marker.crop, marker.cropOther)} &middot; ${marker.plotName}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <div style="background:#F7F9F7;border-radius:6px;padding:6px 8px;">
          <p style="font-size:10px;color:#555;margin:0;">pH</p>
          <p style="font-size:13px;font-weight:600;margin:0;">${marker.ph ?? "—"}</p>
        </div>
        <div style="background:#F7F9F7;border-radius:6px;padding:6px 8px;">
          <p style="font-size:10px;color:#555;margin:0;">Moisture</p>
          <p style="font-size:13px;font-weight:600;margin:0;">${marker.moisture ?? "—"}%</p>
        </div>
        <div style="background:#F7F9F7;border-radius:6px;padding:6px 8px;">
          <p style="font-size:10px;color:#555;margin:0;">Nitrogen</p>
          <p style="font-size:13px;font-weight:600;margin:0;">${marker.nitrogen ?? "—"}</p>
        </div>
        <div style="background:${statusColour}1A;border-radius:6px;padding:6px 8px;display:flex;align-items:center;">
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${statusColour};">
            <span style="height:6px;width:6px;border-radius:50%;background:${statusColour};display:inline-block;"></span>
            ${statusLabel}
          </span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        ${
          marker.latestReadingId
            ? `<a href="/readings/${marker.latestReadingId}" style="font-size:12px;color:#1A6B3A;font-weight:600;text-decoration:none;">View Latest Reading →</a>`
            : ""
        }
        <a href="/farmers/${marker.farmerId}" style="font-size:12px;color:#1565C0;font-weight:600;text-decoration:none;">View Farmer Profile →</a>
      </div>
    </div>
  `;
}

export function FarmerMap({
  markers,
  height = 280,
  zoom = 11,
  scrollWheelZoom = true,
  className,
  onMarkerClick,
  focusId,
}: {
  markers: MapPlotMarker[];
  height?: number | string;
  zoom?: number;
  scrollWheelZoom?: boolean;
  className?: string;
  onMarkerClick?: (marker: MapPlotMarker) => void;
  focusId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Record<string, L.CircleMarker>>({});
  const router = useRouter();

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: BULAWAYO,
      zoom,
      scrollWheelZoom,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerRefs.current = {};

    markers.forEach((marker) => {
      const colour = STATUS_HEX[marker.status];
      const circle = L.circleMarker([marker.latitude, marker.longitude], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: colour,
        fillOpacity: 0.9,
      });

      circle.bindPopup(buildPopupHtml(marker), { maxWidth: 260 });

      circle.on("click", () => {
        onMarkerClick?.(marker);
      });

      // Intercept internal links rendered inside the Leaflet popup so Next.js router handles them
      circle.on("popupopen", (e) => {
        const el = (e.popup as L.Popup).getElement();
        el?.querySelectorAll("a[href]").forEach((a) => {
          a.addEventListener("click", (evt) => {
            evt.preventDefault();
            const href = a.getAttribute("href");
            if (href) router.push(href);
          });
        });
      });

      circle.addTo(layer);
      markerRefs.current[marker.id] = circle;
    });
  }, [markers, onMarkerClick, router]);

  // Pan to focused marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const marker = markers.find((m) => m.id === focusId);
    const circle = markerRefs.current[focusId];
    if (marker && circle) {
      map.setView([marker.latitude, marker.longitude], Math.max(map.getZoom(), 13), { animate: true });
      circle.openPopup();
    }
  }, [focusId, markers]);

  return <div ref={containerRef} className={className} style={{ height }} />;
}
