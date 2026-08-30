// Centralized client-side API fetch utility
export function getAuthToken(): string {
  try {
    return localStorage.getItem("novacut_session_token") || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token: string) {
  try {
    if (token) {
      localStorage.setItem("novacut_session_token", token);
    } else {
      localStorage.removeItem("novacut_session_token");
    }
  } catch {}
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-session-token"] = token;
  }

  return fetch(url, {
    ...options,
    credentials: options.credentials || "include",
    headers,
  });
}

// Safely parse JSON from fetch response, preventing SyntaxError: Unexpected token 'A', "A server e"...
export async function safeApiJson<T = any>(res: Response): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  let rawText = "";
  try {
    rawText = await res.text();
  } catch (err: any) {
    return {
      ok: false,
      status: res.status,
      data: {} as T,
      error: "Could not read response from server. Please check your internet connection.",
    };
  }

  if (!rawText || !rawText.trim()) {
    return {
      ok: res.ok,
      status: res.status,
      data: {} as T,
      error: res.ok ? undefined : `Server returned empty response (${res.status})`,
    };
  }

  try {
    const json = JSON.parse(rawText);
    return {
      ok: res.ok && !json.error,
      status: res.status,
      data: json as T,
      error: json.error ? (typeof json.error === "string" ? json.error : json.error.message || JSON.stringify(json.error)) : (res.ok ? undefined : `Request error (${res.status})`),
    };
  } catch {
    // Non-JSON response (e.g. Cloud Run 500/502 "A server error occurred...", Nginx HTML, or plain text)
    let cleanMessage = "Server temporarily busy. Please try again in a few moments.";
    if (rawText.length > 0 && rawText.length < 250 && !rawText.includes("<!DOCTYPE") && !rawText.includes("<html")) {
      cleanMessage = rawText.trim();
    }
    return {
      ok: false,
      status: res.status,
      data: {} as T,
      error: cleanMessage,
    };
  }
}

// Clean and user-friendly error formatting for API and GenAI responses
export function formatApiError(err: any): string {
  if (!err) return "An unexpected error occurred. Please try again.";
  let msg = typeof err === "string" ? err : err?.message || JSON.stringify(err);

  // Catch unparsed JSON SyntaxErrors cleanly
  if (msg.includes("Unexpected token") || msg.includes("is not valid JSON") || msg.includes("A server e")) {
    return "سرور سے رابطہ ہو رہا ہے۔ براہ کرم ایک لمحہ بعد دوبارہ ٹرائی کریں۔ / Server is busy, retrying with fast engine...";
  }

  try {
    const parsed = JSON.parse(msg);
    if (parsed.error) {
      if (typeof parsed.error === "string") msg = parsed.error;
      else if (parsed.error.message) msg = parsed.error.message;
    }
  } catch {}

  if (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded") ||
    msg.includes("rate-limits") ||
    msg.includes("exceeded your current quota") ||
    msg.includes("quota")
  ) {
    return "Gemini model quota limit reached. Using fast generative fallback or retry in a few moments.";
  }

  return msg;
}

