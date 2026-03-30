"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import HealthcareDatabaseTool from "@/app/components/HealthcareDatabaseTool";
import { theme } from "@/lib/theme";

function HealthcareDatabaseContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  return <HealthcareDatabaseTool initialQuery={q || ""} />;
}

export default function HealthcareDatabase() {
  return (
    <Suspense
      fallback={
        <div className={`min-h-screen ${theme.gradients.pageBgClasses} py-12`}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-700 border-r-green-400"></div>
                <p className="mt-4 text-zinc-400">Loading healthcare database...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <HealthcareDatabaseContent />
    </Suspense>
  );
}
