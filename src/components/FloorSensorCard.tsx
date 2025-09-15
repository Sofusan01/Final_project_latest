// src/components/FloorSensorCard.tsx
"use client";
import React, { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { Thermometer, Droplets, Waves, FlaskConical, Sun, Zap } from "lucide-react";

// Minimal Gauge Component
interface CustomGaugeProps {
  value: number;
  min: number;
  max: number;
  optimal?: { min: number; max: number };
  color: string;
  optimalColor: string;
  size?: number;
}

function CustomGauge({ value, min, max, optimal, color, optimalColor, size = 120 }: CustomGaugeProps) {
  const isOptimal = optimal && value >= optimal.min && value <= optimal.max;
  const gaugeColor = isOptimal ? optimalColor : color;
  
  // Clamp value to min-max range
  const clampedValue = Math.min(Math.max(value, min), max);
  
  // Calculate percentage
  const percentage = (clampedValue - min) / (max - min);
  
  // Calculate stroke dash array for the arc
  const radius = 40;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage * circumference);
  
  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Half-circle gauge container */}
      <div 
        className="relative"
        style={{ 
          width: size, 
          height: size / 2 + 10
        }}
      >
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 50"
        >
          {/* Background track (half circle) */}
          <path
            d="M 10 40 A 40 40 0 0 1 90 40"
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Optimal range indicator (if exists) */}
          {optimal && (
            <path
              d="M 10 40 A 40 40 0 0 1 90 40"
              fill="none"
              stroke="#22c55e"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${((optimal.max - optimal.min) / (max - min)) * circumference} ${circumference}`}
              strokeDashoffset={circumference - (((optimal.min - min) / (max - min)) * circumference)}
              opacity="0.3"
            />
          )}
          
          {/* Value indicator (half circle) */}
          <path
            d="M 10 40 A 40 40 0 0 1 90 40"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        
        {/* Center value */}
        <div 
          className="absolute flex flex-col items-center justify-center"
          style={{ 
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span 
            className="text-lg font-bold transition-all duration-300"
            style={{ color: gaugeColor }}
          >
            {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
          </span>
        </div>
      </div>
      
      {/* Min/Max labels outside gauge */}
      <div className="flex justify-between w-full mt-2 px-2">
        <span className="text-xs text-neutral-400 font-medium">
          {min}
        </span>
        <span className="text-xs text-neutral-400 font-medium">
          {max}
        </span>
      </div>
    </div>
  );
}

const SENSOR_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  color: string;
  colorClass: string;
  min: number;
  max: number;
  optimal?: { min: number; max: number };
  gaugeColor: string;
  gaugeOptimalColor: string;
}> = {
  temp: {
    label: "Temperature",
    icon: Thermometer,
    unit: "°C",
    color: "#ef4444",
    colorClass: "text-red-500",
    min: 0,
    max: 40,
    optimal: { min: 20, max: 30 },
    gaugeColor: "#ef4444",
    gaugeOptimalColor: "#22c55e"
  },
  humid: {
    label: "Humidity",
    icon: Droplets,
    unit: "%",
    color: "#3b82f6",
    colorClass: "text-blue-500",
    min: 0,
    max: 100,
    optimal: { min: 40, max: 70 },
    gaugeColor: "#3b82f6",
    gaugeOptimalColor: "#22c55e"
  },
  wt: {
    label: "Water Temperature",
    icon: Waves,
    unit: "°C",
    color: "#06b6d4",
    colorClass: "text-cyan-500",
    min: 0,
    max: 40,
    optimal: { min: 18, max: 25 },
    gaugeColor: "#06b6d4",
    gaugeOptimalColor: "#22c55e"
  },
  ph: {
    label: "pH Level",
    icon: FlaskConical,
    unit: "",
    color: "#8b5cf6",
    colorClass: "text-purple-500",
    min: 0,
    max: 14,
    optimal: { min: 5.5, max: 7.5 },
    gaugeColor: "#8b5cf6",
    gaugeOptimalColor: "#22c55e"
  },
  lux: {
    label: "Light Intensity",
    icon: Sun,
    unit: "lux",
    color: "#f59e0b",
    colorClass: "text-amber-500",
    min: 0,
    max: 100000,
    optimal: { min: 10000, max: 50000 },
    gaugeColor: "#f59e0b",
    gaugeOptimalColor: "#22c55e"
  },
  ec: {
    label: "Conductivity",
    icon: Zap,
    unit: "mS/cm",
    color: "#10b981",
    colorClass: "text-emerald-500",
    min: 0,
    max: 3000,
    optimal: { min: 800, max: 2000 },
    gaugeColor: "#10b981",
    gaugeOptimalColor: "#22c55e"
  },
};

function formatValue(value: number, key: string): string {
  if (key === 'lux' && value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (typeof value === 'number') {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
  return String(value);
}

export function FloorSensorCard({ floor }: { floor: string }) {
  const [sensor, setSensor] = useState<Record<string, number | string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else {
        setScreenSize('lg');
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const sensorRef = ref(db, `${floor}/sensor`);
    const unsubscribe = onValue(sensorRef, snap => {
      const val = snap.val() || {};
      Object.keys(val).forEach((k) => {
        if (!val[k] && val[k] !== 0) delete val[k];
      });
      setSensor(val);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [floor]);

  const sensorEntries = sensor ? Object.entries(sensor) : [];
  const hasData = sensorEntries.length > 0;

  // Get gauge size based on screen size
  const getGaugeSize = () => {
    switch (screenSize) {
      case 'sm': return 100;
      case 'md': return 120;
      case 'lg': return 140;
      default: return 120;
    }
  };

  return (
    <div className="w-full card overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="bg-neutral-900 p-6 sm:p-8 text-white">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">
              {floor.toUpperCase()}
            </h3>
            <p className="text-neutral-300 text-base sm:text-lg text-center mt-2 font-medium">
              Plant Monitoring System
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-transparent border-t-neutral-400 border-r-neutral-600"></div>
            </div>
            <span className="ml-4 text-neutral-600 text-lg font-medium">Loading sensors...</span>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
            </div>
            <span className="text-xl font-bold">No Data Available</span>
            <span className="text-base mt-2 font-medium">All sensors are offline</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorEntries.map(([key, value]) => {
              const config = SENSOR_CONFIG[key];
              const numValue = Number(value);

              if (!config) return null;

              const Icon = config.icon;

              return (
                <div
                  key={key}
                  className="card p-6 transition-all duration-300 card-hover"
                >
                  {/* Sensor Header */}
                  <div className="flex flex-col items-center text-center mb-6 space-y-3">
                    <div className="p-4 rounded-2xl bg-neutral-100">
                      <Icon className={`w-6 h-6 lg:w-7 lg:h-7 ${config.colorClass}`} />
                    </div>

                    {/* Sensor Name */}
                    <h4 className="font-semibold text-neutral-900 text-base leading-tight">
                      {config.label}
                    </h4>

                    {/* Value and Unit */}
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-xl lg:text-2xl font-bold ${config.colorClass}`}>
                        {formatValue(numValue, key)}
                      </span>
                      {config.unit && (
                        <span className="text-sm font-medium text-neutral-500">
                          {config.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Custom Gauge */}
                  <div className="flex items-center justify-center">
                    <CustomGauge
                      value={numValue}
                      min={config.min}
                      max={config.max}
                      optimal={config.optimal}
                      color={config.gaugeColor}
                      optimalColor={config.gaugeOptimalColor}
                      size={getGaugeSize()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
