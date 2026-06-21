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
  selectedId: string | null;
  focus: { lng: number; lat: number; zoom: number } | null;
  onZoomResolution: (resolution: Resolution) => void;
  onSelect: (regionId: string | null) => void;
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
  selectedId,
  focus,
  onZoomResolution,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  const activeRef = useRef(activeResolution);
  const valuesRef = useRef(values);
  const metricRef = useRef(metric);
  const onZoomRef = useRef(onZoomResolution);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef<{ source: string; id: string } | null>(null);
  activeRef.current = activeResolution;
  valuesRef.current = values;
  metricRef.current = metric;
  onZoomRef.current = onZoomResolution;
  onSelectRef.current = onSelect;

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
          paint: { "fill-color": "#D7DEE6", "fill-opacity": 0.85 },
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
              ["boolean", ["feature-state", "selected"], false],
              "#F4A218",
              ["boolean", ["feature-state", "hover"], false],
              "#0F172A",
              "rgba(255,255,255,0.6)",
            ],
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              2.5,
              ["boolean", ["feature-state", "hover"], false],
              1.4,
              0.4,
            ],
          },
        });
      }
      setLoaded(true);
    });

    map.on("zoomend", () => onZoomRef.current(resolutionForZoom(map.getZoom())));

    map.on("click", (e) => {
      const res = activeRef.current;
      const features = map.queryRenderedFeatures(e.point, { layers: [`${res}-fill`] });
      const feature = features[0];
      onSelectRef.current(feature && feature.id !== undefined ? String(feature.id) : null);
    });

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    let hovered: string | null = null;

    map.on("mousemove", (e) => {
      const res = activeRef.current;
      const feature = map.queryRenderedFeatures(e.point, { layers: [`${res}-fill`] })[0];
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    for (const res of RESOLUTIONS) {
      const visibility = res === activeResolution ? "visible" : "none";
      map.setLayoutProperty(`${res}-fill`, "visibility", visibility);
      map.setLayoutProperty(`${res}-line`, "visibility", visibility);
    }
  }, [activeResolution, loaded]);

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

  // Selection: highlight the selected region and dim the rest.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const res = activeResolution;

    if (selectedRef.current) {
      map.setFeatureState(
        { source: selectedRef.current.source, sourceLayer: "regions", id: selectedRef.current.id },
        { selected: false },
      );
      selectedRef.current = null;
    }
    if (selectedId) {
      map.setFeatureState({ source: res, sourceLayer: "regions", id: selectedId }, { selected: true });
      selectedRef.current = { source: res, id: selectedId };
    }

    const dim = selectedId
      ? (["case", ["boolean", ["feature-state", "selected"], false], 1, 0.5] as const)
      : (["case", ["boolean", ["feature-state", "hover"], false], 1, 0.85] as const);
    map.setPaintProperty(`${res}-fill`, "fill-opacity", dim as unknown as number);
  }, [selectedId, activeResolution, loaded]);

  // Fly to a searched/reset location.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !focus) return;
    map.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom, duration: 800 });
  }, [focus, loaded]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
