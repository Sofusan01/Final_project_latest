"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SENSOR_CONFIG: Record<string, { label: string, unit: string, colors: string[] }> = {
  temp: { label: "Temperature", unit: "°C", colors: ["#ef4444", "#dc2626", "#b91c1c"] },
  humid: { label: "Humidity", unit: "%", colors: ["#3b82f6", "#2563eb", "#1d4ed8"] },
  wt: { label: "Water Temperature", unit: "°C", colors: ["#06b6d4", "#0891b2", "#0e7490"] },
  ph: { label: "pH", unit: "", colors: ["#8b5cf6", "#7c3aed", "#6d28d9"] },
  ec: { label: "EC", unit: "EC", colors: ["#10b981", "#059669", "#047857"] },
  lux: { label: "Light", unit: "lux", colors: ["#f59e0b", "#d97706", "#b45309"] },
};

interface SensorLog {
  id: number;
  floor: number;
  temp?: number;
  humid?: number;
  wt?: number;
  ph?: number;
  ec?: number;
  lux?: number;
  created_at: string;
}

interface ChartRow {
  time: string; // ISO key by bucket
  floor1?: number | null;
  floor2?: number | null;
  floor3?: number | null;
}

// Cache สำหรับเก็บข้อมูล
const dataCache = new Map<string, { data: SensorLog[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 วินาที

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{
    color: string;
    name?: string;
    value?: number;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="card p-3 shadow-lg">
      <p className="font-medium text-neutral-900 mb-2">{label ?? ''}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-neutral-600">
            {entry.name}: <span className="font-medium text-neutral-900">{typeof entry.value === 'number' ? entry.value.toFixed(2) : 'N/A'}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResultChart({
  sensorKey = "ph",
  rangeHours = 24,
  height = 400,
  showHeader = true,
  compact = false
}: {
  sensorKey?: keyof Omit<SensorLog, "id" | "floor" | "created_at">;
  rangeHours?: number;
  height?: number;
  showHeader?: boolean;
  compact?: boolean;
}) {
  const [data, setData] = useState<SensorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // สร้าง cache key
  const cacheKey = useMemo(() => `${sensorKey}-${rangeHours}`, [sensorKey, rangeHours]);

  // ฟังก์ชัน fetch ข้อมูล
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // ตรวจสอบ cache ก่อน
      const cached = dataCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      
      const since = new Date(Date.now() - rangeHours * 60 * 60 * 1000).toISOString();
      const until = new Date().toISOString();
      const { data: logs, error: fetchError } = await supabase
        .from("sensor_logs")
        .select("id,floor,temp,humid,wt,ph,ec,lux,created_at")
        .gte("created_at", since)
        .lt("created_at", until)
        .in("floor", [1,2,3])
        .order("created_at", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const newData = logs || [];
      
      // เก็บใน cache
      dataCache.set(cacheKey, { data: newData, timestamp: now });
      
      setData(newData);
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [cacheKey, rangeHours]);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  // เลือก bucket ตามช่วงเวลา: 24H→hour, 3-7Days→day, 1M→week, 6M/1Y→month
  function getBucketByRange(hours: number): 'hour' | 'day' | 'week' | 'month' {
    if (hours <= 24) return 'hour';
    if (hours <= 720) return 'day';      // 1M รายวัน
    if (hours <= 2160) return 'week';    // ~3M รายสัปดาห์
    return 'day';                        // 6M/1Y ต้องการ stamp รายวันอย่างละเอียด
  }

  function bucketDateUTC(d: Date, bucket: 'hour' | 'day' | 'week' | 'month'): Date {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    if (bucket === 'hour') return new Date(Date.UTC(y, m, day, d.getUTCHours(), 0, 0, 0));
    if (bucket === 'day') return new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
    if (bucket === 'week') {
      // ทำให้สัปดาห์เริ่มวันจันทร์ (ISO): 1=Mon..7=Sun
      const tmp = new Date(Date.UTC(y, m, day, 0, 0, 0, 0));
      const dow = (tmp.getUTCDay() + 6) % 7; // 0=Mon
      tmp.setUTCDate(tmp.getUTCDate() - dow);
      return tmp;
    }
    // month
    return new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  }

  // แปลงข้อมูลและจัดกลุ่มตามคาบเวลา (bucket)
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    const bucket = getBucketByRange(rangeHours);
    const grouped: Record<string, { f1: number[]; f2: number[]; f3: number[] }> = {};
    
    for (const log of data) {
      const t = new Date(log.created_at);
      const key = bucketDateUTC(t, bucket).toISOString();
      if (!grouped[key]) grouped[key] = { f1: [], f2: [], f3: [] };
      const v = log[sensorKey];
      if (typeof v === 'number') {
        if (log.floor === 1) grouped[key].f1.push(v);
        if (log.floor === 2) grouped[key].f2.push(v);
        if (log.floor === 3) grouped[key].f3.push(v);
      }
    }
    const rows: ChartRow[] = Object.entries(grouped).map(([key, vals]) => {
      const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
      return {
        time: key,
        floor1: avg(vals.f1),
        floor2: avg(vals.f2),
        floor3: avg(vals.f3),
      };
    });
    // ถ้าไม่มีข้อมูลส่วนใหญ่ ให้เติมช่องว่างตาม bucket เพื่อให้แกนเวลาเต็มช่วง
    if (rows.length <= 1) {
      const start = new Date(new Date().getTime() - rangeHours * 3600 * 1000);
      const end = new Date();
      const stepMs = bucket === 'hour' ? 3600e3 : bucket === 'day' ? 86400e3 : bucket === 'week' ? 7*86400e3 : 30*86400e3;
      const scaffolds: ChartRow[] = [];
      for (let t = bucketDateUTC(start, bucket).getTime(); t <= end.getTime(); t += stepMs) {
        scaffolds.push({ time: new Date(t).toISOString(), floor1: null, floor2: null, floor3: null });
      }
      // รวม scaffold กับ rows จริง
      const byKey = new Map<string, ChartRow>(rows.map(r => [r.time, r] as const));
      return scaffolds.map(s => byKey.get(s.time) ?? s);
    }
    return rows.sort((a, b) => a.time.localeCompare(b.time));
  }, [data, sensorKey, rangeHours]);

  // สถิติ min/avg/max ต่อ floor สำหรับ Single view
  const stats = useMemo(() => {
    const valuesByFloor: Record<1 | 2 | 3, number[]> = { 1: [], 2: [], 3: [] };
    for (const row of chartData) {
      if (typeof row.floor1 === "number") valuesByFloor[1].push(row.floor1);
      if (typeof row.floor2 === "number") valuesByFloor[2].push(row.floor2);
      if (typeof row.floor3 === "number") valuesByFloor[3].push(row.floor3);
    }
    function compute(arr: number[]) {
      if (!arr.length) return { min: null as number | null, avg: null as number | null, max: null as number | null };
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { min, avg, max };
    }
    return {
      f1: compute(valuesByFloor[1]),
      f2: compute(valuesByFloor[2]),
      f3: compute(valuesByFloor[3]),
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'bg-transparent' : 'card'}`} style={{ height }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400"></div>
          <p className="text-neutral-500 text-sm">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center text-red-600 ${compact ? 'bg-transparent' : 'card'}`} style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-neutral-900 mb-2">Error occurred</div>
          <div className="text-sm text-neutral-600">{error}</div>
          <button 
            onClick={fetchData}
            className="mt-3 px-4 py-2 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center text-neutral-500 ${compact ? 'bg-transparent' : 'card'}`} style={{ height }}>
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-neutral-900 mb-2">No data available</div>
          <div className="text-sm text-neutral-600">Last {rangeHours} hours</div>
          <button 
            onClick={fetchData}
            className="mt-3 px-4 py-2 btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const config = SENSOR_CONFIG[sensorKey as string];

  return (
    <div className={`w-full ${compact ? 'bg-transparent' : 'card p-6'}`}>
      {/* Conditional Header */}
      {showHeader && (
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-heading mb-1`}>
              {config.label}
            </h2>
            <p className="text-sm text-muted">
              Unit: {config.unit || 'No unit'} • Last {rangeHours} hours
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="px-3 py-1 text-xs btn-secondary"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Chart */}
      {/* สรุปค่าสถิติ */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {([
          { key: "f1" as const, label: "Floor 1", color: config.colors[0] },
          { key: "f2" as const, label: "Floor 2", color: config.colors[1] },
          { key: "f3" as const, label: "Floor 3", color: config.colors[2] },
        ]).map(({ key, label, color }) => {
          const s = stats[key];
          return (
            <div key={key} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-neutral-700">{label}</span>
              </div>
              <div className="text-xs text-neutral-600">
                <span className="mr-3">Min: <b>{s.min === null ? "-" : s.min.toFixed(2)}</b></span>
                <span className="mr-3">Avg: <b>{s.avg === null ? "-" : s.avg.toFixed(2)}</b></span>
                <span>Max: <b>{s.max === null ? "-" : s.max.toFixed(2)}</b></span>
              </div>
            </div>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart 
          data={chartData} 
          margin={{ 
            top: compact ? 10 : 20, 
            right: compact ? 15 : 30, 
            left: compact ? 10 : 20, 
            bottom: compact ? 10 : 20 
          }}
        >
          <defs>
            <linearGradient id={`floor1Gradient-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.colors[0]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={config.colors[0]} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id={`floor2Gradient-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.colors[1]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={config.colors[1]} stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id={`floor3Gradient-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.colors[2]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={config.colors[2]} stopOpacity={0.1}/>
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e5e5" 
            opacity={0.7}
            horizontal={true}
            vertical={true}
          />

          {(() => {
            const bucket = getBucketByRange(rangeHours);
            const tickFormatter = (iso: string) => {
              const d = new Date(iso);
              if (bucket === 'hour') {
                return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
              }
              if (bucket === 'month') {
                return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
              }
              return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
            };
            const isLong = bucket === 'week' || (bucket === 'day' && rangeHours > 2160);
            const font = isLong ? 9 : (compact ? 10 : 12);
            const extra: { interval?: number; minTickGap?: number; angle?: number; tickMargin?: number } = isLong ? { interval: 0, minTickGap: 0, angle: -45, tickMargin: 6 } : {};
            return (
              <XAxis
                dataKey="time"
                tickFormatter={tickFormatter}
                fontSize={font}
                tick={{ fill: '#6b7280', fontWeight: 500 }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
                minTickGap={compact ? 10 : 20}
                {...extra}
              />
            );
          })()}

          <YAxis
            fontSize={compact ? 10 : 12}
            tick={{ fill: '#6b7280', fontWeight: 500 }}
            axisLine={{ stroke: '#d1d5db' }}
            tickLine={{ stroke: '#d1d5db' }}
            domain={sensorKey === 'ph' ? [0, 8] : ['auto', 'auto']}
            width={compact ? 30 : 40}
          />

          <Tooltip
            content={<CustomTooltip />} 
            cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
            labelFormatter={(iso: string) => {
              const bucket = getBucketByRange(rangeHours);
              const d = new Date(iso);
              const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
              const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
              // ให้ tooltip header เป็น date/time ทั้งหมด
              if (bucket === 'hour') return `${dateStr} • ${timeStr}`;
              return `${dateStr} • ${timeStr}`;
            }}
          />

          {/* legend removed by request */}

          <Area
            type="monotone"
            dataKey="floor1"
            stroke={config.colors[0]}
            strokeWidth={2}
            fill={`url(#floor1Gradient-${sensorKey})`}
            name="Floor 1"
            connectNulls={false}
            dot={compact ? false : { fill: config.colors[0], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: config.colors[0] }}
          />

          <Area
            type="monotone"
            dataKey="floor2"
            stroke={config.colors[1]}
            strokeWidth={2}
            fill={`url(#floor2Gradient-${sensorKey})`}
            name="Floor 2"
            connectNulls={false}
            dot={compact ? false : { fill: config.colors[1], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: config.colors[1] }}
          />

          <Area
            type="monotone"
            dataKey="floor3"
            stroke={config.colors[2]}
            strokeWidth={2}
            fill={`url(#floor3Gradient-${sensorKey})`}
            name="Floor 3"
            connectNulls={false}
            dot={compact ? false : { fill: config.colors[2], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: config.colors[2] }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* legend removed */}
    </div>
  );
}