// /src/app/(dashboard)/setting/page.tsx
"use client";
import { useEffect, useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "@/lib/firebase";
import {
  Settings, Save, CheckCircle, Loader2,
  AlertCircle, Plus, Minus
} from "lucide-react";

export default function SettingPage() {
  // State สำหรับการตั้งค่าหลัก
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState(10);
  
  // State สำหรับการตั้งค่าเวลาแจ้งเตือน
  const [timeNoti, setTimeNoti] = useState("00:00");

  // State สำหรับการควบคุม UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลทั้งหมดจาก Firebase ตอนเริ่มเปิดหน้าเว็บ
  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const settingsRef = ref(db, "setting/sync");
        const snapshot = await get(settingsRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          setEnabled(data.log_enabled ?? false);
          setInterval(data.log_interval_minutes ?? 10);
          setTimeNoti(data.time_noti ?? "09:00"); // ดึงค่า time_noti จาก path เดียวกัน
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialSettings();
  }, []);

  // ฟังก์ชันสำหรับบันทึกการตั้งค่าทั้งหมด
  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const settingsRef = ref(db, "setting/sync");
      await set(settingsRef, {
        log_enabled: enabled,
        log_interval_minutes: interval,
        time_noti: timeNoti, // บันทึกเวลาแจ้งเตือนไปพร้อมกัน
        updated_at: new Date().toISOString()
      });

      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  // ฟังก์ชันสำหรับปรับเวลา (+/- 30 นาที)
  const adjustTime = (timeStr: string, minutes: number): string => {
    if (!timeStr) return "00:00";
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    
    const newHours = String(date.getHours()).padStart(2, '0');
    const newMins = String(date.getMinutes()).padStart(2, '0');
    return `${newHours}:${newMins}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <span className="ml-3 text-neutral-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-neutral-100 p-2 rounded-lg">
          <Settings className="w-6 h-6 text-neutral-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-heading">System Settings</h1>
          <p className="text-muted">Configure sensor log collection and notifications.</p>
        </div>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="card p-6 space-y-6">
        {/* Auto Logging Toggle */}
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
          <div>
            <h3 className="font-semibold text-heading">Enable Automatic Log Collection</h3>
            <p className="text-sm text-muted">Automatically store sensor data.</p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="toggle" // ใช้ class สำหรับ styling
          />
        </div>

        {/* Interval Setting */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <h3 className="font-semibold text-heading mb-1">Data Collection Frequency</h3>
          <p className="text-sm text-muted mb-3">Set interval for recording sensor data.</p>
          <div className="flex items-center gap-2">
             <input
              type="number"
              className="input text-center w-20"
              value={interval}
              min={1}
              max={120}
              onChange={(e) => setInterval(Number(e.target.value))}
            />
            <span className="text-neutral-500">minutes</span>
          </div>
        </div>

        {/* Time Notify Setting */}
        <div className="p-4 bg-neutral-50 rounded-xl">
          <h3 className="font-semibold text-heading mb-1">Daily Notification Time</h3>
          <p className="text-sm text-muted mb-3">Set time for daily sensor report (24-hour format).</p>
          <div className="flex items-center gap-2">
            <input
              type="time"
              className="input flex-1"
              value={timeNoti}
              onChange={(e) => setTimeNoti(e.target.value)}
            />
            <button onClick={() => setTimeNoti(adjustTime(timeNoti, -30))} className="btn-icon">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={() => setTimeNoti(adjustTime(timeNoti, 30))} className="btn-icon">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 text-lg font-semibold flex items-center justify-center">
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="ml-2">Save All Settings</span>
                </>
              )}
          </button>
      </div>
    </div>
  );
}
