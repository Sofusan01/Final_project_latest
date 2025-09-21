// /src/components/RelayConsole.tsx
"use client";
import { useEffect, useState } from "react";
import { ref, onValue, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  Lightbulb, Fan, Droplets, FlaskConical,
  Settings, Power, CheckCircle,
  AlertCircle, Timer, Activity,
  Clock, Plus, Minus, RotateCcw
} from "lucide-react";

type RelayKey = "light" | "fan" | "pump" | "fertA" | "fertB" | "fertilizer";
type RelayStatus = Record<RelayKey, boolean>;
type RelayTime = {
  [key in RelayKey]?: {
    [period: string]: { start: string; end: string }
  }
};

interface DeviceConfig {
  key: RelayKey;
  name: string;
  periods: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  colorClass: string;
  description: string;
  presets?: { name: string; periods: { start: string; end: string }[] }[];
  showInMode?: "manual" | "auto" | "both";
}

const DEVICES: DeviceConfig[] = [
  {
    key: "light", name: "Light System", periods: 2, icon: Lightbulb,
    color: "#f59e0b", bgColor: "bg-amber-50", colorClass: "text-amber-500", description: "LED grow lights", showInMode: "both",
    presets: [
      { name: "Morning & Evening", periods: [{ start: "06:00", end: "12:00" }, { start: "18:00", end: "22:00" }] },
      { name: "Full Day", periods: [{ start: "06:00", end: "18:00" }, { start: "", end: "" }] },
      { name: "Night Only", periods: [{ start: "20:00", end: "23:59" }, { start: "00:00", end: "06:00" }] }
    ]
  },
  {
    key: "fan", name: "Ventilation Fan", periods: 2, icon: Fan,
    color: "#3b82f6", bgColor: "bg-blue-50", colorClass: "text-blue-500", description: "Air circulation", showInMode: "both",
    presets: [
      { name: "Day & Night", periods: [{ start: "08:00", end: "20:00" }, { start: "22:00", end: "06:00" }] },
      { name: "Hot Hours", periods: [{ start: "10:00", end: "16:00" }, { start: "19:00", end: "21:00" }] },
      { name: "Continuous", periods: [{ start: "00:00", end: "23:59" }, { start: "", end: "" }] }
    ]
  },
  {
    key: "pump", name: "Water Pump", periods: 1, icon: Droplets,
    color: "#06b6d4", bgColor: "bg-cyan-50", colorClass: "text-cyan-500", description: "Nutrient circulation", showInMode: "both",
    presets: [
      { name: "Every 4 Hours", periods: [{ start: "06:00", end: "06:15" }] },
      { name: "Morning Only", periods: [{ start: "07:00", end: "07:30" }] },
      { name: "Twice Daily", periods: [{ start: "08:00", end: "08:15" }] }
    ]
  },
  // Manual mode: Separate fertA and fertB
  {
    key: "fertA", name: "Fertilizer A", periods: 0, icon: FlaskConical,
    color: "#10b981", bgColor: "bg-emerald-50", colorClass: "text-emerald-500", description: "Primary nutrients", showInMode: "manual"
  },
  {
    key: "fertB", name: "Fertilizer B", periods: 0, icon: FlaskConical,
    color: "#8b5cf6", bgColor: "bg-purple-50", colorClass: "text-purple-500", description: "Secondary nutrients", showInMode: "manual"
  },
  // Auto mode: Combined automation fertilizer
  {
    key: "fertilizer", name: "Automation Fertilizer", periods: 1, icon: FlaskConical,
    color: "#10b981", bgColor: "bg-emerald-50", colorClass: "text-emerald-500", description: "Automated nutrient delivery", showInMode: "auto",
    presets: [
      { name: "Morning Dose", periods: [{ start: "07:00", end: "" }] },
      { name: "Evening Dose", periods: [{ start: "19:00", end: "" }] },
      { name: "Daily Dose", periods: [{ start: "08:00", end: "" }] }
    ]
  },
];

// Quick time presets
const QUICK_TIMES = [
  { label: "6 AM", value: "06:00" },
  { label: "8 AM", value: "08:00" },
  { label: "12 PM", value: "12:00" },
  { label: "6 PM", value: "18:00" },
  { label: "8 PM", value: "20:00" },
  { label: "10 PM", value: "22:00" }
];

