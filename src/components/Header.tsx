"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, LogOut, User, ShieldCheck } from "lucide-react";

interface HeaderProps {
  user?: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <HeartHandshake className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                TDC Matchmaker
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Executive Matchmaking & Intelligence Platform
            </p>
          </div>
        </Link>

        {/* User Status & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white">
                  {user.displayName.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-medium text-slate-200">
                    {user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>{user.role}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
