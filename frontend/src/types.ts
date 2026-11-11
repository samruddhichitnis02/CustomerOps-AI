export interface StepTrace {
  step_name: string;
  status: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
  requires_human_approval?: boolean;
  approval_id?: number;
  executed_tools?: string[];
  latency_ms?: number;
}

export interface PendingApproval {
  approval_id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  reason: string;
  created_at: string;
  status: string;
}

export interface CrmRecords {
  customers: Array<{
    id: number;
    salesforce_id: string;
    name: string;
    email: string;
    phone: string;
    tier: string;
  }>;
  orders: Array<{
    id: number;
    order_number: string;
    customer_id: number;
    status: string;
    total_amount: number;
    tracking_number: string;
    shipping_address: string;
    created_at: string;
  }>;
  cases: Array<{
    id: number;
    case_number: string;
    customer_id: number;
    subject: string;
    priority: string;
    status: string;
    created_at: string;
  }>;
  refunds: Array<{
    id: number;
    order_id: number;
    amount: number;
    reason: string;
    status: string;
    requires_human_approval: boolean;
    approved_by?: string;
    created_at: string;
  }>;
}

export interface LatencyMetrics {
  total_requests: number;
  p50_latency_ms: number;
  p90_latency_ms: number;
  p95_latency_ms: number;
  avg_latency_ms: number;
  target_met_p95_under_500ms: boolean;
}

