// src/app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="card p-8 animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-neutral-400 border-r-neutral-600"></div>
          </div>
          <span className="text-neutral-600 text-lg font-medium">Redirecting...</span>
        </div>
      </div>
    </div>
  );
}
