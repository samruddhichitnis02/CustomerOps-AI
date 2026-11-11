import React, { useState } from 'react';
import { Database, User, Package, FolderGit2, DollarSign, RotateCcw } from 'lucide-react';
import { CrmRecords } from '../types';
import { resetCrmData } from '../api';

interface CrmViewerProps {
  crmData: CrmRecords | null;
  loading: boolean;
  onRefresh: () => void;
}

export const CrmViewer: React.FC<CrmViewerProps> = ({ crmData, loading, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers' | 'cases' | 'refunds'>('orders');
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('Reset CRM database to default seed data?')) return;
    setResetting(true);
    try {
      await resetCrmData();
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to reset CRM data.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Database size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm text-slate-100">Salesforce CRM Records</h2>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 rounded-full">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">Contacts, Orders, Cases, and Financial Refunds</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors"
        >
          <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} />
          <span>Reset Seed</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package size={14} />
          <span>Orders ({crmData?.orders.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User size={14} />
          <span>Customers ({crmData?.customers.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'refunds'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign size={14} />
          <span>Refunds ({crmData?.refunds.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center space-x-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === 'cases'
              ? 'border-blue-500 text-blue-400 bg-blue-950/20 rounded-t-lg'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderGit2 size={14} />
          <span>Cases ({crmData?.cases.length || 0})</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading CRM data...</div>
        ) : (
          <div>
            {activeTab === 'orders' && (
              <div className="space-y-2">
                {crmData?.orders.map((o) => (
                  <div key={o.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400">{o.order_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          o.status === 'Cancelled'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                            : o.status === 'Delivered'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                            : 'bg-blue-950/70 text-blue-300 border border-blue-800/40'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="text-slate-300 flex items-center justify-between">
                      <span>Total: ${o.total_amount.toFixed(2)}</span>
                      <span className="font-mono text-[11px] text-slate-500">Tracking: {o.tracking_number}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{o.shipping_address}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-2">
                {crmData?.customers.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">{c.name}</span>
                      <span className="bg-purple-950/70 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-mono text-[10px]">
                        {c.tier}
                      </span>
                    </div>
                    <div className="text-slate-400">{c.email} • {c.phone}</div>
                    <div className="text-[10px] font-mono text-slate-500">Salesforce Contact ID: {c.salesforce_id}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'refunds' && (
              <div className="space-y-2">
                {crmData?.refunds.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">REF-{r.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                            : r.status === 'REJECTED'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="text-slate-200 font-semibold">${r.amount.toFixed(2)}</div>
                    <div className="text-slate-400 text-[11px]">{r.reason}</div>
                    {r.approved_by && (
                      <div className="text-[10px] font-mono text-emerald-400">Approved by: {r.approved_by}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="space-y-2">
                {crmData?.cases.map((cs) => (
                  <div key={cs.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-200">{cs.case_number}</span>
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {cs.priority} Priority
                      </span>
                    </div>
                    <div className="font-medium text-slate-200">{cs.subject}</div>
                    <div className="text-[11px] text-slate-400">Status: {cs.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

