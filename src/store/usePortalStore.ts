import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClientProfile, Quarter, QuarterlyBalances, Section } from "../types";
import { allDemoClients, allDemoReports } from "../data/demoData";

interface PortalState {
  activeSection: Section;
  selectedClientId: string | null;
  selectedYear: number;
  selectedQuarter: Quarter;
  clients: ClientProfile[];
  reports: QuarterlyBalances[];
  setActiveSection: (section: Section) => void;
  setSelectedClientId: (clientId: string) => void;
  setSelectedYear: (year: number) => void;
  setSelectedQuarter: (quarter: Quarter) => void;
  upsertClient: (profile: ClientProfile) => void;
  deleteClient: (clientId: string) => void;
  saveReport: (report: QuarterlyBalances) => void;
  loadDemoScenario: () => void;
  clearAllData: () => void;
}

const currentYear = new Date().getFullYear();

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const createDefaultClient = (): ClientProfile => {
  const now = new Date().toISOString();
  return {
    id: generateId("client"),
    primaryName: "",
    spouseName: "",
    primaryDob: "",
    spouseDob: "",
    primarySsnLast4: "",
    spouseSsnLast4: "",
    monthlyInflow: 0,
    monthlyExpense: 0,
    insuranceDeductibles: 0,
    trustAddress: "",
    retirementAccounts: [{ id: generateId("ret"), owner: "client1", label: "IRA", last4: "" }],
    nonRetirementAccounts: [{ id: generateId("nonret"), label: "Brokerage", last4: "" }],
    liabilities: [{ id: generateId("liability"), label: "Mortgage", interestRate: 0 }],
    createdAt: now,
    updatedAt: now,
  };
};

export const emptyReport = (clientId: string, year: number, quarter: Quarter): QuarterlyBalances => ({
  id: `${clientId}-${year}-${quarter}`,
  clientId,
  year,
  quarter,
  privateReserveBalance: 0,
  trustValue: 0,
  retirementBalances: {},
  nonRetirementBalances: {},
  liabilityBalances: {},
  updatedAt: new Date().toISOString(),
});

export const usePortalStore = create<PortalState>()(
  persist(
    (set) => ({
      activeSection: "dashboard",
      selectedClientId: null,
      selectedYear: currentYear,
      selectedQuarter: "Q1",
      clients: [],
      reports: [],
      setActiveSection: (section) => set({ activeSection: section }),
      setSelectedClientId: (clientId) => set({ selectedClientId: clientId }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      setSelectedQuarter: (quarter) => set({ selectedQuarter: quarter }),
      upsertClient: (profile) =>
        set((state) => {
          const exists = state.clients.find((client) => client.id === profile.id);
          if (!exists) {
            return { clients: [...state.clients, profile], selectedClientId: profile.id };
          }
          return {
            clients: state.clients.map((client) => (client.id === profile.id ? profile : client)),
            selectedClientId: profile.id,
          };
        }),
      deleteClient: (clientId) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== clientId),
          reports: state.reports.filter((r) => r.clientId !== clientId),
          selectedClientId: state.selectedClientId === clientId ? null : state.selectedClientId,
        })),
      saveReport: (report) =>
        set((state) => {
          const index = state.reports.findIndex((item) => item.id === report.id);
          if (index === -1) {
            return { reports: [...state.reports, report] };
          }
          const next = [...state.reports];
          next[index] = report;
          return { reports: next };
        }),
      loadDemoScenario: () => {
        const now = new Date().toISOString();
        set({
          clients: allDemoClients.map((c) => ({ ...c, updatedAt: now })),
          reports: allDemoReports.map((r) => ({ ...r, updatedAt: now })),
          selectedClientId: allDemoClients[0].id,
          selectedYear: allDemoReports[0].year,
          selectedQuarter: allDemoReports[0].quarter,
          activeSection: "dashboard",
        });
      },
      clearAllData: () =>
        set({
          clients: [],
          reports: [],
          selectedClientId: null,
          selectedYear: currentYear,
          selectedQuarter: "Q1",
          activeSection: "dashboard",
        }),
    }),
    {
      name: "aw-client-report-portal",
    },
  ),
);
