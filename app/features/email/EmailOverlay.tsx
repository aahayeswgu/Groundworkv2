"use client";

import { useState, useEffect, useCallback } from "react";
import Script from "next/script";
import {
  getGmailToken, setGmailToken, getProfile, listMessages,
  getMessage, getMessageHeaders, modifyMessage, trashMessage,
  sendMessage, getLabelUnreadCount,
  type GmailMessage,
} from "./gmail-api";

const GMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID ?? "";
const GMAIL_SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send";

type Folder = "INBOX" | "SENT" | "DRAFT" | "STARRED" | "SPAM" | "TRASH";
const FOLDERS: { id: Folder; label: string }[] = [
  { id: "INBOX", label: "Inbox" },
  { id: "SENT", label: "Sent" },
  { id: "DRAFT", label: "Drafts" },
  { id: "STARRED", label: "Starred" },
  { id: "SPAM", label: "Spam" },
  { id: "TRASH", label: "Trash" },
];

type MessagePreview = Omit<GmailMessage, "body" | "attachments">;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extractName(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  if (match) return match[1].trim();
  return from.split("@")[0];
}

function avatarColor(name: string): string {
  const colors = ["#C4692A", "#2563EB", "#059669", "#7C3AED", "#DC2626", "#D97706", "#0891B2", "#DB2777"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function hasGoogleIdentityLoaded(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((window as any).google?.accounts?.oauth2);
}

function htmlToPlainText(html: string): string {
  if (!html) return "";

  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n");

  if (typeof window === "undefined") {
    return withLineBreaks
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const doc = new DOMParser().parseFromString(withLineBreaks, "text/html");
  return (doc.body.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainTextToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "<p></p>";
  return escapeHtml(trimmed).replace(/\n/g, "<br>");
}

function EmailAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

interface EmailOverlayProps {
  onClose: () => void;
}

export default function EmailOverlay({ onClose }: EmailOverlayProps) {
  const [connected, setConnected] = useState(!!getGmailToken());
  const [gsiLoaded, setGsiLoaded] = useState(hasGoogleIdentityLoaded());
  const [account, setAccount] = useState("");
  const [folder, setFolder] = useState<Folder>("INBOX");
  const [messages, setMessages] = useState<MessagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState<GmailMessage | null>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  // Compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const fetchMessages = useCallback(async (folderId: Folder, query = "", pageToken?: string) => {
    setLoading(true);
    try {
      const res = await listMessages([folderId], query, pageToken);
      const previews = await Promise.all(
        res.messages.slice(0, 25).map((m) => getMessageHeaders(m.id)),
      );
      if (pageToken) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return [...prev, ...previews.filter((m) => !existingIds.has(m.id))];
        });
      } else {
        setMessages(previews);
      }
      setNextPageToken(res.nextPageToken);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  }, []);

  // On connect, fetch profile + inbox
  useEffect(() => {
    if (!connected) return;
    getProfile().then((p) => setAccount(p.emailAddress)).catch(() => { setConnected(false); setGmailToken(null); });
    queueMicrotask(() => {
      void fetchMessages("INBOX");
      getLabelUnreadCount("INBOX").then(setInboxUnread).catch(() => {});
    });
  }, [connected, fetchMessages]);

  function handleConnect() {
    if (!GMAIL_CLIENT_ID || !gsiLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GMAIL_CLIENT_ID,
      scope: GMAIL_SCOPES,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (response: any) => {
        if (response.access_token) {
          setGmailToken(response.access_token);
          setConnected(true);
        }
      },
    });
    client.requestAccessToken();
  }

  function handleDisconnect() {
    setGmailToken(null);
    setConnected(false);
    setAccount("");
    setMessages([]);
    setSelectedMsg(null);
  }

  async function openMessage(id: string) {
    setReadingLoading(true);
    try {
      const msg = await getMessage(id);
      setSelectedMsg(msg);
      // Mark as read
      if (msg.labelIds.includes("UNREAD")) {
        await modifyMessage(id, [], ["UNREAD"]);
        setMessages((prev) => prev.map((m) => m.id === id ? { ...m, labelIds: m.labelIds.filter((l) => l !== "UNREAD") } : m));
        setInboxUnread((c) => Math.max(0, c - 1));
      }
    } catch { /* ignore */ }
    setReadingLoading(false);
  }

  async function handleArchive(id: string) {
    await modifyMessage(id, [], ["INBOX"]);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  }

  async function handleDelete(id: string) {
    await trashMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMsg?.id === id) setSelectedMsg(null);
  }

  async function handleStar(id: string) {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    const starred = msg.labelIds.includes("STARRED");
    await modifyMessage(id, starred ? [] : ["STARRED"], starred ? ["STARRED"] : []);
    setMessages((prev) => prev.map((m) => m.id === id ? {
      ...m,
      labelIds: starred ? m.labelIds.filter((l) => l !== "STARRED") : [...m.labelIds, "STARRED"],
    } : m));
  }

  async function handleSend() {
    if (!composeTo || !composeSubject) { setSendError("Fill in To and Subject."); return; }
    setSending(true);
    setSendError("");
    try {
      await sendMessage(composeTo, composeSubject, plainTextToHtml(composeBody));
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Failed to send.");
    }
    setSending(false);
  }

  function handleReply() {
    if (!selectedMsg) return;
    const quotedBody = htmlToPlainText(selectedMsg.body)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");

    setComposeTo(selectedMsg.from);
    setComposeSubject(selectedMsg.subject.startsWith("Re:") ? selectedMsg.subject : `Re: ${selectedMsg.subject}`);
    setComposeBody(`\n\nOn ${selectedMsg.date}, ${extractName(selectedMsg.from)} wrote:\n${quotedBody}`);
    setComposeOpen(true);
  }

  function switchFolder(f: Folder) {
    setFolder(f);
    setSelectedMsg(null);
    setSearchQuery("");
    fetchMessages(f);
  }

  function handleSearch() {
    setSelectedMsg(null);
    fetchMessages(folder, searchQuery);
  }

  const googleIdentityScript = GMAIL_CLIENT_ID ? (
    <Script
      id="google-gsi-client"
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setGsiLoaded(true)}
      onReady={() => setGsiLoaded(true)}
    />
  ) : null;

  // Not connected — show connect screen
  if (!connected) {
    return (
      <div className="fixed inset-0 z-40 bg-bg-primary flex flex-col">
        {googleIdentityScript}
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-card">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-text-secondary hover:text-orange transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <span className="text-lg font-bold text-text-primary">Email</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange/10 rounded-2xl flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C4692A" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,7 12,13 2,7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Connect Gmail</h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">Sign in with Google to read, send, and manage your emails right from Groundwork.</p>
            {GMAIL_CLIENT_ID ? (
              <button
                onClick={handleConnect}
                disabled={!gsiLoaded}
                className="px-6 py-2.5 bg-orange text-white font-bold text-sm rounded-lg hover:bg-orange-hover transition-colors disabled:cursor-default disabled:opacity-60"
              >
                Connect with Google
              </button>
            ) : (
              <p className="text-xs text-text-muted">Gmail Client ID not configured.<br />Set NEXT_PUBLIC_GMAIL_CLIENT_ID in .env.local</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected — full email client
  return (
    <div className="fixed inset-0 z-40 bg-bg-primary flex flex-col">
      {googleIdentityScript}
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-text-secondary hover:text-orange transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <span className="text-base font-bold text-text-primary">Email</span>
          <span className="text-xs text-text-muted">{account}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchMessages(folder, searchQuery)} className="text-text-secondary hover:text-orange transition-colors" title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          <button onClick={() => { setComposeOpen(true); setComposeTo(""); setComposeSubject(""); setComposeBody(""); }} className="px-3 py-1.5 bg-orange text-white text-xs font-bold rounded-lg hover:bg-orange-hover transition-colors">
            Compose
          </button>
          <button onClick={handleDisconnect} className="text-text-muted hover:text-gw-red text-xs transition-colors" title="Disconnect">
            Disconnect
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Folder sidebar */}
        <div className="w-48 shrink-0 border-r border-border bg-bg-secondary overflow-y-auto max-md:hidden">
          <div className="py-2">
            {FOLDERS.map((f) => (
              <button
                key={f.id}
                onClick={() => switchFolder(f.id)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${folder === f.id ? "bg-orange-dim text-orange font-semibold" : "text-text-secondary hover:bg-bg-card hover:text-text-primary"}`}
              >
                <span>{f.label}</span>
                {f.id === "INBOX" && inboxUnread > 0 && (
                  <span className="text-[10px] font-bold bg-orange text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{inboxUnread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Message list + reader */}
        <div className="flex-1 flex min-w-0">
          {/* Message list */}
          <div className={`${selectedMsg ? "w-[40%] max-md:hidden" : "flex-1"} border-r border-border flex flex-col min-w-0`}>
            {/* Search */}
            <div className="px-3 py-2 border-b border-border bg-bg-card shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-border bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange"
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(""); fetchMessages(folder); }} className="text-text-muted hover:text-text-primary text-xs">Clear</button>
                )}
              </div>
              {/* Mobile folder selector */}
              <div className="flex gap-1 mt-2 md:hidden overflow-x-auto">
                {FOLDERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => switchFolder(f.id)}
                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded whitespace-nowrap ${folder === f.id ? "bg-orange text-white" : "text-text-muted"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message rows */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {loading && messages.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-sm">No messages</div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const unread = msg.labelIds.includes("UNREAD");
                    const starred = msg.labelIds.includes("STARRED");
                    const name = extractName(msg.from);
                    return (
                      <div
                        key={`${msg.id}-${idx}`}
                        onClick={() => openMessage(msg.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 border-b border-border cursor-pointer transition-colors group ${
                          selectedMsg?.id === msg.id ? "bg-orange-dim" : unread ? "bg-bg-card hover:bg-orange-dim" : "hover:bg-bg-card"
                        }`}
                      >
                        {/* Avatar */}
                        <EmailAvatar name={name} />
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm truncate ${unread ? "font-bold text-text-primary" : "text-text-secondary"}`}>{name}</span>
                            <span className="text-[10px] text-text-muted shrink-0">{formatDate(msg.date)}</span>
                          </div>
                          <div className={`text-xs truncate ${unread ? "font-semibold text-text-primary" : "text-text-secondary"}`}>{msg.subject || "(no subject)"}</div>
                          <div className="text-[11px] text-text-muted truncate">{msg.snippet}</div>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleStar(msg.id); }} className={`p-1 transition-colors ${starred ? "text-orange" : "text-text-muted hover:text-orange"}`} title="Star">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleArchive(msg.id); }} className="p-1 text-text-muted hover:text-orange transition-colors" title="Archive">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }} className="p-1 text-text-muted hover:text-gw-red transition-colors" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {nextPageToken && (
                    <button
                      onClick={() => fetchMessages(folder, searchQuery, nextPageToken)}
                      className="w-full py-3 text-sm text-orange font-semibold hover:bg-orange-dim transition-colors"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Reader pane */}
          {selectedMsg && (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Reader header */}
              <div className="px-4 py-3 border-b border-border bg-bg-card shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setSelectedMsg(null)} className="text-text-secondary hover:text-orange transition-colors md:hidden">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={handleReply} className="px-3 py-1 text-xs font-semibold text-orange border border-orange rounded-lg hover:bg-orange-dim transition-colors">Reply</button>
                    <button onClick={() => handleArchive(selectedMsg.id)} className="px-3 py-1 text-xs font-semibold text-text-secondary border border-border rounded-lg hover:border-orange hover:text-orange transition-colors">Archive</button>
                    <button onClick={() => handleDelete(selectedMsg.id)} className="px-3 py-1 text-xs font-semibold text-text-secondary border border-border rounded-lg hover:border-gw-red hover:text-gw-red transition-colors">Delete</button>
                  </div>
                </div>
                <h2 className="text-base font-bold text-text-primary">{selectedMsg.subject || "(no subject)"}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <EmailAvatar name={extractName(selectedMsg.from)} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">{extractName(selectedMsg.from)}</div>
                    <div className="text-[11px] text-text-muted truncate">to {selectedMsg.to}</div>
                  </div>
                  <div className="ml-auto text-[11px] text-text-muted shrink-0">{formatDate(selectedMsg.date)}</div>
                </div>
              </div>
              {/* Reader body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
                {readingLoading ? (
                  <div className="text-center text-text-muted py-8">Loading...</div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm text-text-primary">
                    {htmlToPlainText(selectedMsg.body)}
                  </pre>
                )}
                {/* Attachments */}
                {selectedMsg.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-[11px] font-bold uppercase text-text-muted mb-2">Attachments ({selectedMsg.attachments.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMsg.attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-bg-input rounded-lg border border-border text-xs text-text-secondary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                          </svg>
                          <span className="truncate max-w-[150px]">{att.filename}</span>
                          <span className="text-text-muted">({Math.round(att.size / 1024)}KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state when no message selected on desktop */}
          {!selectedMsg && messages.length > 0 && (
            <div className="flex-1 flex items-center justify-center max-md:hidden">
              <div className="text-center text-text-muted">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-30">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,7 12,13 2,7" />
                </svg>
                <p className="text-sm">Select an email to read</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed bottom-4 right-4 w-full max-w-lg bg-bg-card border border-border rounded-xl shadow-gw-lg z-50 flex flex-col max-h-[70vh] max-md:inset-0 max-md:max-w-none max-md:rounded-none max-md:max-h-full max-md:bottom-0 max-md:right-0">
          {/* Compose header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-charcoal rounded-t-xl max-md:rounded-t-none">
            <span className="text-sm font-bold text-white">New Message</span>
            <button onClick={() => setComposeOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {/* Fields */}
          <div className="border-b border-border">
            <input
              type="email"
              placeholder="To"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none border-b border-border"
            />
            <input
              type="text"
              placeholder="Subject"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          {/* Body */}
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            className="min-h-[150px] flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-sm text-text-primary focus:outline-none"
            placeholder="Write your message..."
          />
          {/* Send bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
            {sendError && <span className="text-xs text-gw-red">{sendError}</span>}
            <div className="ml-auto">
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-5 py-1.5 bg-orange text-white font-bold text-sm rounded-lg hover:bg-orange-hover transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
