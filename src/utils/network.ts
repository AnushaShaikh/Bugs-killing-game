import { OpenRoomSummary } from "../types";

/**
 * Safely copy text to clipboard with fallback for strict iframes
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // If permission denied in iframe, use textarea fallback below
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (e) {
    console.error("Clipboard copy failed:", e);
    return false;
  }
}

/**
 * Resolves the invite URL for multiplayer matches on the current server instance.
 * Using window.location.origin ensures both players connect to the exact same host/server.
 */
export function getPublicRoomLink(roomId: string): string {
  const origin = window.location.origin;
  return `${origin}?room=${encodeURIComponent(roomId)}`;
}

/**
 * Check if running in private dev container
 */
export function isDevSandbox(): boolean {
  return window.location.hostname.includes("ais-dev-");
}

/**
 * Get the current app URL
 */
export function getSharedAppUrl(): string {
  return window.location.origin;
}

/**
 * Fetch open waiting rooms from REST API
 */
export async function fetchOpenRooms(): Promise<OpenRoomSummary[]> {
  try {
    const res = await fetch("/api/multiplayer/rooms");
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch open rooms:", err);
    return [];
  }
}
