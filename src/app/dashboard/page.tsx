"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatStage } from "@/lib/utils/format";

interface CustomerItem {
  id: string;
  fullName: string;
  gender: string;
  age: number;
  city: string;
  country: string;
  designation: string | null;
  currentCompany: string | null;
  maritalStatus: string;
  verificationStatus: string;
  journeyStage: string;
  noteCount: number;
  matchCount: number;
}

interface Stats {
  totalAssigned: number;
  active: number;
  awaitingFeedback: number;
  matched: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAssigned: 0,
    active: 0,
    awaitingFeedback: 0,
    matched: 0,
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedVerified, setSelectedVerified] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // First check user auth
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        const authData = await authRes.json();
        setUser(authData.user);

        // Fetch scoped customers
        const queryParams = new URLSearchParams();
        if (selectedStage) queryParams.set("stage", selectedStage);
        if (selectedCity) queryParams.set("city", selectedCity);
        if (selectedVerified) queryParams.set("verified", selectedVerified);
        if (searchQuery) queryParams.set("q", searchQuery);

        const res = await fetch(`/api/customers?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load customer worklist");
        }
        const data = await res.json();
        setCustomers(data.customers);
        setStats(data.stats);
        if (data.availableCities) setAvailableCities(data.availableCities);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, selectedStage, selectedCity, selectedVerified, searchQuery]);

  function clearFilters() {
    setSearchQuery("");
    setSelectedStage("");
    setSelectedCity("");
    setSelectedVerified("");
  }

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedStage) ||
    Boolean(selectedCity) ||
    Boolean(selectedVerified);

  function getStageBadge(stage: string) {
    switch (stage) {
      case "NEW":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "PROFILE_REVIEW":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "VERIFIED":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "IN_MATCHING":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "MATCH_SENT":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "AWAITING_FEEDBACK":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
      case "MATCHED":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "ON_HOLD":
        return "bg-orange-500/10 text-orange-300 border-orange-500/30";
      case "CLOSED":
        return "bg-slate-700/30 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Context Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Assigned Clients Dashboard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Staff: {user?.displayName || "Loading..."}
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage client journeys, inspect verified profiles, and run deterministic matching.
            </p>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedStage("");
              setSelectedCity("");
              setSelectedVerified("");
            }}
            className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Assigned Clients
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.totalAssigned}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active in your portfolio
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Active in Pipeline
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.active}
            </div>
            <div className="text-[11px] text-indigo-400/80 mt-1">
              Reviewing or matching
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Awaiting Feedback
              </span>
              <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.awaitingFeedback}
            </div>
            <div className="text-[11px] text-yellow-400/80 mt-1">
              Pending client review
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Matched Success
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {stats.matched}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Introduced & aligned
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Text Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, city, role..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Stage Filter */}
            <div>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Journey Stages</option>
                <option value="NEW">New</option>
                <option value="PROFILE_REVIEW">Profile Review</option>
                <option value="VERIFIED">Verified</option>
                <option value="IN_MATCHING">In Matching</option>
                <option value="MATCH_SENT">Match Sent</option>
                <option value="AWAITING_FEEDBACK">Awaiting Feedback</option>
                <option value="MATCHED">Matched</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status */}
            <div>
              <select
                value={selectedVerified}
                onChange={(e) => setSelectedVerified(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Verification</option>
                <option value="true">Demo Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>Showing filtered results</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
              >
                <X className="h-3 w-3" />
                <span>Clear all filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Customer List Section */}
        {loading ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading client worklist...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Error Loading Worklist</div>
              <div className="text-xs">{error}</div>
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">
              No clients found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? "No clients match your filter criteria. Try clearing some filters."
                : "No clients currently assigned to your account."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block glass-panel rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Client Name</th>
                    <th className="py-3.5 px-4 font-semibold">Age / Gender</th>
                    <th className="py-3.5 px-4 font-semibold">Location</th>
                    <th className="py-3.5 px-4 font-semibold">Career / Education</th>
                    <th className="py-3.5 px-4 font-semibold">Journey Stage</th>
                    <th className="py-3.5 px-4 font-semibold">Verification</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/customers/${c.id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                            {c.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                              {c.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {c.maritalStatus}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div>{c.age} yrs</div>
                        <div className="text-[11px] text-slate-500">{c.gender}</div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{c.city}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{c.country}</div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        <div className="font-medium text-slate-200 truncate max-w-[180px]">
                          {c.designation || "Not provided"}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {c.currentCompany || "Company not specified"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStageBadge(
                            c.journeyStage
                          )}`}
                        >
                          {formatStage(c.journeyStage)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {c.verificationStatus === "DEMO_VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Verified (demo)</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Unverified
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/customers/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/customers/${c.id}`)}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-300">
                        {c.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">
                          {c.fullName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.age} yrs · {c.gender} · {c.city}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStageBadge(
                        c.journeyStage
                      )}`}
                    >
                      {formatStage(c.journeyStage)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Occupation:</span>
                      <span>{c.designation || "Not provided"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Company:</span>
                      <span>{c.currentCompany || "Not specified"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Verification:</span>
                      <span
                        className={
                          c.verificationStatus === "DEMO_VERIFIED"
                            ? "text-emerald-400 font-medium"
                            : "text-slate-400"
                        }
                      >
                        {c.verificationStatus === "DEMO_VERIFIED"
                          ? "Verified (demo)"
                          : "Unverified"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400"
                    >
                      <span>View Profile & Matches →</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
