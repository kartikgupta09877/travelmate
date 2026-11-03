import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, MessageSquare, ShieldCheck, MapPin, Phone } from "lucide-react";
import type { Conversation, Message } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Loading, EmptyState, cx } from "@/components/ui";
import { relativeTime, time12 } from "@/lib/format";

function other(c: Conversation, meId?: string) {
  return c.participants.find((p) => p.id !== meId) || c.participants[0];
}

export default function Messages() {
  const { cid } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const endRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: convos, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: api.chat.conversations });
  const { data: msgs } = useQuery({
    queryKey: ["messages", cid], queryFn: () => api.chat.messages(cid!),
    enabled: !!cid, refetchInterval: 6000,
  });
  const { data: partnerContact } = useQuery({
    queryKey: ["conversation-contact", cid], queryFn: () => api.chat.contact(cid!),
    enabled: !!cid,
  });

  const activeConvo = useMemo(() => convos?.find((c) => c.id === cid), [convos, cid]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const t = text.trim();
    if (!t || !cid) return;
    setSending(true); setText("");
    try {
      await api.chat.send(cid, t);
      qc.invalidateQueries({ queryKey: ["messages", cid] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch { setText(t); }
    finally { setSending(false); }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-card lg:h-[calc(100vh-6.5rem)] animate-fade">
      <div className="grid h-full lg:grid-cols-12">
        {/* Conversation list */}
        <aside className={cx("flex flex-col border-r border-slate-200/80 lg:col-span-4 xl:col-span-3", cid && "hidden lg:flex")}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-800 text-xl text-ocean-900">Messages</h2>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">In-app chat unlocks after match acceptance.</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? <Loading /> : !convos || convos.length === 0 ? (
              <div className="p-6"><EmptyState icon={<MessageSquare size={22} />} title="No conversations yet" sub="Accept a partner match to start chatting." /></div>
            ) : convos.map((c) => {
              const o = other(c, user?.id);
              const isSelected = c.id === cid;
              return (
                <button key={c.id} onClick={() => nav(`/app/messages/${c.id}`)}
                  className={cx("flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-all cursor-pointer",
                    isSelected ? "bg-teal-wash/60 border-l-4 border-teal-dark" : "hover:bg-slate-50")}>
                  <Avatar name={o?.full_name} src={o?.photo_url} id={o?.id} size={46} verified={o?.verification.identity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display font-700 text-ocean-900 text-sm">{o?.full_name}</span>
                      <span className="shrink-0 text-[10px] font-bold text-slate-500">{relativeTime(c.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="truncate text-xs font-medium text-slate-600">{c.last_message || "Say hello 👋"}</span>
                      {c.unread > 0 && <span className="ml-auto grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-teal px-1.5 text-[10px] font-extrabold text-white shadow-xs">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat Thread */}
        <section className={cx("flex flex-col lg:col-span-8 xl:col-span-9", !cid && "hidden lg:flex")}>
          {!cid || !activeConvo ? (
            <div className="grid flex-1 place-items-center text-center text-slate-500 p-8">
              <div>
                <MessageSquare size={36} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-semibold text-ocean-900">Select a conversation to start chatting</p>
                <p className="text-xs text-slate-600 font-medium mt-1">Coordinate meeting checkpoints and trip details with your partner.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3.5 border-b border-slate-200/80 px-6 py-4 bg-slate-50/50">
                <button onClick={() => nav("/app/messages")} className="lg:hidden text-slate-500 hover:text-ocean-900"><ArrowLeft size={20} /></button>
                {(() => { const o = other(activeConvo, user?.id); return (
                  <>
                    <Avatar name={o?.full_name} src={o?.photo_url} id={o?.id} size={42} verified={o?.verification.identity} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-800 text-ocean-900 text-base">{o?.full_name}</div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><ShieldCheck size={13} /> Verified traveller</div>
                    </div>
                    {activeConvo.trip_id && (
                      <button onClick={() => nav(`/app/trips/${activeConvo.trip_id}`)} className="chip-teal cursor-pointer hover:bg-teal-wash">
                        <MapPin size={13} /> Trip Details
                      </button>
                    )}
                    {partnerContact?.phone && (
                      <a href={`tel:${partnerContact.phone}`} className="chip-teal cursor-pointer hover:bg-teal-wash" aria-label={`Call ${partnerContact.full_name}`}>
                        <Phone size={13} /> Call
                      </a>
                    )}
                  </>
                ); })()}
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/40 p-6">
                {(msgs || []).map((m: Message) => {
                  if (m.kind === "system" || m.kind === "status") {
                    return <div key={m.id} className="mx-auto w-fit rounded-full bg-slate-200 px-4 py-1 text-[11px] font-bold text-slate-700">{m.text}</div>;
                  }
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cx("max-w-[76%] rounded-3xl px-4 py-3 text-sm shadow-xs leading-relaxed",
                        mine ? "rounded-br-xs bg-gradient-to-r from-teal-dark to-teal text-white" : "rounded-bl-xs bg-white text-ocean-900 border border-slate-200/80")}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <div className={cx("mt-1 text-[10px] font-semibold text-right", mine ? "text-white/80" : "text-slate-500")}>
                          {time12(new Date(m.created_at).toTimeString().slice(0, 5))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-slate-200/80 p-4 bg-white">
                <div className="flex items-end gap-3">
                  <textarea value={text} onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1} placeholder="Type a message…"
                    className="input max-h-28 min-h-[46px] flex-1 resize-none py-3 text-sm" />
                  <button onClick={send} disabled={sending || !text.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-teal-dark to-teal text-white disabled:opacity-40 hover:shadow-glow transition-all cursor-pointer">
                    <Send size={18} />
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">Keep personal details private until comfortable. Never share OTP passcodes or financial details.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
