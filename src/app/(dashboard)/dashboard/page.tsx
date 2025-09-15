// src/app/(dashboard)/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import { FloorSensorCard } from "@/components/FloorSensorCard";

export default function DashboardPage() {
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
          <span className="text-neutral-500 text-sm font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-heading">
          Plant Dashboard
        </h1>
        <p className="text-body text-lg">
          Monitor and control your plant sensors across all floors
        </p>
      </div>
      
      {/* Sensor Cards */}
      <div className="space-y-8">
        <FloorSensorCard floor="floor1" />
        <FloorSensorCard floor="floor2" />
        <FloorSensorCard floor="floor3" />
      </div>
    </div>
  );
}
