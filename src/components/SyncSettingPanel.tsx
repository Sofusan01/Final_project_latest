// /src/components/SyncSettingPanel.tsx
import { useEffect, useState } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase"; // import db จาก config firebase

export default function SyncSettingPanel() {
  const [enabled, setEnabled] = useState(false);
  const [interval, setInterval] = useState(10);

  useEffect(() => {
    // Subscribe ค่าจาก RTDB (อัปเดต real-time)
    const syncRef = ref(db, "setting/sync");
    const unsub = onValue(syncRef, (snap) => {
      const data = snap.val();
      if (data) {
        setEnabled(data.log_enabled);
        setInterval(data.log_interval_minutes);
      }
    });
    return () => unsub();
  }, []);

  async function save() {
    // เขียนค่าใหม่กลับไปที่ RTDB
    await set(ref(db, "setting/sync"), {
      log_enabled: enabled,
      log_interval_minutes: interval,
      updated_at: new Date().toISOString()
    });
    alert("Settings saved successfully");
  }

  return (
    <div className="card p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-heading mb-4">Sync Settings</h3>
      
      <label className="flex items-center gap-3 mb-6">
        <input 
          type="checkbox" 
          checked={enabled} 
          onChange={e => setEnabled(e.target.checked)}
          className="w-4 h-4 text-neutral-600 border-neutral-300 rounded focus:ring-neutral-500"
        />
        <span className="text-body">Enable automatic sensor log collection</span>
      </label>
      
      <div className="flex items-center gap-3 mb-6">
        <span className="text-body">Frequency:</span>
        <input
          type="number"
          className="input w-20"
          value={interval}
          min={1}
          max={120}
          onChange={e => setInterval(Number(e.target.value))}
        />
        <span className="text-body">minutes/cycle</span>
      </div>
      
      <button onClick={save} className="btn-primary w-full">
        Save Settings
      </button>
    </div>
  );
}
