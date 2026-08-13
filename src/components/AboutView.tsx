import React, { useEffect, useState } from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Landmark, LifeBuoy, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { apiFetch, unwrapList } from '../lib/api';

/**
 * Faturathi is the product; Netbue is the trade name under which it is marketed and supported;
 * International Intelligence Solutions LLC is the legal entity registered in the Sultanate of
 * Oman that operates the platform (same pattern as other Netbue-branded regional entities, e.g.
 * "Netbue India" trades as Netbue Technologies Pvt. Ltd.). Both are shown here rather than
 * merged, since they answer different questions ("who do I call for support" vs "who is the
 * registered company on my contract").
 *
 * The live chat widget is NOT embedded here — it's a global floating bubble mounted once at the
 * app root (see FloatingChatWidget.tsx / App.tsx) so it persists across tab navigation instead
 * of only existing on this one page.
 */
interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  contact_email: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  created_at: string;
}

const STATUS_META: Record<SupportTicket['status'], { label: string; color: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <Clock className="h-3 w-3" /> },
  IN_PROGRESS: { label: 'In progress', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <Loader2 className="h-3 w-3" /> },
  RESOLVED: { label: 'Resolved / Closed', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle2 className="h-3 w-3" /> },
};

export const AboutView: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketFilter, setTicketFilter] = useState<'ALL' | SupportTicket['status']>('ALL');

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const payload = await apiFetch<SupportTicket[] | { results?: SupportTicket[] }>('/api/support/tickets?page_size=100');
      setTickets(unwrapList(payload));
    } catch {
      // Surfaced globally via the api error toast; leave the list empty rather than blocking the page.
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => { void loadTickets(); }, []);

  const raiseTicket = async (event: React.FormEvent) => {
    event.preventDefault(); setTicketStatus('Submitting...');
    try {
      const ticket = await apiFetch<{ id: string }>('/api/support/tickets', { method: 'POST', body: JSON.stringify({ subject, contact_email: contactEmail, message, category: 'TECHNICAL' }) });
      setTicketStatus(`Ticket ${ticket.id.slice(0, 8)} created successfully.`); setSubject(''); setMessage('');
      await loadTickets();
    } catch (error) { setTicketStatus(error instanceof Error ? error.message : 'Ticket could not be created.'); }
  };

  const filteredTickets = ticketFilter === 'ALL' ? tickets : tickets.filter((t) => t.status === ticketFilter);
  const countByStatus = (status: SupportTicket['status']) => tickets.filter((t) => t.status === status).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-[#0d4f8b] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="bg-[#0d4f8b] text-white text-xs px-2 py-0.5 rounded-md font-mono">I</span>
            <span>About Us / Contact Us</span>
            <span className="text-sm font-normal text-slate-500 font-arabic">من نحن / اتصل بنا</span>
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Product support, sales, and API key requests — plus the registered legal entity behind Faturathi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product support (Netbue trade name) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0d4f8b]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Faturathi Support (by Netbue)</h3>
              <p className="text-[11px] text-slate-500">Product support, onboarding, and API key / access token requests.</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            <a href="tel:+96895219001" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Phone / WhatsApp</span>
                <span className="font-semibold text-slate-800">+968 9521 9001</span>
              </div>
            </a>
            <a href="mailto:faturathi@netbue.com" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Mail className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Email</span>
                <span className="font-semibold text-slate-800">faturathi@netbue.com</span>
              </div>
            </a>
            <a href="https://www.faturathi.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Globe className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Website</span>
                <span className="font-semibold text-slate-800">www.faturathi.com</span>
              </div>
            </a>
          </div>
        </div>

        {/* Registered legal entity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Entity</h3>
              <p className="text-[11px] text-slate-500">The legal company operating Faturathi, registered in the Sultanate of Oman.</p>
            </div>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="block text-slate-400 text-[10px] font-bold uppercase">Company</span>
              <span className="font-bold text-slate-900">International Intelligence Solutions LLC</span>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <MapPin className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Address</span>
                <span className="font-semibold text-slate-800 block">Al Aman Building, CBD Ruwi, Muscat, Sultanate of Oman</span>
                <span className="text-slate-600 block">PB No: 2038, PC: 112</span>
              </div>
            </div>
            <a href="tel:+96824799200" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Landline</span>
                <span className="font-semibold text-slate-800">+968 2479 9200</span>
              </div>
            </a>
            <a href="tel:+96895219001" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Phone className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">GSM</span>
                <span className="font-semibold text-slate-800">+968 9521 9001</span>
              </div>
            </a>
            <a href="mailto:faturathi@netbue.com" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Mail className="h-4 w-4 text-[#0d4f8b] shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Email</span>
                <span className="font-semibold text-slate-800">faturathi@netbue.com</span>
              </div>
            </a>
            <a href="https://www.faturathi.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <Globe className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] font-bold uppercase">Website</span>
                <span className="font-semibold text-slate-800">https://www.faturathi.com</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-[11px] text-slate-600">
        <b className="text-slate-800">Faturathi</b> is the product; <b className="text-slate-800">Netbue</b> is the
        trade name it is marketed and supported under; <b className="text-slate-800">International Intelligence
        Solutions LLC</b> is the registered legal entity operating the platform in Oman. Regional Netbue entities
        follow the same pattern (e.g. Netbue India trades as Netbue Technologies Pvt. Ltd.).
      </div>

      <form onSubmit={raiseTicket} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="flex items-center gap-2 font-bold text-slate-900"><LifeBuoy className="h-5 w-5 text-[#0d4f8b]" /> Raise a Support Ticket</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="rounded-xl border border-slate-300 p-2.5 text-xs" />
          <input required type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Registered email" className="rounded-xl border border-slate-300 p-2.5 text-xs" />
        </div>
        <textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe the issue, invoice number, and error message" className="w-full rounded-xl border border-slate-300 p-2.5 text-xs" />
        <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-emerald-700">{ticketStatus}</span><button className="rounded-xl bg-[#0d4f8b] px-4 py-2.5 text-xs font-bold text-white">Submit Ticket</button></div>
      </form>

      {/* My Support Tickets — open, in-progress, and resolved/closed, filterable */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-bold text-slate-900"><LifeBuoy className="h-5 w-5 text-emerald-600" /> My Support Tickets</h3>
          <div className="flex items-center gap-1.5 text-[11px] font-bold flex-wrap">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTicketFilter(key)}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  ticketFilter === key ? 'bg-[#0d4f8b] text-white border-[#0d4f8b]' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {key === 'ALL' ? `All (${tickets.length})` : `${STATUS_META[key].label} (${countByStatus(key)})`}
              </button>
            ))}
          </div>
        </div>

        {ticketsLoading ? (
          <p className="text-xs text-slate-400">Loading your tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <p className="text-xs text-slate-400">
            {tickets.length === 0 ? 'No support tickets raised yet.' : 'No tickets match this filter.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{ticket.subject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      #{ticket.id.slice(0, 8)} · {ticket.category} · {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_META[ticket.status].color}`}>
                    {STATUS_META[ticket.status].icon}
                    {STATUS_META[ticket.status].label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{ticket.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
