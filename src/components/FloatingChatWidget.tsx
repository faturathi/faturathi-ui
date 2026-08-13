import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, ChevronDown, Send, Sparkles } from 'lucide-react';

type ChatMessage = { from: 'user' | 'bot'; text: string };

const GREETING: ChatMessage = {
  from: 'bot',
  text: "Hi, I'm the Faturathi Assistant. I can help with invoice validation, uploads, Peppol status, login, and archive requests.",
};

const QUICK_REPLIES = [
  'How do I fix a rejected invoice?',
  'How do I upload files?',
  'How do I request a 10-year archive?',
  'I have a different question',
];

function botReply(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('reject')) {
    return 'Open the rejected document, correct every highlighted field, then use the green Re-submit button.';
  }
  if (lower.includes('upload')) {
    return 'Use Data Source → Upload Individual/Batch. CSV/XLSX rows pass through the same validation pipeline as API and manual documents.';
  }
  if (lower.includes('archive') || lower.includes('backup')) {
    return 'Use Status & Reports → Reports & Archive → Export / Backup Archived Data. Pick a date range and format (CSV/JSON/SQL), or leave both dates blank for the full 10-year history.';
  }
  if (lower.includes('otp') || lower.includes('login')) {
    return 'Request the six-digit OTP using your registered corporate email on the login screen.';
  }
  if (lower.includes('different question') || lower.includes('ticket')) {
    return "For account-specific investigation, raise a support ticket from the About / Contact page — I'll route it to a human.";
  }
  return 'I can provide general guidance here. For account-specific investigation, raise a support ticket from the About / Contact page.';
}

/**
 * Global, tawk.to-style floating chat bubble — mounted once at the app root (see App.tsx) so it
 * persists across tab navigation instead of living inside one page. Purely a client-side FAQ
 * bot; anything needing a real person routes to the support ticket form on the About page.
 */
export const FloatingChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [text, setText] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = (raw?: string) => {
    const value = (raw ?? text).trim();
    if (!value) return;
    setShowQuickReplies(false);
    setMessages((prev) => [...prev, { from: 'user', text: value }]);
    setText('');
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: botReply(value) }]);
      if (!open) setHasUnread(true);
    }, 450);
  };

  const toggle = () => {
    setOpen((v) => !v);
    setHasUnread(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9998] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#082f54] via-[#0d4f8b] to-[#0b7a63] text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-emerald-200" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-tight">Faturathi Assistant</div>
              <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                Typically replies instantly
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/15 transition-colors" title="Minimize" aria-label="Minimize chat">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/15 transition-colors" title="Close" aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                  item.from === 'user'
                    ? 'ml-auto bg-[#0d4f8b] text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                }`}
              >
                {item.text}
              </div>
            ))}
            {showQuickReplies && (
              <div className="flex flex-col items-start gap-1.5 pt-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => send(reply)}
                    className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-full px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-[#0d4f8b]"
            />
            <button
              onClick={() => send()}
              className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition-colors"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-center text-[9px] text-slate-400 pb-1.5">Powered by Faturathi · by Netbue</div>
        </div>
      )}

      {/* Bubble toggle */}
      <button
        onClick={toggle}
        className="relative h-14 w-14 rounded-full bg-gradient-to-br from-[#0d4f8b] to-[#0b7a63] text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <ChevronDown className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>
    </div>
  );
};
