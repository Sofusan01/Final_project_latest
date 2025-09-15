// src/app/(dashboard)/layout.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import NavigationDebug from "@/components/NavigationDebug";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const { user, loading } = useUserProfile();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if user is explicitly null (not loading)
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    // Show loading state while user is being determined
    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-neutral-50">
                <div className="card p-8 animate-fade-in">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-neutral-400 border-r-neutral-600"></div>
                        </div>
                        <span className="text-neutral-600 text-sm font-medium">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Don't render anything if user is not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-neutral-50">
            <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />
            <main
                className={`
                    flex-1 transition-all duration-300 ease-out
                    min-h-screen relative
                    ${collapsed ? "md:ml-20" : "md:ml-80"}
                    ml-0
                    bg-neutral-50
                `}
            >
                <div className="p-6 sm:p-8 pt-24 md:pt-8">
                    {children}
                </div>
            </main>
            <NavigationDebug />
        </div>
    );
}
