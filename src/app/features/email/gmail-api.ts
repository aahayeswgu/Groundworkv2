// Gmail API helper — all calls go through the user's OAuth access token

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  labelIds: string[];
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  attachments: { id: string; filename: string; mimeType: string; size: number }[];
}

export interface GmailListResponse {
  messages: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

let accessToken: string | null = null;

export function setGmailToken(token: string | null) {
  accessToken = token;
  if (token) sessionStorage.setItem("gw_gmail_token", token);
  else sessionStorage.removeItem("gw_gmail_token");
}

export function getGmailToken(): string | null {
  if (accessToken) return accessToken;
  accessToken = sessionStorage.getItem("gw_gmail_token");
  return accessToken;
}

async function gmailFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = getGmailToken();
  if (!token) throw new Error("Not authenticated with Gmail");
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  });
  if (res.status === 401) {
    setGmailToken(null);
    throw new Error("Gmail session expired. Please reconnect.");
  }
  return res;
}

export async function getProfile(): Promise<{ emailAddress: string }> {
  const res = await gmailFetch("/profile");
  return res.json();
}

export async function listMessages(
  labelIds: string[] = ["INBOX"],
  query = "",
  pageToken?: string,
  maxResults = 25,
): Promise<GmailListResponse> {
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  labelIds.forEach((l) => params.append("labelIds", l));
  if (query) params.set("q", query);
  if (pageToken) params.set("pageToken", pageToken);
  const res = await gmailFetch(`/messages?${params}`);
  const data = await res.json();
  return { messages: data.messages ?? [], nextPageToken: data.nextPageToken, resultSizeEstimate: data.resultSizeEstimate ?? 0 };
}

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join(""),
  );
}

function findPartBody(payload: Record<string, unknown>): string {
  // Try to find HTML body first, then plain text
  const parts = (payload.parts as Record<string, unknown>[]) ?? [];
  if (parts.length === 0) {
    const body = payload.body as { data?: string };
    return body?.data ? decodeBase64Url(body.data) : "";
  }
  // Recurse into multipart
  for (const part of parts) {
    if (part.mimeType === "text/html") {
      const body = part.body as { data?: string };
      if (body?.data) return decodeBase64Url(body.data);
    }
  }
  for (const part of parts) {
    if (part.mimeType === "text/plain") {
      const body = part.body as { data?: string };
      if (body?.data) return `<pre style="white-space:pre-wrap;word-break:break-word">${decodeBase64Url(body.data)}</pre>`;
    }
  }
  // Recurse into nested multipart
  for (const part of parts) {
    if ((part.mimeType as string)?.startsWith("multipart/")) {
      const result = findPartBody(part);
      if (result) return result;
    }
  }
  return "";
}

function extractAttachments(payload: Record<string, unknown>): GmailMessage["attachments"] {
  const attachments: GmailMessage["attachments"] = [];
  const parts = (payload.parts as Record<string, unknown>[]) ?? [];
  for (const part of parts) {
    const body = part.body as { attachmentId?: string; size?: number };
    if (body?.attachmentId && part.filename) {
      attachments.push({
        id: body.attachmentId,
        filename: part.filename as string,
        mimeType: part.mimeType as string,
        size: body.size ?? 0,
      });
    }
    if ((part.mimeType as string)?.startsWith("multipart/")) {
      attachments.push(...extractAttachments(part));
    }
  }
  return attachments;
}

export async function getMessage(id: string): Promise<GmailMessage> {
  const res = await gmailFetch(`/messages/${id}?format=full`);
  const data = await res.json();
  const headers = (data.payload?.headers ?? []) as { name: string; value: string }[];
  const hdr = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet ?? "",
    labelIds: data.labelIds ?? [],
    from: hdr("From"),
    to: hdr("To"),
    subject: hdr("Subject"),
    date: hdr("Date"),
    body: findPartBody(data.payload ?? {}),
    attachments: extractAttachments(data.payload ?? {}),
  };
}

export async function getMessageHeaders(id: string): Promise<Omit<GmailMessage, "body" | "attachments">> {
  const res = await gmailFetch(`/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
  const data = await res.json();
  const headers = (data.payload?.headers ?? []) as { name: string; value: string }[];
  const hdr = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet ?? "",
    labelIds: data.labelIds ?? [],
    from: hdr("From"),
    to: hdr("To"),
    subject: hdr("Subject"),
    date: hdr("Date"),
  };
}

export async function modifyMessage(id: string, addLabels: string[] = [], removeLabels: string[] = []): Promise<void> {
  await gmailFetch(`/messages/${id}/modify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addLabelIds: addLabels, removeLabelIds: removeLabels }),
  });
}

export async function trashMessage(id: string): Promise<void> {
  await gmailFetch(`/messages/${id}/trash`, { method: "POST" });
}

export async function sendMessage(to: string, subject: string, htmlBody: string): Promise<void> {
  const boundary = "gw_boundary_" + Date.now();
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    htmlBody.replace(/<[^>]+>/g, ""),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlBody,
    `--${boundary}--`,
  ].join("\r\n");

  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmailFetch("/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw: encoded }),
  });
}

export async function getLabelUnreadCount(labelId: string): Promise<number> {
  const res = await gmailFetch(`/labels/${labelId}`);
  const data = await res.json();
  return data.messagesUnread ?? 0;
}

export async function downloadAttachment(messageId: string, attachmentId: string): Promise<string> {
  const res = await gmailFetch(`/messages/${messageId}/attachments/${attachmentId}`);
  const data = await res.json();
  return data.data ?? "";
}
