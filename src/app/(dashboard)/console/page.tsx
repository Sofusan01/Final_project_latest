// src/app/(dashboard)/console/page.tsx
"use client";
import { useState, useEffect } from "react";
import RelayConsole from "@/components/RelayConsole";

export default function ConsolePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a brief loading state to prevent flickering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-neutral-400 border-r-neutral-600"></div>
          </div>
          <span className="text-neutral-500 text-sm font-medium">Loading console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-heading">
          Control Console
        </h1>
        <p className="text-body text-lg">
          Manage and control your plant systems across all floors
        </p>
      </div>
      
      {/* Console Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <RelayConsole floor="floor1" />
        <RelayConsole floor="floor2" />
        <RelayConsole floor="floor3" />
      </div>
    </div>
  );
}