export default function RelayConsole({
  floor = "floor1",
  className = "",
}: { floor?: string; className?: string }) {
  const [relayMode, setRelayMode] = useState<"auto" | "manual">("manual");
  const [relayStatus, setRelayStatus] = useState<RelayStatus>({
    light: false, fan: false, pump: false, fertA: false, fertB: false, fertilizer: false
  });
  const [relayTime, setRelayTime] = useState<RelayTime>({});
  const [loading, setLoading] = useState(true);
  const [expandedDevice, setExpandedDevice] = useState<RelayKey | null>(null);

  // Load initial values
  useEffect(() => {
    const unsub1 = onValue(ref(db, `${floor}/relay_mode`), (snap) => {
      setRelayMode(snap.val() ?? "manual");
    });
    const unsub2 = onValue(ref(db, `${floor}/relay_status`), (snap) => {
      setRelayStatus(snap.val() ?? { light: false, fan: false, pump: false, fertA: false, fertB: false, fertilizer: false });
    });
    const unsub3 = onValue(ref(db, `${floor}/relay_time`), (snap) => {
      setRelayTime(snap.val() ?? {});
      setLoading(false);
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [floor]);

  // Manual Toggle
  const toggleRelay = async (key: RelayKey) => {
    if (relayMode !== "manual") return;

    try {
      const newValue = !relayStatus[key];
      setRelayStatus(prev => ({ ...prev, [key]: newValue }));
      await update(ref(db, `${floor}/relay_status`), { [key]: newValue });
    } catch (error) {
      console.error('Toggle failed:', error);
      const revertValue = relayStatus[key];
      setRelayStatus(prev => ({ ...prev, [key]: revertValue }));
    }
  };

  // Change mode
  const handleModeChange = async (mode: "auto" | "manual") => {
    setRelayMode(mode);
    await set(ref(db, `${floor}/relay_mode`), mode);
    if (mode === "manual") {
      await set(ref(db, `${floor}/relay_status`), {
        light: false, fan: false, pump: false, fertA: false, fertB: false, fertilizer: false
      });
    }
  };

  // Update time periods
  const setPeriod = async (
    key: RelayKey,
    period: string,
    field: "start" | "end",
    value: string
  ) => {
    await update(ref(db, `${floor}/relay_time/${key}/${period}`), { [field]: value });
  };

  // Apply preset
  const applyPreset = async (key: RelayKey, preset: { name: string; periods: { start: string; end: string }[] }) => {
    const newTimeData: Record<string, { start: string; end: string }> = {};

    preset.periods.forEach((period, index) => {
      if (period.start || period.end) {
        newTimeData[`period${index + 1}`] = period;
      }
    });
    await set(ref(db, `${floor}/relay_time/${key}`), newTimeData);
  };

  // Adjust time by 30 minutes
  const adjustTime = (timeStr: string, minutes: number): string => {
    if (!timeStr) return "";
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  };

  // Clear all times
  const clearAllTimes = async (key: RelayKey) => {
    await set(ref(db, `${floor}/relay_time/${key}`), {});
  };

  const activeDevicesCount = Object.values(relayStatus).filter(Boolean).length;

  return (
    <div className={`w-full card overflow-hidden animate-scale-in ${className}`}>
      {/* Header */}
      <div className="bg-neutral-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-neutral-800">
              <Settings className="w-6 h-6 text-neutral-300" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{floor.toUpperCase()}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-neutral-300">
            <Activity className="w-5 h-5" />
            <span className="text-lg font-bold">{activeDevicesCount}</span>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="p-6 border-b border-neutral-200">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleModeChange("manual")}
            className={`p-4 rounded-2xl text-sm font-medium transition-all duration-300 ${
              relayMode === "manual"
                ? "bg-neutral-900 text-white shadow-md"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Power className="w-5 h-5" />
              <span>Manual</span>
            </div>
          </button>

          <button
            onClick={() => handleModeChange("auto")}
            className={`p-4 rounded-2xl text-sm font-medium transition-all duration-300 ${
              relayMode === "auto"
                ? "bg-neutral-900 text-white shadow-md"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5" />
              <span>Auto</span>
            </div>
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="px-6 py-4 bg-neutral-50">
        <div className="flex items-center gap-3 text-sm">
          <div className={`w-2 h-2 rounded-full ${relayMode === "auto" ? "bg-green-500 animate-pulse" : "bg-neutral-400"}`} />
          <span className="text-neutral-600 font-medium">
            {relayMode === "auto"
              ? "ESP32 controlling automatically"
              : "Manual control mode"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-transparent border-t-neutral-400 border-r-neutral-600"></div>
            </div>
            <span className="ml-4 text-neutral-600 text-lg font-medium">Loading controls...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {DEVICES.filter(device => {
              if (device.showInMode === "both") return true;
              if (device.showInMode === "manual" && relayMode === "manual") return true;
              if (device.showInMode === "auto" && relayMode === "auto") return true;
              return false;
            }).map(device => {
              const Icon = device.icon;
              const isActive = relayStatus[device.key];
              const isExpanded = expandedDevice === device.key;

              return (
                <div
                  key={device.key}
                  className={`
                    p-4 rounded-2xl border transition-all duration-300
                    ${isActive
                      ? "border-green-400 bg-green-50"
                      : "border-red-300 bg-red-50"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${device.bgColor}`}>
                        <Icon className={`w-6 h-6 ${device.colorClass}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-base">
                          {device.name}
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium">
                          {device.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-700" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${isActive ? "text-green-700" : "text-red-600"}`}>
                          {isActive ? "ON" : "OFF"}
                        </span>
                      </div>

                      {/* Toggle Switch for Manual Mode */}
                      {relayMode === "manual" && (
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleRelay(device.key)}
                            className="sr-only peer"
                            aria-label={`Toggle ${device.name}`}
                          />
                          <div className={`
                            w-12 h-6 rounded-full transition-colors duration-300 ease-in-out
                            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-opacity-20
                            ${isActive
                              ? "bg-green-500 peer-focus:ring-green-300"
                              : "bg-neutral-300 peer-focus:ring-neutral-300"
                            }
                          `}>
                            <div className={`
                              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md
                              transform transition-transform duration-300 ease-in-out
                              ${isActive ? "translate-x-6" : "translate-x-0"}
                            `} />
                          </div>
                        </label>
                      )}

                      {/* Expand Button for Auto Mode */}
                      {relayMode === "auto" && device.periods > 0 && (
                        <button
                          onClick={() => setExpandedDevice(isExpanded ? null : device.key)}
                          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-all duration-300"
                        >
                          <Clock className="w-5 h-5 text-neutral-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Schedule Settings */}
                  {relayMode === "auto" && device.periods > 0 && isExpanded && (
                    <div className="mt-6 p-6 card">
                      {/* Preset Buttons */}
                      {device.presets && (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <RotateCcw className="w-5 h-5 text-neutral-600" />
                            <span className="text-base font-semibold text-neutral-900">Quick Presets</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {device.presets.map((preset, index) => (
                              <button
                                key={index}
                                onClick={() => applyPreset(device.key, preset)}
                                className="p-4 text-sm bg-neutral-100 hover:bg-neutral-200 transition-all duration-300 text-left rounded-xl"
                              >
                                <div className="font-semibold text-neutral-900 mb-1">{preset.name}</div>
                                <div className="text-neutral-600 text-xs">
                                  {preset.periods.filter(p => p.start || p.end).map(p => `${p.start}-${p.end}`).join(', ')}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Time Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Timer className="w-5 h-5 text-neutral-600" />
                          <span className="text-base font-semibold text-neutral-900">Schedule Settings</span>
                        </div>
                        <button
                          onClick={() => clearAllTimes(device.key)}
                          className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="space-y-4">
                        {Array.from({ length: device.periods }, (_, i) => {
                          const periodKey = `period${i + 1}`;
                          const currentPeriod = relayTime?.[device.key]?.[periodKey];

                          return (
                            <div key={i} className="p-4 bg-neutral-50 rounded-xl">
                              <div className="text-sm text-neutral-600 mb-4 font-semibold">
                                Period {i + 1}
                              </div>

                              {/* Start Time */}
                              <div className="mb-4">
                                <label className="text-sm text-neutral-700 mb-2 block font-medium">Start Time</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="time"
                                    className="flex-1 input"
                                    value={currentPeriod?.start || ""}
                                    onChange={e => setPeriod(device.key, periodKey, "start", e.target.value)}
                                  />
                                  <button
                                    onClick={() => {
                                      const newTime = adjustTime(currentPeriod?.start || "00:00", -30);
                                      setPeriod(device.key, periodKey, "start", newTime);
                                    }}
                                    className="p-3 bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-xl"
                                  >
                                    <Minus className="w-4 h-4 text-neutral-600" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newTime = adjustTime(currentPeriod?.start || "00:00", 30);
                                      setPeriod(device.key, periodKey, "start", newTime);
                                    }}
                                    className="p-3 bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-xl"
                                  >
                                    <Plus className="w-4 h-4 text-neutral-600" />
                                  </button>
                                </div>

                                {/* Quick Time Buttons */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {QUICK_TIMES.map(time => (
                                    <button
                                      key={time.value}
                                      onClick={() => setPeriod(device.key, periodKey, "start", time.value)}
                                      className="px-3 py-2 text-xs bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-lg"
                                    >
                                      {time.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* End Time - Only show for non-fertilizer devices */}
                              {device.key !== "fertilizer" && (
                                <div>
                                  <label className="text-sm text-neutral-700 mb-2 block font-medium">End Time</label>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="time"
                                      className="flex-1 input"
                                      value={currentPeriod?.end || ""}
                                      onChange={e => setPeriod(device.key, periodKey, "end", e.target.value)}
                                    />
                                    <button
                                      onClick={() => {
                                        const newTime = adjustTime(currentPeriod?.end || "00:00", -30);
                                        setPeriod(device.key, periodKey, "end", newTime);
                                      }}
                                      className="p-3 bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-xl"
                                    >
                                      <Minus className="w-4 h-4 text-neutral-600" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const newTime = adjustTime(currentPeriod?.end || "00:00", 30);
                                        setPeriod(device.key, periodKey, "end", newTime);
                                      }}
                                      className="p-3 bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-xl"
                                    >
                                      <Plus className="w-4 h-4 text-neutral-600" />
                                    </button>
                                  </div>

                                  {/* Quick Time Buttons */}
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {QUICK_TIMES.map(time => (
                                      <button
                                        key={time.value}
                                        onClick={() => setPeriod(device.key, periodKey, "end", time.value)}
                                        className="px-3 py-2 text-xs bg-neutral-200 hover:bg-neutral-300 transition-all duration-300 rounded-lg"
                                      >
                                        {time.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer removed per request */}
      </div>
    </div>
  );
}
