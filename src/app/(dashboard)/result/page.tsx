"use client";
import { useState, useEffect, useMemo } from "react";
import ResultChart from "@/components/ResultChart";
import {
  Thermometer,
  Droplets,
  Waves,
  FlaskConical,
  Sun,
  Zap,
  BarChart3,
  Grid3X3,
  List,
  Info,
} from "lucide-react";

const SENSORS = [
  { key: "ph", label: "pH", icon: FlaskConical },
  { key: "ec", label: "EC", icon: Zap },
  { key: "temp", label: "Temperature", icon: Thermometer },
  { key: "humid", label: "Humidity", icon: Droplets },
  { key: "wt", label: "Water Temperature", icon: Waves },
  { key: "lux", label: "Light", icon: Sun },
] as const;

const VIEW_MODES = [
  { key: "single", label: "Single", icon: BarChart3 },
  { key: "grid", label: "Grid", icon: Grid3X3 },
  { key: "list", label: "List", icon: List },
] as const;

const RANGE_OPTIONS = [
  { label: "24H", value: 24 },
  { label: "3Days", value: 72 },
  { label: "7Days", value: 168 },
  { label: "1M", value: 720 },
  { label: "6M", value: 4320 },
  { label: "1Y", value: 8760 },
];

type SensorKey = (typeof SENSORS)[number]["key"];
type ViewKey = (typeof VIEW_MODES)[number]["key"];

export default function ResultPage() {
  const [viewMode, setViewMode] = useState<ViewKey>("single");
  const [sensor, setSensor] = useState<SensorKey>("ph");
  const [rangeHours, setRangeHours] = useState<number>(24);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent flicker on mount
    const timer = setTimeout(() => setIsLoading(false), 120);
    return () => clearTimeout(timer);
  }, []);

  const currentSensor = useMemo(
    () => SENSORS.find((s) => s.key === sensor),
    [sensor]
  );
  const CurrentIcon = currentSensor?.icon || BarChart3;

  // compare mode removed

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-400" />
          <span className="text-neutral-500 text-lg">Loading results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-heading text-2xl md:text-3xl font-semibold tracking-tight">
                Results & Analysis
              </h1>
              <p className="text-muted text-sm md:text-base mt-1">
                View sensor data trends over time and compare values between multiple variables
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-neutral-500">
              <Info className="w-4 h-4" />
              <span className="text-sm">Values shown are data for the selected time period</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* View Mode Segmented */}
            <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
              {VIEW_MODES.map((mode) => {
                const Icon = mode.icon;
                const active = viewMode === mode.key;
                return (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key)}
                    className={[
                      "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200",
                    ].join(" ")}
                    type="button"
                    title={mode.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Range Selector */}
            <div className="flex flex-wrap gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1">
              {RANGE_OPTIONS.map((opt) => {
                const active = rangeHours === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRangeHours(opt.value)}
                    className={[
                      "px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/60",
                      active
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200",
                    ].join(" ")}
                    type="button"
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sensor Selector */}
          {viewMode === "single" && (
            <div className="flex flex-wrap gap-2">
              {SENSORS.map((s) => {
                const Icon = s.icon;
                const isActive = sensor === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSensor(s.key)}
                    className={[
                      "flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500/60",
                      isActive
                        ? "bg-neutral-900 text-white border-transparent shadow"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-neutral-200",
                    ].join(" ")}
                    type="button"
                    aria-pressed={isActive}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* compare mode removed */}
        </div>

        {/* Content */}
        {viewMode === "single" && (
          <SingleView
            sensor={sensor}
            currentSensor={currentSensor}
            CurrentIcon={CurrentIcon}
            rangeHours={rangeHours}
          />
        )}
        {viewMode === "grid" && <GridView rangeHours={rangeHours} />}
        {viewMode === "list" && <ListView rangeHours={rangeHours} />}

        {/* compare mode removed */}
      </div>
    </div>
  );
}

/* Single Chart View */
function SingleView({
  sensor,
  currentSensor,
  CurrentIcon,
  rangeHours,
}: {
  sensor: (typeof SENSORS)[number]["key"];
  currentSensor: (typeof SENSORS)[number] | undefined;
  CurrentIcon: React.ComponentType<{ className?: string }>;
  rangeHours: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 rounded-lg">
            <CurrentIcon className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-heading">
              {currentSensor?.label}
            </h2>
            <p className="text-muted text-sm">Compare data across 3 floors</p>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <ResultChart sensorKey={sensor} rangeHours={rangeHours} />
      </div>
    </div>
  );
}

/* Reusable Sensor Chart Card */
function SensorChartCard({
  sensor,
  rangeHours,
  compact = false,
}: {
  sensor: (typeof SENSORS)[number];
  rangeHours: number;
  compact?: boolean;
}) {
  const Icon = sensor.icon;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-neutral-600" />
          <h3 className="font-medium text-heading text-sm truncate">
            {sensor.label}
          </h3>
        </div>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <ResultChart
          sensorKey={sensor.key}
          height={compact ? 220 : 280}
          showHeader={false}
          compact={true}
          rangeHours={rangeHours}
        />
      </div>
    </div>
  );
}

/* Grid View */
function GridView({ rangeHours }: { rangeHours: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SENSORS.map((sensor) => (
        <SensorChartCard
          key={sensor.key}
          sensor={sensor}
          rangeHours={rangeHours}
          compact
        />
      ))}
    </div>
  );
}

/* List / Stacked View */
function ListView({ rangeHours }: { rangeHours: number }) {
  return (
    <div className="space-y-4">
      {SENSORS.map((sensor) => (
        <SensorChartCard key={sensor.key} sensor={sensor} rangeHours={rangeHours} />
      ))}
    </div>
  );
}

/* compare view removed */