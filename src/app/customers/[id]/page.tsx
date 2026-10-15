"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import {
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Compass,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Info,
  ChevronDown,
  RefreshCw,
  Mail,
  Phone,
  DollarSign,
  AlertTriangle,
  FileText,
  History,
  Check,
  User,
} from "lucide-react";
import {
  formatHeight,
  formatIncome,
  formatStage,
  getInitials,
} from "@/lib/utils/format";

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tab: "biodata" | "preferences" | "matches" | "notes"
  const [activeTab, setActiveTab] = useState<"biodata" | "preferences" | "matches" | "notes">("biodata");

  // Stage update state
  const [updatingStage, setUpdatingStage] = useState(false);
  const [stageSuccess, setStageSuccess] = useState(false);

  // Notes state
  const [noteBody, setNoteBody] = useState("");
  const [interactionType, setInteractionType] = useState<"CALL" | "MEETING" | "OTHER">("CALL");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Matches state
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [selectedCandidateForBreakdown, setSelectedCandidateForBreakdown] = useState<any>(null);

  // AI Draft Modal state
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [activeCandidateForDraft, setActiveCandidateForDraft] = useState<any>(null);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftSource, setDraftSource] = useState<"ai" | "template">("template");
  const [generatingDraft, setGeneratingDraft] = useState(false);

  // Mock Send Modal state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [activeCandidateForSend, setActiveCandidateForSend] = useState<any>(null);
  const [sendingMatch, setSendingMatch] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // Load customer details
  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        const [authRes, custRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/customers/${id}`),
        ]);

        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);

        if (!custRes.ok) {
          if (custRes.status === 404) {
            throw new Error("Customer not found or not assigned to your account.");
          }
          throw new Error("Failed to load customer profile.");
        }

        const custData = await custRes.json();
        setCustomer(custData.customer);
      } catch (err: any) {
        setError(err.message || "Failed to load customer");
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [id, router]);

  // Load matches on demand when switching to matches tab
  useEffect(() => {
    if (activeTab === "matches" && !matchesLoaded && customer) {
      loadMatches();
    }
  }, [activeTab, matchesLoaded, customer]);

  async function loadMatches() {
    try {
      setLoadingMatches(true);
      const res = await fetch(`/api/customers/${id}/matches`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      setMatches(data.matches);
      setMatchesLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  }

  // Handle stage change
  async function handleStageChange(newStage: string) {
    if (!customer || newStage === customer.journeyStage) return;
    try {
      setUpdatingStage(true);
      const res = await fetch(`/api/customers/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) throw new Error("Failed to update stage");

      const data = await res.json();
      setCustomer((prev: any) => ({
        ...prev,
        journeyStage: data.customer.journeyStage,
        journeyEvents: [data.journeyEvent, ...(prev.journeyEvents || [])],
      }));
      setStageSuccess(true);
      setTimeout(() => setStageSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to update stage");
    } finally {
      setUpdatingStage(false);
    }
  }

  // Handle add note
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;

    try {
      setSavingNote(true);
      setNoteError(null);
      const res = await fetch(`/api/customers/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody, interactionType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add note");

      setCustomer((prev: any) => ({
        ...prev,
        notes: [data.note, ...(prev.notes || [])],
      }));
      setNoteBody("");
    } catch (err: any) {
      setNoteError(err.message || "Failed to create note");
    } finally {
      setSavingNote(false);
    }
  }

  // Open Draft Modal & Generate Draft
  async function openDraftModal(candidate: any) {
    setActiveCandidateForDraft(candidate);
    setDraftModalOpen(true);
    setGeneratingDraft(true);

    try {
      const res = await fetch("/api/matches/draft-intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          candidateId: candidate.candidateId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.draft) {
        setDraftSubject(data.draft.subject);
        setDraftBody(data.draft.body);
        setDraftSource(data.draft.source);
      } else {
        // Fallback default
        setDraftSubject(`Potential introduction — ${customer.firstName} and ${candidate.firstName}`);
        setDraftBody(
          `Hi ${customer.firstName},\n\nI wanted to share ${candidate.firstName}'s profile with you based in ${candidate.city}. They work as ${candidate.designation || candidate.professionCategory || "a professional"} and align well with your preferences.\n\nWarm regards,\n${user?.displayName || "Your Matchmaker"}`
        );
        setDraftSource("template");
      }
    } catch {
      setDraftSubject(`Potential introduction — ${customer.firstName} and ${candidate.firstName}`);
      setDraftBody(
        `Hi ${customer.firstName},\n\nI wanted to share ${candidate.firstName}'s profile with you based in ${candidate.city}.\n\nWarm regards,\n${user?.displayName || "Your Matchmaker"}`
      );
      setDraftSource("template");
    } finally {
      setGeneratingDraft(false);
    }
  }

  // Open Send Modal directly or from draft
  function openSendModal(candidate: any) {
    setActiveCandidateForSend(candidate);
    if (!draftBody) {
      setDraftSubject(`Potential introduction — ${customer.firstName} and ${candidate.firstName}`);
      setDraftBody(
        `Hi ${customer.firstName},\n\nI would love to introduce you to ${candidate.firstName} from ${candidate.city}. Please review their verified profile and let me know if you would like to connect.\n\nBest,\n${user?.displayName || "Your Matchmaker"}`
      );
    }
    setDraftModalOpen(false);
    setSendModalOpen(true);
  }

  // Confirm Mock Send
  async function handleConfirmMockSend() {
    if (!activeCandidateForSend || !customer) return;

    try {
      setSendingMatch(true);
      const res = await fetch("/api/matches/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          candidateId: activeCandidateForSend.candidateId,
          introDraft: draftBody,
          scoreSnapshot: {
            score: activeCandidateForSend.score,
            topReasons: activeCandidateForSend.topReasons,
            tradeoffs: activeCandidateForSend.tradeoffs,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record match send");

      // Mark candidate as mock sent in local state
      setMatches((prev) =>
        prev.map((m) =>
          m.candidateId === activeCandidateForSend.candidateId
            ? { ...m, mockSent: true, mockSentAt: new Date().toISOString() }
            : m
        )
      );

      // If stage was updated to MATCH_SENT, update customer state
      if (data.stageUpdated && data.newStage) {
        setCustomer((prev: any) => ({
          ...prev,
          journeyStage: data.newStage,
        }));
      }

      setSendModalOpen(false);
      setSendSuccessToast(
        `Mock send recorded for ${activeCandidateForSend.fullName}. No real email was sent.`
      );
      setTimeout(() => setSendSuccessToast(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to send match");
    } finally {
      setSendingMatch(false);
    }
  }

  const wordCount = draftBody.trim() ? draftBody.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <div className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Profile Unavailable</h2>
          <p className="text-sm text-slate-400">{error || "Customer not found."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      {/* Success Notification Toast */}
      {sendSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold">{sendSuccessToast}</div>
            <div className="text-[11px] text-emerald-400/80">Activity logged to timeline</div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Worklist</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Customer ID:</span>
            <code className="text-slate-400 font-mono text-[11px]">{customer.id.slice(0, 10)}...</code>
          </div>
        </div>

        {/* Customer Hero Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Avatar & Bio Snapshot */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-2xl sm:text-3xl text-amber-300 shadow-xl shadow-amber-500/10 shrink-0">
                {getInitials(customer.firstName, customer.lastName)}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {customer.fullName}
                  </h1>

                  {customer.verificationStatus === "DEMO_VERIFIED" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verified (demo)</span>
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Unverified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>{customer.age} yrs old</span>
                  <span>•</span>
                  <span>{customer.gender}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{customer.city}, {customer.country}</span>
                  </span>
                  <span>•</span>
                  <span>{customer.maritalStatus}</span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-2 pt-0.5">
                  <Briefcase className="h-3.5 w-3.5 text-amber-400/80" />
                  <span>
                    {customer.designation || "Occupation not provided"}
                    {customer.currentCompany && ` at ${customer.currentCompany}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Journey Stage Selector */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-700/80 space-y-2 lg:min-w-[280px]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Journey Stage
                </span>
                {stageSuccess && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="h-3 w-3" /> Saved
                  </span>
                )}
              </div>

              <select
                value={customer.journeyStage}
                onChange={(e) => handleStageChange(e.target.value)}
                disabled={updatingStage}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
              >
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

              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                <span>Changes logged to audit history</span>
                {updatingStage && <span className="text-amber-400">Saving...</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab("biodata")}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "biodata"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Full Biodata</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "preferences"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Partner Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab("matches")}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "matches"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Suggested Matches</span>
            {matchesLoaded && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                {matches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`pb-3 px-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "notes"
                ? "border-amber-500 text-amber-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Notes & Activity</span>
            {customer.notes?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {customer.notes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Full Biodata (PDF Spec) */}
        {activeTab === "biodata" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal & Cultural Details */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Personal & Demographics</span>
                </h3>

                <div className="divide-y divide-slate-800/80 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">First Name</span>
                    <span className="font-medium text-white">{customer.firstName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Last Name</span>
                    <span className="font-medium text-white">{customer.lastName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Gender</span>
                    <span className="font-medium text-white">{customer.gender}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Date of Birth</span>
                    <span className="font-medium text-white">
                      {new Date(customer.dateOfBirth).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Height</span>
                    <span className="font-medium text-white">
                      {customer.heightCm ? formatHeight(customer.heightCm) : "Not provided"}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Marital Status</span>
                    <span className="font-medium text-white">{customer.maritalStatus}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Languages Known</span>
                    <span className="font-medium text-white">
                      {customer.languagesKnown?.length
                        ? customer.languagesKnown.join(", ")
                        : "Not provided"}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Siblings</span>
                    <span className="font-medium text-white">
                      {customer.siblings != null ? customer.siblings : "Not provided"}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Caste (Sensitive — unranked)</span>
                    <span className="italic text-slate-400">
                      {customer.caste || "Not provided"}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-slate-400">Religion (Sensitive — unranked)</span>
                    <span className="italic text-slate-400">
                      {customer.religion || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact, Location & Career */}
              <div className="space-y-6">
                {/* Location & Contact */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location & Contact</span>
                  </h3>

                  <div className="divide-y divide-slate-800/80 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Country</span>
                      <span className="font-medium text-white">{customer.country}</span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">City</span>
                      <span className="font-medium text-white">{customer.city}</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>Email (Staff only)</span>
                      </span>
                      <span className="font-mono text-slate-300">{customer.email}</span>
                    </div>
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        <span>Phone (Staff only)</span>
                      </span>
                      <span className="font-mono text-slate-300">
                        {customer.phoneNumber || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Education & Career */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Education & Career</span>
                  </h3>

                  <div className="divide-y divide-slate-800/80 text-xs">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Undergraduate College</span>
                      <span className="font-medium text-white">
                        {customer.undergraduateCollege || "Not provided"}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Degree</span>
                      <span className="font-medium text-white">
                        {customer.degree || "Not provided"}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Current Company</span>
                      <span className="font-medium text-white">
                        {customer.currentCompany || "Not provided"}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Designation</span>
                      <span className="font-medium text-white">
                        {customer.designation || "Not provided"}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Profession Category</span>
                      <span className="font-medium text-white">
                        {customer.professionCategory || "Not specified"}
                      </span>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-400">Annual Income</span>
                      <span className="font-medium text-emerald-400 font-mono">
                        {formatIncome(customer.incomeAnnual, customer.incomeCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifestyle & Core Values */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>Lifestyle, Children & Values</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 mb-1">Wants Children?</div>
                  <div className="font-semibold text-white text-sm">
                    {customer.wantKids || "MAYBE"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 mb-1">Open to Relocation?</div>
                  <div className="font-semibold text-white text-sm">
                    {customer.openToRelocate || "MAYBE"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 mb-1">Comfortable with Pets?</div>
                  <div className="font-semibold text-white text-sm">
                    {customer.openToPets || "MAYBE"}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2">Core Life Values:</div>
                <div className="flex flex-wrap gap-2">
                  {customer.values?.length ? (
                    customer.values.map((val: string) => (
                      <span
                        key={val}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      >
                        {val}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-slate-500">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Partner Preferences */}
        {activeTab === "preferences" && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-400" />
                <span>Explicit Partner Preferences</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Criteria entered by customer or matchmaker used for deterministic scoring.
              </p>
            </div>

            {customer.partnerPreferences ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Preferred Age Range</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.minAge || "Any"} –{" "}
                    {customer.partnerPreferences.maxAge || "Any"} yrs
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Preferred Height</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.minHeightCm
                      ? `${customer.partnerPreferences.minHeightCm} cm`
                      : "Any"}{" "}
                    –{" "}
                    {customer.partnerPreferences.maxHeightCm
                      ? `${customer.partnerPreferences.maxHeightCm} cm`
                      : "Any"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Minimum Annual Income</span>
                  <div className="text-sm font-semibold text-emerald-400">
                    {customer.partnerPreferences.minIncome
                      ? formatIncome(customer.partnerPreferences.minIncome, "INR")
                      : "No minimum preference"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Desired Cities</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.desiredCities?.length
                      ? customer.partnerPreferences.desiredCities.join(", ")
                      : "Any city"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Marital Status Preference</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.desiredMaritalStatuses?.length
                      ? customer.partnerPreferences.desiredMaritalStatuses.join(", ")
                      : "Any"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Children Preference</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.kidsPreference || "Flexible (MAYBE)"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Relocation Preference</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.preferredRelocation || "Flexible (MAYBE)"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Pets Preference</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.petsPreference || "Flexible (MAYBE)"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Desired Professions</span>
                  <div className="text-sm font-semibold text-white">
                    {customer.partnerPreferences.professionPreferences?.length
                      ? customer.partnerPreferences.professionPreferences.join(", ")
                      : "Open to all professions"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                No explicit partner preferences on file. Algorithm uses customer profile defaults.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Suggested Matches (Deterministic Algo) */}
        {activeTab === "matches" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>Deterministic Candidate Matches</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Top verified opposite-gender candidates ranked by weighted compatibility score and explicit reasons.
                </p>
              </div>

              <button
                onClick={loadMatches}
                disabled={loadingMatches}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMatches ? "animate-spin" : ""}`} />
                <span>Re-run Algo</span>
              </button>
            </div>

            {loadingMatches ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-sm text-slate-400">Evaluating 100+ candidates...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
                <Heart className="h-10 w-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-semibold text-white">No Matches Found</h4>
                <p className="text-xs text-slate-400">
                  Try adjusting the customer's partner preferences to broaden the pool.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((m) => (
                  <div
                    key={m.candidateId}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Candidate Avatar & Basics */}
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-300 shrink-0">
                          #{m.rank}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">
                              {m.fullName}
                            </h4>
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Verified</span>
                            </span>
                            {m.mockSent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                Mock Sent
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{m.age} yrs</span>
                            <span>•</span>
                            <span>{m.heightFormatted}</span>
                            <span>•</span>
                            <span>{m.city}</span>
                            <span>•</span>
                            <span>{m.designation || m.professionCategory || "Professional"}</span>
                            <span>•</span>
                            <span className="text-emerald-400">{m.incomeFormatted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Score Badge & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-right">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-amber-400">
                              {m.score}
                            </span>
                            <span className="text-[10px] text-slate-500">/100</span>
                          </div>
                          <div className="text-[10px] font-medium text-slate-400">
                            {m.scoreLabel}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDraftModal(m)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            <span>Draft AI Intro</span>
                          </button>

                          <button
                            onClick={() => openSendModal(m)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 transition shadow-md shadow-amber-500/20 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Send Match</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Reasons & Tradeoffs Section */}
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Positive reasons */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Alignment Strengths</span>
                        </span>
                        <div className="space-y-1">
                          {m.topReasons.length ? (
                            m.topReasons.map((r: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{r}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Moderate general fit</span>
                          )}
                        </div>
                      </div>

                      {/* Tradeoffs */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <span>Notable Tradeoffs</span>
                        </span>
                        <div className="space-y-1">
                          {m.tradeoffs.length ? (
                            m.tradeoffs.map((t: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                                <span className="text-amber-400 font-bold">•</span>
                                <span>{t}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">No significant tradeoffs identified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Toggle */}
                    <div className="pt-2 flex justify-between items-center text-[11px] text-slate-500">
                      <span>Confidence: {m.coverageLabel}</span>
                      <button
                        onClick={() =>
                          setSelectedCandidateForBreakdown(
                            selectedCandidateForBreakdown?.candidateId === m.candidateId ? null : m
                          )
                        }
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>
                          {selectedCandidateForBreakdown?.candidateId === m.candidateId
                            ? "Hide Scoring Breakdown"
                            : "Why this match? (Scoring Details)"}
                        </span>
                        <ChevronDown
                          className={`h-3 w-3 transform transition-transform ${
                            selectedCandidateForBreakdown?.candidateId === m.candidateId ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expanded Breakdown Table */}
                    {selectedCandidateForBreakdown?.candidateId === m.candidateId && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-2">
                        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Deterministic Feature Score Matrix
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          {m.breakdown.map((f: any) => (
                            <div key={f.key} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                              <div className="flex justify-between text-slate-400 text-[10px] uppercase">
                                <span>{f.key}</span>
                                <span>Weight: {f.weight}</span>
                              </div>
                              <div className="font-semibold text-white mt-0.5">
                                {Math.round(f.score * 100)}%
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={f.reason}>
                                {f.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Notes & Timeline */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* Note Composer Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Add Meeting or Call Note</span>
              </h3>

              {noteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{noteError}</span>
                </div>
              )}

              <form onSubmit={handleAddNote} className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-slate-400">Interaction Type:</label>
                  <div className="flex items-center gap-2">
                    {(["CALL", "MEETING", "OTHER"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setInteractionType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          interactionType === type
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    maxLength={2000}
                    placeholder="Record notes from client interview, preference updates, or call feedback (up to 2,000 characters)..."
                    className="w-full p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 text-right mt-1">
                    {noteBody.length}/2000 characters
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingNote || !noteBody.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 disabled:opacity-40 transition cursor-pointer"
                  >
                    {savingNote ? "Saving Note..." : "Save Note"}
                  </button>
                </div>
              </form>
            </div>

            {/* Combined Activity Timeline */}
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>Audit Timeline & Notes Log</span>
              </h3>

              <div className="space-y-4">
                {/* Notes List */}
                {customer.notes?.map((n: any) => (
                  <div key={n.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{n.author.displayName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                          {n.interactionType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(n.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                ))}

                {/* Journey Stage Change Events */}
                {customer.journeyEvents?.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-indigo-300">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        <strong>{evt.actor.displayName}</strong> transitioned stage from{" "}
                        <code className="text-slate-200">{formatStage(evt.fromStage)}</code> to{" "}
                        <code className="text-amber-300 font-semibold">{formatStage(evt.toStage)}</code>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                ))}

                {/* Mock Send Suggestion Events */}
                {customer.matchSuggestions?.map((sug: any) => (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300 font-medium">
                        <Send className="h-3.5 w-3.5" />
                        <span>
                          Mock Match Sent: <strong>{sug.candidate.firstName} {sug.candidate.lastName}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(sug.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {sug.introDraft && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2">
                        "{sug.introDraft}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Draft Intro Modal */}
      {draftModalOpen && activeCandidateForDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-xl w-full space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Draft Introduction Email</h3>
                  <p className="text-[11px] text-slate-400">
                    Candidate: {activeCandidateForDraft.fullName} ({activeCandidateForDraft.city})
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  draftSource === "ai"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {draftSource === "ai" ? "OpenAI GPT-4o-mini" : "Deterministic Template"}
              </span>
            </div>

            {generatingDraft ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="h-6 w-6 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400">Generating personalized intro draft...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Subject Line</label>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Email Body</label>
                    <span className={`text-[10px] ${wordCount > 120 ? "text-rose-400 font-bold" : "text-slate-400"}`}>
                      {wordCount}/120 words limit
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white leading-relaxed font-sans"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Editable by matchmaker. Sensitive information (caste, religion, salary) is strictly omitted.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDraftModal(activeCandidateForDraft)}
                  disabled={generatingDraft}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={() => openSendModal(activeCandidateForDraft)}
                  disabled={generatingDraft || !draftBody.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Proceed to Send Match →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mock Send Confirmation Modal */}
      {sendModalOpen && activeCandidateForSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-700 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Match Transmission (Mock)</h3>
                <p className="text-xs text-slate-400">
                  Sending {activeCandidateForSend.fullName} to {customer.fullName}
                </p>
              </div>
            </div>

            {/* Clear Mock Send Warning Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">MOCK SEND MODE ONLY</div>
                <div className="text-[11px] text-amber-300/80 mt-0.5">
                  No real email will be transmitted. A record will be logged to the customer's activity timeline with frozen match scores, and the journey stage will advance.
                </div>
              </div>
            </div>

            {/* Preview of Email Payload */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400">
                <strong>To:</strong> {customer.email} (Demo Customer)
              </div>
              <div className="text-slate-400">
                <strong>Subject:</strong> {draftSubject}
              </div>
              <div className="text-slate-300 pt-2 border-t border-slate-800 whitespace-pre-wrap font-sans text-[11px]">
                {draftBody}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMockSend}
                disabled={sendingMatch}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
              >
                {sendingMatch ? (
                  <span>Recording Send...</span>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm Mock Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
