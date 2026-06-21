"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { type Resolution, type SearchResult, fetchSearch } from "@/lib/api";

const RES_LABEL: Record<Resolution, string> = {
  state: "STATE",
  metro: "METRO",
  county: "COUNTY",
  zip: "ZIP",
};

export function SearchBox({ onPick }: { onPick: (result: SearchResult) => void }) {
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), 200);
    return () => clearTimeout(id);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => fetchSearch(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const results = data ?? [];

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search state, metro, county, or ZIP"
        aria-label="Search locations"
        style={input}
      />
      {open && results.length > 0 && (
        <ul role="listbox" style={dropdown}>
          {results.map((r) => (
            <li key={r.regionId}>
              <button
                type="button"
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                  setValue(r.name);
                }}
                style={row}
              >
                <span style={{ color: "var(--text-primary)" }}>{r.name}</span>
                <span style={chip}>{RES_LABEL[r.resolution]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 12px",
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border)",
  background: "var(--surface-sunken)",
  color: "var(--text-primary)",
  font: "400 13px var(--font-ui)",
};

const dropdown: React.CSSProperties = {
  position: "absolute",
  top: 40,
  left: 0,
  right: 0,
  margin: 0,
  padding: 4,
  listStyle: "none",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  boxShadow: "var(--e-2)",
  maxHeight: 320,
  overflowY: "auto",
  zIndex: 50,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  padding: "8px 10px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  borderRadius: "var(--r-sm)",
  font: "500 13px var(--font-ui)",
};

const chip: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 7px",
  borderRadius: "var(--r-full)",
  background: "var(--surface-sunken)",
  color: "var(--text-secondary)",
};
