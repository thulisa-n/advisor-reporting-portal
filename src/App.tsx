import { useEffect, useMemo, useState } from "react";
import type {
  ClientProfile,
  Liability,
  NonRetirementAccount,
  Quarter,
  QuarterlyBalances,
  RetirementAccount,
  Section,
} from "./types";
import { calculateAge, calculateOutputs, currency } from "./utils/calculations";
import { validateBalances, validateProfile } from "./utils/validation";
import { createDefaultClient, emptyReport, generateId, usePortalStore } from "./store/useApiStore";
import { generateSacsPdf, generateTccPdf } from "./utils/pdf";

const quarterOptions: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const sectionLabels: { id: Section; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "client-profile", label: "Client Profile" },
  { id: "quarterly-entry", label: "Quarterly Balances" },
  { id: "report-preview", label: "Report Preview" },
  { id: "report-history", label: "Report History" },
];

function parseAmount(input: string): number {
  if (!input.trim()) return 0;
  const value = Number(input.replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function parseRate(input: string): number {
  if (!input.trim()) return 0;
  const normalized = input.replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function TextField(props: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "number";
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">
        {props.label}
        {props.required ? <span className="ml-0.5 text-red-500">*</span> : ""}
      </span>
      <input
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        type={props.type ?? "text"}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Hydrate from Neon on first mount
  useEffect(() => {
    usePortalStore.getState().init();
  }, []);

  const {
    activeSection,
    selectedClientId,
    selectedYear,
    selectedQuarter,
    clients,
    reports,
    apiStatus,
    setActiveSection,
    setSelectedClientId,
    setSelectedYear,
    setSelectedQuarter,
    upsertClient,
    deleteClient,
    saveReport,
    loadDemoScenario,
    clearAllData,
  } = usePortalStore();

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const activeReport = useMemo(() => {
    if (!selectedClientId) return null;
    return (
      reports.find(
        (item) =>
          item.clientId === selectedClientId &&
          item.year === selectedYear &&
          item.quarter === selectedQuarter,
      ) ?? emptyReport(selectedClientId, selectedYear, selectedQuarter)
    );
  }, [reports, selectedClientId, selectedQuarter, selectedYear]);

  // Last report per client (for dashboard list)
  const lastReportByClient = useMemo(() => {
    const map: Record<string, QuarterlyBalances> = {};
    reports.forEach((r) => {
      const existing = map[r.clientId];
      if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) {
        map[r.clientId] = r;
      }
    });
    return map;
  }, [reports]);

  // All reports for the selected client, newest first
  const clientReports = useMemo(() => {
    if (!selectedClientId) return [];
    return [...reports.filter((r) => r.clientId === selectedClientId)].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [reports, selectedClientId]);

  const [draftClient, setDraftClient] = useState<ClientProfile>(createDefaultClient());
  const [draftReport, setDraftReport] = useState<QuarterlyBalances | null>(activeReport);
  const [clientHistory, setClientHistory] = useState<ClientProfile[]>([]);
  const [reportHistory, setReportHistory] = useState<QuarterlyBalances[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    if (selectedClient) {
      setDraftClient(selectedClient);
    } else {
      setDraftClient(createDefaultClient());
    }
    setClientHistory([]);
  }, [selectedClient]);

  useEffect(() => {
    setDraftReport(activeReport);
    setReportHistory([]);
  }, [activeReport]);

  const profileIssues = useMemo(() => validateProfile(draftClient), [draftClient]);
  const balanceIssues = useMemo(() => {
    if (!selectedClient || !draftReport) return [];
    return validateBalances(selectedClient, draftReport);
  }, [selectedClient, draftReport]);

  const calculations = useMemo(() => {
    if (!selectedClient || !draftReport) return null;
    return calculateOutputs(selectedClient, draftReport);
  }, [selectedClient, draftReport]);

  function saveClientProfile() {
    const now = new Date().toISOString();
    upsertClient({ ...draftClient, updatedAt: now });
    setClientHistory([]);
    showToast("Client profile saved ✓");
  }

  function applyDraftClientChange(updater: (prev: ClientProfile) => ClientProfile) {
    setDraftClient((prev) => {
      setClientHistory((history) => [...history, prev].slice(-30));
      return updater(prev);
    });
  }

  function undoDraftClientChange() {
    setClientHistory((history) => {
      const previous = history[history.length - 1];
      if (!previous) return history;
      setDraftClient(previous);
      return history.slice(0, -1);
    });
  }

  function resetClientToSaved() {
    if (selectedClient) {
      setDraftClient(selectedClient);
    } else {
      setDraftClient(createDefaultClient());
    }
    setClientHistory([]);
  }

  function applyDraftReportChange(updater: (prev: QuarterlyBalances) => QuarterlyBalances) {
    setDraftReport((prev) => {
      if (!prev) return prev;
      setReportHistory((history) => [...history, prev].slice(-30));
      return updater(prev);
    });
  }

  function undoDraftReportChange() {
    setReportHistory((history) => {
      const previous = history[history.length - 1];
      if (!previous) return history;
      setDraftReport(previous);
      return history.slice(0, -1);
    });
  }

  function resetReportToSaved() {
    setDraftReport(activeReport);
    setReportHistory([]);
  }

  function useLastValues() {
    if (!selectedClientId || !draftReport) return;
    const lastReport = reports
      .filter((item) => item.clientId === selectedClientId && item.id !== draftReport.id)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    if (!lastReport) return;
    applyDraftReportChange((prev) => ({
      ...prev,
      privateReserveBalance: lastReport.privateReserveBalance,
      trustValue: lastReport.trustValue,
      retirementBalances: { ...lastReport.retirementBalances },
      nonRetirementBalances: { ...lastReport.nonRetirementBalances },
      liabilityBalances: { ...lastReport.liabilityBalances },
      updatedAt: new Date().toISOString(),
    }));
  }

  function saveQuarterlyData() {
    if (!draftReport) return;
    saveReport({ ...draftReport, updatedAt: new Date().toISOString() });
    setReportHistory([]);
    showToast("Report saved ✓");
    setActiveSection("report-preview");
  }

  function handleDeleteClient(clientId: string) {
    if (deleteConfirmId === clientId) {
      deleteClient(clientId);
      setDeleteConfirmId(null);
      showToast("Client deleted");
    } else {
      setDeleteConfirmId(clientId);
    }
  }

  function formatReportDate(report: QuarterlyBalances) {
    return `${report.year} ${report.quarter}`;
  }

  function formatSavedDate(isoString: string) {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DB status banners */}
      {apiStatus.loading && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow">
          Syncing with database…
        </div>
      )}
      {apiStatus.error && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-medium text-white shadow">
          DB offline — working locally
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h1 className="text-lg font-semibold text-slate-900">AW Client Portal</h1>
            <p className="mt-0.5 text-xs text-slate-500">Quarterly SACS + TCC reports</p>
          </div>

          <nav className="mt-4 space-y-1">
            {sectionLabels.map((item) => (
              <button
                key={item.id}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  activeSection === item.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">Client</span>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                value={selectedClientId ?? ""}
                onChange={(event) => setSelectedClientId(event.target.value)}
              >
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.primaryName || "Untitled client"}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Year</span>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                  type="number"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Quarter</span>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
                  value={selectedQuarter}
                  onChange={(event) => setSelectedQuarter(event.target.value as Quarter)}
                >
                  {quarterOptions.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      {quarter}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-200 pt-4">
            <button
              className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-200"
              onClick={loadDemoScenario}
            >
              Load demo data
            </button>
            <button
              className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-200"
              onClick={clearAllData}
            >
              Clear all data
            </button>
            <button
              className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-200"
              onClick={() => setDarkMode((d) => !d)}
            >
              {darkMode ? "☀ Light mode" : "⊙ Dark mode"}
            </button>
          </div>
        </aside>

        <main className="space-y-6">

          {/* ── Dashboard ────────────────────────────────────────────── */}
          {activeSection === "dashboard" && (
            <section className="space-y-4">
              <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Clients</h2>
                  <p className="text-sm text-slate-500">{clients.length} client{clients.length !== 1 ? "s" : ""} · {reports.length} saved report{reports.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  onClick={() => {
                    const fresh = createDefaultClient();
                    setDraftClient(fresh);
                    setClientHistory([]);
                    setSelectedClientId(fresh.id);
                    setActiveSection("client-profile");
                  }}
                >
                  + Add Client
                </button>
              </header>

              {clients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                  <p className="text-sm font-medium text-slate-700">No clients yet</p>
                  <p className="mt-1 text-sm text-slate-500">Add your first client to get started.</p>
                  <button
                    className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    onClick={() => {
                      const fresh = createDefaultClient();
                      setDraftClient(fresh);
                      setClientHistory([]);
                      setSelectedClientId(fresh.id);
                      setActiveSection("client-profile");
                    }}
                  >
                    + Add Client
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => {
                    const last = lastReportByClient[client.id];
                    const clientAge = client.primaryDob ? calculateAge(client.primaryDob) : null;
                    return (
                      <div
                        key={client.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {client.primaryName || "Untitled client"}
                              {client.spouseName ? ` & ${client.spouseName}` : ""}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {clientAge !== null ? `Age ${clientAge}` : ""}
                              {clientAge !== null && client.spouseName ? " · " : ""}
                              {client.spouseName && client.spouseDob ? `Spouse age ${calculateAge(client.spouseDob)}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {last ? (
                                <span>
                                  Last report:{" "}
                                  <span className="font-medium text-slate-700">
                                    {formatReportDate(last)}
                                  </span>{" "}
                                  · saved {formatSavedDate(last.updatedAt)}
                                </span>
                              ) : (
                                <span className="italic text-slate-400">No reports yet</span>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setActiveSection("client-profile");
                              }}
                            >
                              Edit Profile
                            </button>
                            <button
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setActiveSection("quarterly-entry");
                              }}
                            >
                              Generate Report
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setActiveSection("report-history");
                              }}
                            >
                              History
                            </button>
                            {deleteConfirmId === client.id ? (
                              <span className="flex items-center gap-1">
                                <button
                                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteConfirmId(client.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Client Profile ───────────────────────────────────────── */}
          {activeSection === "client-profile" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Client Profile</h2>
                  <p className="text-sm text-slate-600">Static data is entered once and reused every quarter.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    onClick={() => {
                      const fresh = createDefaultClient();
                      setDraftClient(fresh);
                      setClientHistory([]);
                      setSelectedClientId(fresh.id);
                    }}
                  >
                    New Client
                  </button>
                  <button
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={undoDraftClientChange}
                    disabled={clientHistory.length === 0}
                  >
                    Undo
                  </button>
                  <button
                    className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    onClick={resetClientToSaved}
                  >
                    Revert to Saved
                  </button>
                  {selectedClient && (
                    deleteConfirmId === selectedClient.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                          onClick={() => { handleDeleteClient(selectedClient.id); setActiveSection("dashboard"); }}
                        >
                          Confirm Delete
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(selectedClient.id)}
                      >
                        Delete Client
                      </button>
                    )
                  )}
                </div>
              </div>

              {profileIssues.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Missing required fields: {profileIssues.map((issue) => issue.label).join(", ")}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Client 1 Name"
                  required
                  value={draftClient.primaryName}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, primaryName: value }))}
                />
                <TextField
                  label="Client 2 Name (optional)"
                  value={draftClient.spouseName}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, spouseName: value }))}
                />
                <TextField
                  label="Client 1 DOB"
                  required
                  type="date"
                  value={draftClient.primaryDob}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, primaryDob: value }))}
                />
                <TextField
                  label="Client 2 DOB"
                  type="date"
                  value={draftClient.spouseDob}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, spouseDob: value }))}
                />
                <TextField
                  label="Client 1 SSN Last 4"
                  required
                  value={draftClient.primarySsnLast4}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, primarySsnLast4: value }))}
                />
                <TextField
                  label="Client 2 SSN Last 4"
                  value={draftClient.spouseSsnLast4}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, spouseSsnLast4: value }))}
                />
                <TextField
                  label="Monthly Inflow"
                  required
                  type="number"
                  value={String(draftClient.monthlyInflow || "")}
                  onChange={(value) =>
                    applyDraftClientChange((prev) => ({ ...prev, monthlyInflow: parseAmount(value) }))
                  }
                />
                <TextField
                  label="Monthly Expense Budget"
                  required
                  type="number"
                  value={String(draftClient.monthlyExpense || "")}
                  onChange={(value) =>
                    applyDraftClientChange((prev) => ({ ...prev, monthlyExpense: parseAmount(value) }))
                  }
                />
                <TextField
                  label="Insurance Deductibles Total"
                  required
                  type="number"
                  value={String(draftClient.insuranceDeductibles || "")}
                  onChange={(value) =>
                    applyDraftClientChange((prev) => ({ ...prev, insuranceDeductibles: parseAmount(value) }))
                  }
                />
                <TextField
                  label="Trust Property Address"
                  value={draftClient.trustAddress}
                  onChange={(value) => applyDraftClientChange((prev) => ({ ...prev, trustAddress: value }))}
                />
              </div>

              <AccountEditors draftClient={draftClient} onDraftChange={applyDraftClientChange} />

              <div className="mt-6 flex justify-end">
                <button
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                  onClick={saveClientProfile}
                >
                  Save Client Profile
                </button>
              </div>
            </section>
          )}

          {/* ── Quarterly Balance Entry ──────────────────────────────── */}
          {activeSection === "quarterly-entry" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Quarterly Balance Entry</h2>
              {!selectedClient || !draftReport ? (
                <p className="mt-2 text-sm text-slate-600">Select a client first to enter quarterly balances.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter the latest balances. Totals update in real-time and required fields are flagged.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                      onClick={useLastValues}
                    >
                      Use Last Values
                    </button>
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={undoDraftReportChange}
                      disabled={reportHistory.length === 0}
                    >
                      Undo
                    </button>
                    <button
                      className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
                      onClick={resetReportToSaved}
                    >
                      Revert to Saved
                    </button>
                    <button
                      className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700"
                      onClick={saveQuarterlyData}
                    >
                      Save & Review Report
                    </button>
                  </div>

                  {balanceIssues.length > 0 && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Incomplete fields: {balanceIssues.map((issue) => issue.label).join(", ")}
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextField
                      label="Private Reserve Balance"
                      required
                      type="number"
                      value={String(draftReport.privateReserveBalance || "")}
                      onChange={(value) =>
                        applyDraftReportChange((prev) => ({
                          ...prev,
                          privateReserveBalance: parseAmount(value),
                        }))
                      }
                    />
                    <TextField
                      label="Trust Value (Zillow)"
                      type="number"
                      value={String(draftReport.trustValue || "")}
                      onChange={(value) =>
                        applyDraftReportChange((prev) => ({ ...prev, trustValue: parseAmount(value) }))
                      }
                    />
                  </div>

                  <BalanceGrid
                    title="Retirement Accounts"
                    rows={selectedClient.retirementAccounts.map((account) => ({
                      key: account.id,
                      label: `${account.owner === "client1" ? "Client 1" : "Client 2"} ${account.label} (${account.last4 || "----"})`,
                      value: draftReport.retirementBalances[account.id],
                      onChange: (value) =>
                        applyDraftReportChange((prev) => ({
                          ...prev,
                          retirementBalances: { ...prev.retirementBalances, [account.id]: value },
                        })),
                    }))}
                  />

                  <BalanceGrid
                    title="Non-Retirement Accounts"
                    rows={selectedClient.nonRetirementAccounts.map((account) => ({
                      key: account.id,
                      label: `${account.label} (${account.last4 || "----"})`,
                      value: draftReport.nonRetirementBalances[account.id],
                      onChange: (value) =>
                        applyDraftReportChange((prev) => ({
                          ...prev,
                          nonRetirementBalances: { ...prev.nonRetirementBalances, [account.id]: value },
                        })),
                    }))}
                  />

                  <BalanceGrid
                    title="Liabilities"
                    rows={selectedClient.liabilities.map((liability) => ({
                      key: liability.id,
                      label: `${liability.label} (${liability.interestRate || 0}%)`,
                      value: draftReport.liabilityBalances[liability.id],
                      onChange: (value) =>
                        applyDraftReportChange((prev) => ({
                          ...prev,
                          liabilityBalances: { ...prev.liabilityBalances, [liability.id]: value },
                        })),
                    }))}
                  />
                </>
              )}
            </section>
          )}

          {/* ── Report Preview ───────────────────────────────────────── */}
          {activeSection === "report-preview" && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Report Preview</h2>
              {!selectedClient || !draftReport || !calculations ? (
                <p className="mt-2 text-sm text-slate-600">Select a client and enter balances to preview report.</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-slate-600">
                    Net worth excludes liabilities from subtraction. Non-retirement total excludes trust.
                  </p>
                  {(profileIssues.length > 0 || balanceIssues.length > 0) && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      Fix required fields before PDF generation.
                    </div>
                  )}

                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">SACS — Cash Flow</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <MetricCard label="Monthly Inflow" value={currency.format(selectedClient.monthlyInflow)} accent="green" />
                      <MetricCard label="Monthly Outflow" value={currency.format(selectedClient.monthlyExpense)} accent="red" />
                      <MetricCard label="Excess to Private Reserve" value={currency.format(calculations.excessToPrivateReserve)} accent="blue" />
                      <MetricCard label="Private Reserve Balance" value={currency.format(draftReport.privateReserveBalance)} />
                      <MetricCard label="Private Reserve Target" value={currency.format(calculations.privateReserveTarget)} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">TCC — Net Worth</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      <MetricCard label="Client 1 Retirement Total" value={currency.format(calculations.client1RetirementTotal)} />
                      <MetricCard label="Client 2 Retirement Total" value={currency.format(calculations.client2RetirementTotal)} />
                      <MetricCard label="Non-Retirement Total" value={currency.format(calculations.nonRetirementTotal)} />
                      <MetricCard label="Trust Total" value={currency.format(calculations.trustTotal)} />
                      <MetricCard label="Liabilities (Separate)" value={currency.format(calculations.liabilitiesTotal)} accent="red" />
                      <MetricCard label="Grand Total Net Worth" value={currency.format(calculations.netWorth)} accent="dark" />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={profileIssues.length > 0 || balanceIssues.length > 0}
                      onClick={() => generateSacsPdf(selectedClient, draftReport, calculations)}
                    >
                      Download SACS PDF
                    </button>
                    <button
                      className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={profileIssues.length > 0 || balanceIssues.length > 0}
                      onClick={() => generateTccPdf(selectedClient, draftReport, calculations)}
                    >
                      Download TCC PDF
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── Report History ───────────────────────────────────────── */}
          {activeSection === "report-history" && (
            <section className="space-y-4">
              <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Report History</h2>
                  <p className="text-sm text-slate-500">
                    {selectedClient
                      ? `${selectedClient.primaryName}${selectedClient.spouseName ? ` & ${selectedClient.spouseName}` : ""}`
                      : "Select a client to view history"}
                  </p>
                </div>
                {selectedClient && (
                  <button
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    onClick={() => setActiveSection("quarterly-entry")}
                  >
                    + New Report
                  </button>
                )}
              </header>

              {!selectedClient ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="text-sm text-slate-500">Select a client from the sidebar to view their report history.</p>
                </div>
              ) : clientReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <p className="text-sm font-medium text-slate-700">No reports saved yet</p>
                  <p className="mt-1 text-sm text-slate-500">Generate the first report for this client.</p>
                  <button
                    className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    onClick={() => setActiveSection("quarterly-entry")}
                  >
                    Generate Report
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  {clientReports.map((report, i) => {
                    const calc = calculateOutputs(selectedClient, report);
                    return (
                      <div
                        key={report.id}
                        className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                          i !== clientReports.length - 1 ? "border-b border-slate-100" : ""
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{formatReportDate(report)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Saved {formatSavedDate(report.updatedAt)} · Net worth {currency.format(calc.netWorth)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => generateSacsPdf(selectedClient, report, calc)}
                          >
                            SACS PDF
                          </button>
                          <button
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => generateTccPdf(selectedClient, report, calc)}
                          >
                            TCC PDF
                          </button>
                          <button
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                            onClick={() => {
                              setSelectedYear(report.year);
                              setSelectedQuarter(report.quarter);
                              setActiveSection("quarterly-entry");
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

function MetricCard(props: { label: string; value: string; accent?: "green" | "red" | "blue" | "dark" }) {
  const accentMap: Record<string, string> = {
    green: "border-l-4 border-l-green-400",
    red:   "border-l-4 border-l-red-400",
    blue:  "border-l-4 border-l-blue-400",
    dark:  "border-l-4 border-l-slate-700",
  };
  const border = props.accent ? (accentMap[props.accent] ?? "") : "";
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${border}`}>
      <p className="text-xs uppercase tracking-wide text-slate-500">{props.label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{props.value}</p>
    </div>
  );
}

function BalanceGrid(props: {
  title: string;
  rows: { key: string; label: string; value: number | undefined; onChange: (value: number) => void }[];
}) {
  return (
    <div className="mt-5 rounded-xl border border-slate-200 p-4">
      <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {props.rows.map((row) => (
          <TextField
            key={row.key}
            label={row.label}
            required
            type="number"
            value={row.value === undefined ? "" : String(row.value)}
            onChange={(value) => row.onChange(parseAmount(value))}
          />
        ))}
      </div>
    </div>
  );
}

function AccountEditors(props: {
  draftClient: ClientProfile;
  onDraftChange: (updater: (prev: ClientProfile) => ClientProfile) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <AccountListEditor
        title="Retirement Accounts"
        rows={props.draftClient.retirementAccounts}
        onAdd={() =>
          props.onDraftChange((prev) => ({
            ...prev,
            retirementAccounts: [
              ...prev.retirementAccounts,
              { id: generateId("ret"), owner: "client1", label: "IRA", last4: "" },
            ],
          }))
        }
        onChange={(nextRows) => props.onDraftChange((prev) => ({ ...prev, retirementAccounts: nextRows }))}
      />
      <NonRetirementEditor
        rows={props.draftClient.nonRetirementAccounts}
        onAdd={() =>
          props.onDraftChange((prev) => ({
            ...prev,
            nonRetirementAccounts: [...prev.nonRetirementAccounts, { id: generateId("nonret"), label: "Brokerage", last4: "" }],
          }))
        }
        onChange={(nextRows) => props.onDraftChange((prev) => ({ ...prev, nonRetirementAccounts: nextRows }))}
      />
      <LiabilityEditor
        rows={props.draftClient.liabilities}
        onAdd={() =>
          props.onDraftChange((prev) => ({
            ...prev,
            liabilities: [...prev.liabilities, { id: generateId("liability"), label: "Mortgage", interestRate: 0 }],
          }))
        }
        onChange={(nextRows) => props.onDraftChange((prev) => ({ ...prev, liabilities: nextRows }))}
      />
    </div>
  );
}

function AccountListEditor(props: {
  title: string;
  rows: RetirementAccount[];
  onAdd: () => void;
  onChange: (rows: RetirementAccount[]) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={props.onAdd}>
          + Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {props.rows.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-4">
            <select
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              value={row.owner}
              onChange={(event) =>
                props.onChange(
                  props.rows.map((item) =>
                    item.id === row.id ? { ...item, owner: event.target.value as "client1" | "client2" } : item,
                  ),
                )
              }
            >
              <option value="client1">Client 1</option>
              <option value="client2">Client 2</option>
            </select>
            <select
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              value={row.label}
              onChange={(event) =>
                props.onChange(props.rows.map((item) => (item.id === row.id ? { ...item, label: event.target.value as RetirementAccount["label"] } : item)))
              }
            >
              <option value="IRA">IRA</option>
              <option value="Roth IRA">Roth IRA</option>
              <option value="401K">401K</option>
              <option value="Pension">Pension</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              placeholder="Last 4"
              value={row.last4}
              onChange={(event) =>
                props.onChange(props.rows.map((item) => (item.id === row.id ? { ...item, last4: event.target.value } : item)))
              }
            />
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700 hover:bg-red-100"
              onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NonRetirementEditor(props: {
  rows: NonRetirementAccount[];
  onAdd: () => void;
  onChange: (rows: NonRetirementAccount[]) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Non-Retirement Accounts</h3>
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={props.onAdd}>
          + Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {props.rows.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              value={row.label}
              onChange={(event) =>
                props.onChange(props.rows.map((item) => (item.id === row.id ? { ...item, label: event.target.value as NonRetirementAccount["label"] } : item)))
              }
            >
              <option value="Brokerage">Brokerage</option>
              <option value="Joint">Joint</option>
              <option value="Savings">Savings</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              placeholder="Last 4"
              value={row.last4}
              onChange={(event) =>
                props.onChange(props.rows.map((item) => (item.id === row.id ? { ...item, last4: event.target.value } : item)))
              }
            />
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700 hover:bg-red-100"
              onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiabilityEditor(props: {
  rows: Liability[];
  onAdd: () => void;
  onChange: (rows: Liability[]) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Liabilities</h3>
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200" onClick={props.onAdd}>
          + Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {props.rows.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              value={row.label}
              onChange={(event) =>
                props.onChange(props.rows.map((item) => (item.id === row.id ? { ...item, label: event.target.value as Liability["label"] } : item)))
              }
            >
              <option value="Mortgage">Mortgage</option>
              <option value="Auto Loan">Auto Loan</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Credit Line">Credit Line</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              placeholder="Interest rate %"
              type="number"
              value={row.interestRate}
              onChange={(event) =>
                props.onChange(
                  props.rows.map((item) =>
                    item.id === row.id ? { ...item, interestRate: parseRate(event.target.value) } : item,
                  ),
                )
              }
            />
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700 hover:bg-red-100"
              onClick={() => props.onChange(props.rows.filter((item) => item.id !== row.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
