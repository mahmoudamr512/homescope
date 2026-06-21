import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <AppShell />
    </Suspense>
  );
}
