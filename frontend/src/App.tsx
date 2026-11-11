import React, { useState, useEffect } from 'react';
import { CustomerChat } from './components/CustomerChat';
import { ApprovalQueue } from './components/ApprovalQueue';
import { GraphTrace } from './components/GraphTrace';
import { CrmViewer } from './components/CrmViewer';
import { MetricsDashboard } from './components/MetricsDashboard';
import { StepTrace, PendingApproval, CrmRecords, LatencyMetrics } from './types';
import { fetchPendingApprovals, fetchCrmRecords, fetchLatencyMetrics } from './api';
import { ShieldCheck, Cpu, Database, Gauge, Sparkles, RefreshCw, Layers } from 'lucide-react';

export function App() {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'approvals' | 'graph' | 'crm' | 'metrics'>('approvals');
  const [executionSteps, setExecutionSteps] = useState<StepTrace[]>([]);
  const [lastAgentResponse, setLastAgentResponse] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [crmData, setCrmData] = useState<CrmRecords | null>(null);
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshAllData = async () => {
    setLoading(true);
    try {
      const [approvals, crm, metrics] = await Promise.all([
        fetchPendingApprovals(),
        fetchCrmRecords(),
        fetchLatencyMetrics()
      ]);
      setPendingApprovals(approvals);
      setCrmData(crm);
      setLatencyMetrics(metrics);
    } catch (err) {
      console.error('Failed to refresh data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleWorkflowExecuted = (steps: StepTrace[], rawResponse: any) => {
    setExecutionSteps(steps);
    setLastAgentResponse(rawResponse);
    refreshAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base tracking-tight text-white">CustomerOps AI</h1>
                <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Enterprise Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agentforce-Inspired AI CRM Orchestrator • LangGraph • Salesforce API • HITL Safety
              </p>
            </div>
          </div>

          {/* Quick Badges & Actions */}
          <div className="flex items-center space-x-2">
            <span className="hidden md:inline-flex text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-md">
              p95 &lt; 500ms Met
            </span>
            <span className="hidden md:inline-flex text-[11px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2.5 py-1 rounded-md">
              Bitext 90.0% Routing
            </span>
            <button
              onClick={refreshAllData}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: 2-Column Split View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Portal & Chat (5 Cols) */}
        <div className="lg:col-span-5 h-[760px]">
          <CustomerChat
            onWorkflowExecuted={handleWorkflowExecuted}
            onRefreshApprovals={refreshAllData}
          />
        </div>

        {/* Right Column: Agentforce Operations Console (7 Cols) */}
        <div className="lg:col-span-7 h-[760px] flex flex-col space-y-3">
          {/* Console Navigation Tabs */}
          <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveConsoleTab('approvals')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeConsoleTab === 'approvals'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={15} />
              <span>HITL Queue ({pendingApprovals.length})</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('graph')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeConsoleTab === 'graph'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu size={15} />
              <span>LangGraph Trace</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('crm')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeConsoleTab === 'crm'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database size={15} />
              <span>CRM Data</span>
            </button>

            <button
              onClick={() => setActiveConsoleTab('metrics')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                activeConsoleTab === 'metrics'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Gauge size={15} />
              <span>Metrics &amp; SLO</span>
            </button>
          </div>

          {/* Active Console View */}
          <div className="flex-1 overflow-hidden">
            {activeConsoleTab === 'approvals' && (
              <ApprovalQueue
                approvals={pendingApprovals}
                loading={loading}
                onRefresh={refreshAllData}
              />
            )}

            {activeConsoleTab === 'graph' && (
              <GraphTrace
                steps={executionSteps}
                rawResponse={lastAgentResponse}
              />
            )}

            {activeConsoleTab === 'crm' && (
              <CrmViewer
                crmData={crmData}
                loading={loading}
                onRefresh={refreshAllData}
              />
            )}

            {activeConsoleTab === 'metrics' && (
              <MetricsDashboard
                metrics={latencyMetrics}
                loading={loading}
                onRefresh={refreshAllData}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500">
        <p>CustomerOps AI • Built for Salesforce AI Labs Fellowship (Agentforce Architecture)</p>
      </footer>
    </div>
  );
}

