import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldAlert, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { ChatMessage, StepTrace } from '../types';
import { sendChatMessage } from '../api';

interface CustomerChatProps {
  onWorkflowExecuted: (steps: StepTrace[], rawResponse: any) => void;
  onRefreshApprovals: () => void;
}

const SAMPLE_PROMPTS = [
  { label: '📦 Track Order ORD-84920', text: 'Can you check the delivery tracking status for order ORD-84920?' },
  { label: '💸 Refund $149.99 (Triggers HITL)', text: 'I received defective headphones for order ORD-84920, please issue a refund of $149.99.' },
  { label: '🚫 Cancel ORD-55201', text: 'Please cancel my order ORD-55201 immediately.' },
  { label: '⭐ Check Membership Tier', text: 'What is my account membership tier and registered email?' }
];

export const CustomerChat: React.FC<CustomerChatProps> = ({ onWorkflowExecuted, onRefreshApprovals }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello Alex! I am **CustomerOps AI**, connected to Salesforce CRM. How can I assist you with your orders, accounts, or refunds today?",
      timestamp: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('alex.chen@enterprise.com');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const data = await sendChatMessage('session-active', text, customerEmail);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        confidence: data.confidence,
        requires_human_approval: data.requires_human_approval,
        approval_id: data.approval_id,
        executed_tools: data.executed_tools,
        latency_ms: data.latency_ms
      };

      setMessages((prev) => [...prev, assistantMsg]);
      onWorkflowExecuted(data.execution_steps || [], data);

      if (data.requires_human_approval) {
        onRefreshApprovals();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ An error occurred while communicating with the agent workflow.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm text-slate-100">Customer Support Portal</h2>
              <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Agentforce Live</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Authenticated: {customerEmail}</p>
          </div>
        </div>

        {/* Customer Select dropdown */}
        <select
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          aria-label="Active Customer"
          className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="alex.chen@enterprise.com">Alex Chen (Platinum)</option>
          <option value="sarah.j@acmecorp.io">Sarah Jenkins (Gold)</option>
          <option value="david.miller@gmail.com">David Miller (Standard)</option>
        </select>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-blue-400'
              }`}
            >
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>

            <div className={`max-w-[85%] space-y-1.5 ${m.role === 'user' ? 'items-end' : ''}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm'
                }`}
              >
                {m.content}
              </div>

              {/* Metadata Badges for Assistant Message */}
              {m.role === 'assistant' && (m.intent || m.latency_ms !== undefined) && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                  {m.intent && (
                    <span className="bg-slate-800/80 border border-slate-700 text-cyan-400 px-2 py-0.5 rounded-md">
                      Intent: {m.intent} ({( (m.confidence || 0.9) * 100).toFixed(0)}%)
                    </span>
                  )}
                  {m.latency_ms !== undefined && (
                    <span className="bg-slate-800/80 border border-slate-700 text-emerald-400 px-2 py-0.5 rounded-md flex items-center space-x-1">
                      <Clock size={10} />
                      <span>{m.latency_ms} ms</span>
                    </span>
                  )}
                  {m.requires_human_approval && (
                    <span className="bg-amber-950/70 border border-amber-600/50 text-amber-300 px-2 py-0.5 rounded-md flex items-center space-x-1 font-semibold">
                      <ShieldAlert size={11} className="text-amber-400" />
                      <span>HITL Gate Tripped (Ref #{m.approval_id})</span>
                    </span>
                  )}
                  {m.executed_tools && m.executed_tools.length > 0 && (
                    <span className="bg-purple-950/60 border border-purple-800/40 text-purple-300 px-2 py-0.5 rounded-md">
                      Tools: {m.executed_tools.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 text-xs">
              <Bot size={14} />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-400">
              <Sparkles size={14} className="text-blue-400 animate-spin" />
              <span>Agentforce executing LangGraph workflow...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Examples:</span>
        {SAMPLE_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p.text)}
            className="text-[11px] whitespace-nowrap bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-full transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your customer request (e.g., track order, request refund, cancel)..."
            className="flex-1 bg-slate-800/80 border border-slate-700/80 text-sm text-slate-100 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg flex items-center space-x-1.5 text-sm font-medium transition-all shadow-md shadow-blue-600/20"
          >
            <span>Send</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

