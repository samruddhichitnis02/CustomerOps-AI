import React, { useState } from 'react';
import { ShieldAlert, Check, X, AlertTriangle, UserCheck, DollarSign, RefreshCw } from 'lucide-react';
import { PendingApproval } from '../types';
import { submitApprovalDecision } from '../api';

interface ApprovalQueueProps {
  approvals: PendingApproval[];
  loading: boolean;
  onRefresh: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approvals, loading, onRefresh }) => {
  const [actingId, setActingId] = useState<number | null>(null);
  const [comment, setComment] = useState<{ [id: number]: string }>({});

  const handleDecision = async (approvalId: number, decision: 'APPROVE' | 'REJECT') => {
    setActingId(approvalId);
    try {
      await submitApprovalDecision(
        approvalId,
        decision,
        'Sarah Connor (Supervisor)',
        comment[approvalId] || (decision === 'APPROVE' ? 'Approved by Supervisor' : 'Rejected due to policy limit')
      );
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to process approval decision.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm text-slate-100">Human Approval Queue (HITL)</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                {approvals.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400">Safety Policy: Refunds &gt; $50.00 require human sign-off</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh Approvals"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Queue List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {approvals.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-emerald-950/50 text-emerald-400 flex items-center justify-center mb-2">
              <UserCheck size={20} />
            </div>
            <p className="text-sm font-medium text-slate-300">All Clear — No Pending Approvals</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Trigger a refund request exceeding $50 in the customer portal to test the live supervisor approval flow.
            </p>
          </div>
        ) : (
          approvals.map((item) => (
            <div
              key={item.approval_id}
              className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-3 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

              {/* Item Info */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/40">
                      REF-{item.approval_id}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{item.order_number}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Customer: <span className="text-slate-200 font-medium">{item.customer_name}</span> ({item.customer_email})
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-slate-100 flex items-center justify-end font-mono">
                    <DollarSign size={16} className="text-emerald-400" />
                    <span>{item.amount.toFixed(2)}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">Above $50 Limit</span>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 font-medium">Customer Reason: </span>
                <span>{item.reason}</span>
              </div>

              {/* Reviewer Note Input */}
              <div>
                <input
                  type="text"
                  placeholder="Supervisor review notes (optional)..."
                  value={comment[item.approval_id] || ''}
                  onChange={(e) => setComment({ ...comment, [item.approval_id]: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => handleDecision(item.approval_id, 'APPROVE')}
                  disabled={actingId === item.approval_id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-emerald-600/20"
                >
                  <Check size={14} />
                  <span>Approve & Release Funds</span>
                </button>
                <button
                  onClick={() => handleDecision(item.approval_id, 'REJECT')}
                  disabled={actingId === item.approval_id}
                  className="flex-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <X size={14} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

