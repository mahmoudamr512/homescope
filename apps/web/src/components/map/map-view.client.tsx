"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { createBaseStyle } from "@/lib/basemap";

export default function MapViewClient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(),
      center: [-96, 38.4],
      zoom: 3.45,
      attributionControl: false,
      dragRotate: false,
    });

    let hoveredId: string | number | null = null;

    const clearHover = () => {
      if (hoveredId !== null) {
        map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
        hoveredId = null;
      }
    };

    map.on("load", async () => {
      const res = await fetch("/data/states.geojson");
      const data = await res.json();
      map.addSource("states", { type: "geojson", data, promoteId: "id" });

      // States carry no data in M0, so the fill is a flat neutral.
      // The data-driven choropleth color expression lands in M3.
      map.addLayer({
        id: "states-fill",
        type: "fill",
        source: "states",
        paint: {
          "fill-color": "#D7DEE6",
          "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.95, 0.7],
        },
      });

      map.addLayer({
        id: "states-line",
        type: "line",
        source: "states",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#0F172A",
            "rgba(255,255,255,.6)",
          ],
          "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 1.5, 0.5],
        },
      });

      map.on("mousemove", "states-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.id === undefined) return;
        if (hoveredId !== feature.id) {
          clearHover();
          hoveredId = feature.id;
          map.setFeatureState({ source: "states", id: hoveredId }, { hover: true });
        }
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "states-fill", () => {
        clearHover();
        map.getCanvas().style.cursor = "";
      });
    });

    return () => map.remove();
  }, []);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
