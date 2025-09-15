// src/components/UserProfileMenu.tsx
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronUp, ChevronDown } from "lucide-react";

interface UserProfileMenuProps {
    collapsed: boolean;
    user: { firstName: string; lastName: string } | null;
    onLogout: () => Promise<void> | void;
}

function UserProfileMenu({ collapsed, user, onLogout }: UserProfileMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        if (open) window.addEventListener("mousedown", handleClick);
        return () => window.removeEventListener("mousedown", handleClick);
    }, [open]);

    // Display user name
    const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "Loading...";

    if (collapsed) {
        return (
            <div className="flex justify-center">
                <button
                    className="w-12 h-12 rounded-2xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center group relative transition-all duration-300"
                    title={displayName}
                >
                    <User className="w-6 h-6 text-neutral-600" />
                    {/* Tooltip */}
                    <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 card text-neutral-900 px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 text-sm pointer-events-none whitespace-nowrap z-50 transition-opacity duration-300 shadow-lg">
                        {displayName}
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-all duration-300"
            >
                <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate text-neutral-900">
                        {displayName}
                    </span>
                    <span className="text-xs text-neutral-500 font-medium">
                        User Account
                    </span>
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0 text-neutral-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 text-neutral-500" />
                )}
            </button>
            {open && (
                <div className="absolute left-0 bottom-full mb-3 w-full rounded-2xl card shadow-lg z-50 animate-fade-in">
                    <button
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300"
                        onClick={async () => { await onLogout(); }}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}

export default UserProfileMenu;
