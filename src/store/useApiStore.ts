/**
 * useApiStore — drop-in replacement for usePortalStore that syncs to the
 * Vercel Postgres backend via /api/clients and /api/reports.
 *
 * To switch the app to the API-backed store:
 *   change the import in App.tsx from
 *     import { usePortalStore } from "./store/usePortalStore"
 *   to
 *     import { usePortalStore } from "./store/useApiStore"
 *
 * Behaviour:
 *  - Local Zustand state stays in sync for instant UI updates (optimistic).
 *  - Mutations fire API calls in the background; on failure the error is
 *    surfaced in apiStatus.error but local state is NOT rolled back (simple).
 *  - On first mount (via useApiStore.getState().init()) the store fetches all
 *    clients and reports from the API. Call init() once in your root component.
 */

import { create } from "zustand";
import type { ClientProfile, Quarter, QuarterlyBalances, Section } from "../types";
import { allDemoClients, allDemoReports } from "../data/demoData";
import { createDefaultClient, emptyReport, generateId } from "./usePortalStore";

// Re-export helpers so callers don't need two imports
export { createDefaultClient, emptyReport, generateId };

export interface ApiStatus {
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
}

interface PortalState {
  // Navigation
  activeSection: Section;
  selectedClientId: string | null;
  selectedYear: number;
  selectedQuarter: Quarter;

  // Data
  clients: ClientProfile[];
  reports: QuarterlyBalances[];

  // API status (extra, not in usePortalStore)
  apiStatus: ApiStatus;

  // Actions — same interface as usePortalStore
  setActiveSection: (section: Section) => void;
  setSelectedClientId: (clientId: string) => void;
  setSelectedYear: (year: number) => void;
  setSelectedQuarter: (quarter: Quarter) => void;
  upsertClient: (profile: ClientProfile) => void;
  deleteClient: (clientId: string) => void;
  saveReport: (report: QuarterlyBalances) => void;
  loadDemoScenario: () => void;
  clearAllData: () => void;

  // Init — call once on app mount to hydrate from API
  init: () => Promise<void>;
}

const currentYear = new Date().getFullYear();

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const usePortalStore = create<PortalState>()((set, get) => ({
  activeSection: "dashboard",
  selectedClientId: null,
  selectedYear: currentYear,
  selectedQuarter: "Q1",
  clients: [],
  reports: [],
  apiStatus: { loading: false, error: null, lastSynced: null },

  setActiveSection: (section) => set({ activeSection: section }),
  setSelectedClientId: (clientId) => set({ selectedClientId: clientId }),
  setSelectedYear: (year) => set({ selectedYear: year }),
  setSelectedQuarter: (quarter) => set({ selectedQuarter: quarter }),

  upsertClient: (profile) => {
    // Optimistic update
    set((state) => {
      const exists = state.clients.find((c) => c.id === profile.id);
      return {
        clients: exists
          ? state.clients.map((c) => (c.id === profile.id ? profile : c))
          : [...state.clients, profile],
        selectedClientId: profile.id,
      };
    });

    // Background sync
    apiFetch("/api/clients", { method: "POST", body: JSON.stringify(profile) }).catch((err) => {
      set({ apiStatus: { loading: false, error: String(err.message), lastSynced: null } });
    });
  },

  deleteClient: (clientId) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
      reports: state.reports.filter((r) => r.clientId !== clientId),
      selectedClientId: state.selectedClientId === clientId ? null : state.selectedClientId,
    }));

    // Background sync
    apiFetch(`/api/clients?id=${encodeURIComponent(clientId)}`, { method: "DELETE" }).catch(
      (err) => {
        set({ apiStatus: { loading: false, error: String(err.message), lastSynced: null } });
      },
    );
  },

  saveReport: (report) => {
    // Optimistic update
    set((state) => {
      const index = state.reports.findIndex((r) => r.id === report.id);
      if (index === -1) return { reports: [...state.reports, report] };
      const next = [...state.reports];
      next[index] = report;
      return { reports: next };
    });

    // Background sync
    apiFetch("/api/reports", { method: "POST", body: JSON.stringify(report) }).catch((err) => {
      set({ apiStatus: { loading: false, error: String(err.message), lastSynced: null } });
    });
  },

  loadDemoScenario: () => {
    const now = new Date().toISOString();
    const clients = allDemoClients.map((c) => ({ ...c, updatedAt: now }));
    const reports = allDemoReports.map((r) => ({ ...r, updatedAt: now }));

    set({
      clients,
      reports,
      selectedClientId: clients[0].id,
      selectedYear: reports[0].year,
      selectedQuarter: reports[0].quarter,
      activeSection: "dashboard",
    });

    // Sync clients FIRST, then reports (reports have FK → clients)
    Promise.all(
      clients.map((c) => apiFetch("/api/clients", { method: "POST", body: JSON.stringify(c) })),
    )
      .then(() =>
        Promise.all(
          reports.map((r) => apiFetch("/api/reports", { method: "POST", body: JSON.stringify(r) })),
        ),
      )
      .catch((err) => {
        set({ apiStatus: { loading: false, error: String(err.message), lastSynced: null } });
      });
  },

  clearAllData: () => {
    const { clients } = get();

    set({
      clients: [],
      reports: [],
      selectedClientId: null,
      selectedYear: currentYear,
      selectedQuarter: "Q1",
      activeSection: "dashboard",
    });

    // Delete all clients from API (cascade deletes reports)
    Promise.all(
      clients.map((c) =>
        apiFetch(`/api/clients?id=${encodeURIComponent(c.id)}`, { method: "DELETE" }),
      ),
    ).catch((err) => {
      set({ apiStatus: { loading: false, error: String(err.message), lastSynced: null } });
    });
  },

  init: async () => {
    set({ apiStatus: { loading: true, error: null, lastSynced: null } });
    try {
      const [clients, reports] = await Promise.all([
        apiFetch("/api/clients") as Promise<ClientProfile[]>,
        apiFetch("/api/reports") as Promise<QuarterlyBalances[]>,
      ]);
      set({
        clients,
        reports,
        apiStatus: { loading: false, error: null, lastSynced: new Date().toISOString() },
      });
    } catch (err) {
      // API unavailable — fall back to empty state (no crash)
      set({
        apiStatus: {
          loading: false,
          error: `Could not connect to database: ${(err as Error).message}`,
          lastSynced: null,
        },
      });
    }
  },
}));
