import { PendingApproval, CrmRecords, LatencyMetrics } from './types';

const API_BASE = '/api';

export async function sendChatMessage(sessionId: string, message: string, customerEmail: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      customer_email: customerEmail,
    }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function fetchPendingApprovals(): Promise<PendingApproval[]> {
  const res = await fetch(`${API_BASE}/approvals/pending`);
  if (!res.ok) throw new Error('Failed to fetch pending approvals');
  return res.json();
}

export async function submitApprovalDecision(
  approvalId: number,
  decision: 'APPROVE' | 'REJECT',
  reviewer: string,
  comment?: string
) {
  const res = await fetch(`${API_BASE}/approvals/${approvalId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reviewer, comment }),
  });
  if (!res.ok) throw new Error('Failed to submit approval decision');
  return res.json();
}

export async function fetchCrmRecords(): Promise<CrmRecords> {
  const res = await fetch(`${API_BASE}/crm/records`);
  if (!res.ok) throw new Error('Failed to fetch CRM records');
  return res.json();
}

export async function fetchLatencyMetrics(): Promise<LatencyMetrics> {
  const res = await fetch(`${API_BASE}/metrics/latency`);
  if (!res.ok) throw new Error('Failed to fetch latency metrics');
  return res.json();
}

export async function resetCrmData() {
  const res = await fetch(`${API_BASE}/crm/reset-seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset CRM data');
  return res.json();
}

