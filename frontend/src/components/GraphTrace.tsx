import React from 'react';
import { GitCommit, Activity, ArrowRight, CheckCircle2, ShieldAlert, Zap, Cpu } from 'lucide-react';
import { StepTrace } from '../types';

interface GraphTraceProps {
  steps: StepTrace[];
  rawResponse?: any;
}

export const GraphTrace: React.FC<GraphTraceProps> = ({ steps, rawResponse }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-slate-100">LangGraph State Inspector</h2>
            <p className="text-xs text-slate-400">Live Agent Execution &amp; State Transitions</p>
          </div>
        </div>

        {rawResponse && (
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
            {rawResponse.latency_ms} ms total
          </span>
        )}
      </div>

      {/* Trace Timeline */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {steps.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <Activity size={24} className="text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">Awaiting Agent Execution</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Send a request in the customer portal to inspect real-time LangGraph node transitions, intent routing, and tool calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const isApproval = step.status.includes('APPROVAL');
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    isApproval
                      ? 'bg-amber-950/40 border-amber-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200">{step.step_name}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-500">{step.timestamp}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isApproval
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-600/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  {step.details && (
                    <pre className="mt-2 p-2 bg-slate-900/90 rounded border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

