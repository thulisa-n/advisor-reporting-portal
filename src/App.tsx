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
import { calculateOutputs, currency } from "./utils/calculations";
import { validateBalances, validateProfile } from "./utils/validation";
import { createDefaultClient, emptyReport, generateId, usePortalStore } from "./store/usePortalStore";
import { generateSacsPdf, generateTccPdf } from "./utils/pdf";

const quarterOptions: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const sectionLabels: { id: Section; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "client-profile", label: "Client Profile" },
  { id: "quarterly-entry", label: "Quarterly Balances" },
  { id: "report-preview", label: "Report Preview" },
];

function parseAmount(input: string): number {
  if (!input.trim()) return 0;
  const value = Number(input.replace(/,/g, ""));
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
        {props.required ? " *" : ""}
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
  const {
    activeSection,
    selectedClientId,
    selectedYear,
    selectedQuarter,
    clients,
    reports,
    setActiveSection,
    setSelectedClientId,
    setSelectedYear,
    setSelectedQuarter,
    upsertClient,
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

  const [draftClient, setDraftClient] = useState<ClientProfile>(createDefaultClient());
  const [draftReport, setDraftReport] = useState<QuarterlyBalances | null>(activeReport);
  const [clientHistory, setClientHistory] = useState<ClientProfile[]>([]);
  const [reportHistory, setReportHistory] = useState<QuarterlyBalances[]>([]);

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
    setActiveSection("report-preview");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">AW Client Report Portal</h1>
          <p className="mt-1 text-xs text-slate-500">Quarterly SACS + TCC reports</p>

          <nav className="mt-4 space-y-2">
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
        </aside>

        <main className="space-y-6">
          {activeSection === "dashboard" && (
            <section className="space-y-4">
              <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
                <p className="text-sm text-slate-600">
                  Manage client profiles, enter quarterly balances, and generate polished SACS/TCC reports.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    onClick={loadDemoScenario}
                  >
                    Load Demo Data
                  </button>
                  <button
                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300"
                    onClick={clearAllData}
                  >
                    Clear Data
                  </button>
                </div>
              </header>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Clients</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{clients.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Saved Reports</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{reports.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Current Quarter</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {selectedYear} {selectedQuarter}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Workflow checklist</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Create or update client profile with account structure.</li>
                  <li>Enter quarterly balances and use last values where needed.</li>
                  <li>Review real-time calculations and required field flags.</li>
                  <li>Preview report and download SACS/TCC PDFs.</li>
                </ul>
              </div>
            </section>
          )}

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
                  required
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
                      required
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

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <MetricCard label="Monthly Inflow" value={currency.format(selectedClient.monthlyInflow)} />
                    <MetricCard label="Monthly Outflow" value={currency.format(selectedClient.monthlyExpense)} />
                    <MetricCard label="Excess to Private Reserve" value={currency.format(calculations.excessToPrivateReserve)} />
                    <MetricCard label="Private Reserve Target" value={currency.format(calculations.privateReserveTarget)} />
                    <MetricCard label="Client 1 Retirement Total" value={currency.format(calculations.client1RetirementTotal)} />
                    <MetricCard label="Client 2 Retirement Total" value={currency.format(calculations.client2RetirementTotal)} />
                    <MetricCard
                      label="Non-Retirement Total (No Trust)"
                      value={currency.format(calculations.nonRetirementTotal)}
                    />
                    <MetricCard label="Trust Total" value={currency.format(calculations.trustTotal)} />
                    <MetricCard label="Liabilities (Separate)" value={currency.format(calculations.liabilitiesTotal)} />
                    <MetricCard label="Grand Total Net Worth" value={currency.format(calculations.netWorth)} />
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
        </main>
      </div>
    </div>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700" onClick={props.onAdd}>
          Add
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
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700"
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
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700" onClick={props.onAdd}>
          Add
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
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700"
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
        <button className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700" onClick={props.onAdd}>
          Add
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
                    item.id === row.id ? { ...item, interestRate: parseAmount(event.target.value) } : item,
                  ),
                )
              }
            />
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-sm text-red-700"
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
