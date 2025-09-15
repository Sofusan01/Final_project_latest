"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavigationDebug() {
  const pathname = usePathname();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  useEffect(() => {
    setNavigationHistory(prev => [...prev, pathname]);
  }, [pathname]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">Navigation Debug</div>
      <div>Current: {pathname}</div>
      <div className="mt-2">
        <div className="font-semibold">History:</div>
        {navigationHistory.slice(-5).map((path, i) => (
          <div key={i} className="text-gray-300">{path}</div>
        ))}
      </div>
    </div>
  );
} 