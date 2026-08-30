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
    <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-line bg-white lg:h-[calc(100vh-6rem)]">
      <div className="grid h-full lg:grid-cols-[320px,1fr]">
        {/* Conversation list */}
        <aside className={cx("flex flex-col border-r border-line", cid && "hidden lg:flex")}>
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-display font-800 text-lg text-ink">Messages</h2>
            <p className="text-xs text-ink-muted">Chat unlocks after a match is accepted.</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? <Loading /> : !convos || convos.length === 0 ? (
              <div className="p-6"><EmptyState icon={<MessageSquare size={20} />} title="No conversations yet" sub="Accept a match to start chatting." /></div>
            ) : convos.map((c) => {
              const o = other(c, user?.id);
              return (
                <button key={c.id} onClick={() => nav(`/app/messages/${c.id}`)}
                  className={cx("flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left hover:bg-canvas",
                    c.id === cid && "bg-teal-wash/50")}>
                  <Avatar name={o?.full_name} src={o?.photo_url} id={o?.id} size={44} verified={o?.verification.identity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display font-600 text-ink">{o?.full_name}</span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{relativeTime(c.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-ink-muted">{c.last_message || "Say hello 👋"}</span>
                      {c.unread > 0 && <span className="ml-auto grid h-5 min-w-[20px] shrink-0 place-items-center rounded-full bg-teal px-1 text-[11px] font-bold text-white">{c.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Thread */}
        <section className={cx("flex flex-col", !cid && "hidden lg:flex")}>
          {!cid || !activeConvo ? (
            <div className="grid flex-1 place-items-center text-center text-ink-muted">
              <div><MessageSquare size={30} className="mx-auto mb-2 text-ink/20" /><p className="text-sm">Select a conversation to start chatting.</p></div>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-line px-4 py-3">
                <button onClick={() => nav("/app/messages")} className="lg:hidden"><ArrowLeft size={18} className="text-ink-muted" /></button>
                {(() => { const o = other(activeConvo, user?.id); return (
                  <>
                    <Avatar name={o?.full_name} src={o?.photo_url} id={o?.id} size={38} verified={o?.verification.identity} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-700 text-ink">{o?.full_name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-verified"><ShieldCheck size={11} /> Verified traveller</div>
                    </div>
                    {activeConvo.trip_id && (
                      <button onClick={() => nav(`/app/trips/${activeConvo.trip_id}`)} className="chip-teal"><MapPin size={12} /> Trip</button>
                    )}
                    {partnerContact?.phone && (
                      <a href={`tel:${partnerContact.phone}`} className="chip-teal" aria-label={`Call ${partnerContact.full_name}`}>
                        <Phone size={12} /> Call
                      </a>
                    )}
                  </>
                ); })()}
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto bg-canvas/40 px-4 py-4">
                {(msgs || []).map((m: Message) => {
                  if (m.kind === "system" || m.kind === "status") {
                    return <div key={m.id} className="mx-auto w-fit rounded-full bg-ink/5 px-3 py-1 text-[11px] text-ink-muted">{m.text}</div>;
                  }
                  const mine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={cx("flex", mine ? "justify-end" : "justify-start")}>
                      <div className={cx("max-w-[76%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                        mine ? "rounded-br-md bg-teal text-white" : "rounded-bl-md bg-white text-ink border border-line")}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <div className={cx("mt-0.5 text-[10px]", mine ? "text-white/70" : "text-ink-muted")}>{time12(new Date(m.created_at).toTimeString().slice(0, 5))}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-line p-3">
                <div className="flex items-end gap-2">
                  <textarea value={text} onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1} placeholder="Write a message…"
                    className="input max-h-28 min-h-[44px] flex-1 resize-none py-3" />
                  <button onClick={send} disabled={sending || !text.trim()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal text-white disabled:opacity-40">
                    <Send size={18} />
                  </button>
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-ink-muted">Keep contact details private until you're confident. Never share OTPs or payment info.</p>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
