// src/components/Sidebar.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Settings,
    BarChart2,
    ChevronLeft,
    X,
    Sprout,
    Cog,
    Menu,
    Users
} from "lucide-react";
import UserProfileMenu from "./UserProfileMenu";
import { useUserProfile } from "@/hooks/useUserProfile";
import { isAdmin } from "@/lib/supabase";

const menu = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Console", icon: Settings, href: "/console" },
    { label: "Result", icon: BarChart2, href: "/result" },
    { label: "Settings", icon: Cog, href: "/setting" },
];

// Admin-only menu items
const adminMenu = [
    { label: "Users", icon: Users, href: "/setting/users" },
];

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

// Minimal Hamburger Icon Component
const HamburgerIcon = ({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) => {
    return (
        <button
            onClick={onClick}
            className="flex flex-col justify-center items-center w-8 h-8 space-y-1 group"
            aria-label="Toggle menu"
        >
            <div
                className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 ${collapsed ? 'rotate-0' : 'rotate-45 translate-y-1.5'}`}
            />
            <div
                className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 ${collapsed ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
                className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 ${collapsed ? 'rotate-0' : '-rotate-45 -translate-y-1.5'}`}
            />
        </button>
    );
};

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, userRole, firstName, lastName } = useUserProfile();

    const isActive = useCallback((href: string) => pathname === href, [pathname]);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    const handleNavigation = useCallback((href: string) => {
        setMobileOpen(false);
        if (pathname !== href) {
            router.push(href);
        }
    }, [pathname, router]);

    const handleLogout = useCallback(async () => {
        await logout();
        setMobileOpen(false);
    }, [logout]);

    // Don't render if no user
    if (!user) {
        return null;
    }

    // Combine regular menu with admin menu if user is admin
    const allMenuItems = isAdmin(userRole) ? [...menu, ...adminMenu] : menu;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-6 left-6 z-50 md:hidden btn-secondary p-3"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-neutral-600" />
            </button>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full z-50
                    flex flex-col
                    text-neutral-900 shadow-lg transition-all duration-300 ease-out
                    border-r border-neutral-200
                    ${collapsed ? "w-20" : "w-80"}
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0 md:z-30
                    bg-white
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 h-24">
                    {/* Logo - Show only when not collapsed */}
                    {!collapsed && (
                        <button
                            onClick={() => handleNavigation("/dashboard")}
                            className="flex items-center gap-4 group relative z-10"
                        >
                            <div className="p-3 rounded-2xl bg-neutral-100 group-hover:bg-neutral-200 transition-colors duration-200">
                                <Sprout className="w-6 h-6 text-neutral-700" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xl text-neutral-900 tracking-wide">
                                    Wolffia
                                </span>
                                <span className="text-xs text-neutral-500 font-medium tracking-wider uppercase">
                                    Plant Dashboard
                                </span>
                            </div>
                        </button>
                    )}

                    {/* Hamburger Icon - Show only when collapsed */}
                    {collapsed && (
                        <div className="flex justify-center w-full">
                            <HamburgerIcon
                                collapsed={collapsed}
                                onClick={() => setCollapsed(!collapsed)}
                            />
                        </div>
                    )}

                    {/* Control Buttons - Show only when not collapsed */}
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            {/* Desktop collapse button */}
                            <button
                                onClick={() => setCollapsed(!collapsed)}
                                className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200"
                                aria-label="Collapse menu"
                            >
                                <ChevronLeft className="w-4 h-4 text-neutral-600" />
                            </button>

                            {/* Mobile close button */}
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors duration-200"
                                aria-label="Close menu"
                            >
                                <X className="w-4 h-4 text-neutral-600" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 flex flex-col py-6 px-3 space-y-2">
                    {allMenuItems.map(({ label, icon: Icon, href }) => {
                        const active = isActive(href);
                        const isAdminItem = adminMenu.some(item => item.href === href);
                        
                        return (
                            <button
                                onClick={() => handleNavigation(href)}
                                key={href}
                                className={`
                                    group relative flex items-center rounded-xl transition-all duration-200
                                    ${collapsed ? "justify-center p-4" : "px-4 py-4"}
                                    ${active
                                        ? "nav-item active"
                                        : "nav-item"}
                                    ${isAdminItem ? "border-l-4 border-l-blue-500" : ""}
                                `}
                                title={isAdminItem ? `${label} (Admin Only)` : label}
                            >
                                <Icon className={`flex-shrink-0 ${collapsed ? "w-6 h-6" : "w-5 h-5"}`} />
                                {!collapsed && (
                                    <span className="ml-4 font-medium whitespace-nowrap text-sm">
                                        {label}
                                        {isAdminItem && (
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                Admin
                                            </span>
                                        )}
                                    </span>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-3 px-3 py-2 card text-neutral-900 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                                        {label}
                                        {isAdminItem && " (Admin Only)"}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile Menu */}
                <div className="px-3 pb-6">
                    <UserProfileMenu
                        collapsed={collapsed}
                        user={{
                            firstName: firstName ?? (user.email?.split('@')[0] || 'User'),
                            lastName: lastName ?? ''
                        }}
                        onLogout={handleLogout}
                    />
                </div>
            </aside>
        </>
    );
}
