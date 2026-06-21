"use client";

import maplibregl, { type Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useState } from "react";
import { type MetricKey, getMetric } from "@homescope/contract";
import { RESOLUTIONS, type Resolution, resolutionForZoom } from "@/lib/api";
import { createBaseStyle } from "@/lib/basemap";
import { formatValue } from "@/lib/format";
import { buildFillColor } from "@/lib/ramps";

let protocolRegistered = false;

interface Props {
  activeResolution: Resolution;
  metric: MetricKey;
  values: Record<string, number> | undefined;
  domain: [number, number] | undefined;
  colorblind: boolean;
  onZoomResolution: (resolution: Resolution) => void;
}

function nodataColor(): string {
  if (typeof window === "undefined") return "#E2E6EB";
  return (
    getComputedStyle(document.documentElement).getPropertyValue("--map-nodata-fill").trim() ||
    "#E2E6EB"
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function MapViewClient({
  activeResolution,
  metric,
  values,
  domain,
  colorblind,
  onZoomResolution,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Latest props for use inside imperative map event handlers.
  const activeRef = useRef(activeResolution);
  const valuesRef = useRef(values);
  const metricRef = useRef(metric);
  const onZoomRef = useRef(onZoomResolution);
  activeRef.current = activeResolution;
  valuesRef.current = values;
  metricRef.current = metric;
  onZoomRef.current = onZoomResolution;

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    if (!protocolRegistered) {
      const protocol = new Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile);
      protocolRegistered = true;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(),
      center: [-96, 38.4],
      zoom: 3.45,
      attributionControl: false,
      dragRotate: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      const origin = window.location.origin;
      for (const res of RESOLUTIONS) {
        map.addSource(res, {
          type: "vector",
          url: `pmtiles://${origin}/tiles/${res}.pmtiles`,
          promoteId: { regions: "id" },
        });
        map.addLayer({
          id: `${res}-fill`,
          type: "fill",
          source: res,
          "source-layer": "regions",
          layout: { visibility: "none" },
          paint: {
            "fill-color": "#D7DEE6",
            "fill-opacity": 0.85,
          },
        });
        map.addLayer({
          id: `${res}-line`,
          type: "line",
          source: res,
          "source-layer": "regions",
          layout: { visibility: "none" },
          paint: {
            "line-color": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              "#0F172A",
              "rgba(255,255,255,0.6)",
            ],
            "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 1.4, 0.4],
          },
        });
      }
      setLoaded(true);
    });

    map.on("zoomend", () => onZoomRef.current(resolutionForZoom(map.getZoom())));

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    let hovered: string | null = null;

    map.on("mousemove", (e) => {
      const res = activeRef.current;
      const features = map.queryRenderedFeatures(e.point, { layers: [`${res}-fill`] });
      const feature = features[0];
      if (!feature || feature.id === undefined) {
        if (hovered !== null) {
          map.setFeatureState({ source: res, sourceLayer: "regions", id: hovered }, { hover: false });
          hovered = null;
        }
        popup.remove();
        map.getCanvas().style.cursor = "";
        return;
      }
      const id = String(feature.id);
      if (hovered !== id) {
        if (hovered !== null) {
          map.setFeatureState({ source: res, sourceLayer: "regions", id: hovered }, { hover: false });
        }
        hovered = id;
        map.setFeatureState({ source: res, sourceLayer: "regions", id }, { hover: true });
      }
      map.getCanvas().style.cursor = "pointer";
      const props = feature.properties as { name?: string } | null;
      const name = props?.name ?? id;
      const def = getMetric(metricRef.current);
      const value = valuesRef.current?.[id];
      const valueText = value === undefined ? "No data" : formatValue(value, def.format);
      popup
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font:600 12px var(--font-ui);color:#0F172A;">${escapeHtml(name)}</div>` +
            `<div style="font:500 12px var(--font-ui);color:#475569;">${escapeHtml(def.label)}: ${valueText}</div>`,
        )
        .addTo(map);
    });

    return () => {
      popup.remove();
      map.remove();
      mapRef.current = null;
      setLoaded(false);
    };
  }, []);

  // Toggle which resolution's layers are visible.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    for (const res of RESOLUTIONS) {
      const visibility = res === activeResolution ? "visible" : "none";
      map.setLayoutProperty(`${res}-fill`, "visibility", visibility);
      map.setLayoutProperty(`${res}-line`, "visibility", visibility);
    }
  }, [activeResolution, loaded]);

  // Recolor and hydrate feature-state for the active resolution.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !values || !domain) return;
    const res = activeResolution;
    const ramp = getMetric(metric).ramp;
    map.setPaintProperty(`${res}-fill`, "fill-color", buildFillColor(ramp, domain, colorblind, nodataColor()));
    map.removeFeatureState({ source: res, sourceLayer: "regions" });
    for (const [id, value] of Object.entries(values)) {
      map.setFeatureState({ source: res, sourceLayer: "regions", id }, { value });
    }
  }, [loaded, activeResolution, metric, values, domain, colorblind]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
