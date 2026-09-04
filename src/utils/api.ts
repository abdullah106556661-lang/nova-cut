// Centralized client-side API fetch utility and unified response interceptor

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  status?: number;
  message?: string;
  [key: string]: any;
}

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

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

// Global API fetch interceptor with timeout and retry capabilities
export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  // AI generation and media editing endpoints require longer processing budgets
  const isHeavyMediaRoute = url.includes("/ai/edit-photo") || 
                           url.includes("/ai/generate-video") || 
                           url.includes("/ai/generate-image") || 
                           url.includes("/ai/super-resolution");
  const defaultTimeout = isHeavyMediaRoute ? 90000 : 45000;
  const { timeoutMs = defaultTimeout, retries = 0, ...fetchOptions } = options;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-session-token"] = token;
  }

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= retries) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal,
        credentials: fetchOptions.credentials || "include",
        headers,
      });
      clearTimeout(timer);

      // Handle 502 / 503 / 504 gateway or cold start errors with 1 safe retry for GET / idempotent requests
      if (!response.ok && [502, 503, 504].includes(response.status) && attempt <= retries && (!fetchOptions.method || fetchOptions.method === "GET")) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Please check your internet connection and try again.");
      }
      if (attempt <= retries && (!fetchOptions.method || fetchOptions.method === "GET")) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Network request failed.");
}

// Safely parse JSON from fetch response and guarantee unified { success: boolean, data?: any, error?: string, code?: string }
export async function safeApiJson<T = any>(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: T;
  error?: string;
  code?: string;
  raw: ApiResponse<T>;
}> {
  let rawText = "";
  try {
    rawText = await res.text();
  } catch (err: any) {
    const errorMsg = "Could not read response from server. Please check your internet connection.";
    return {
      ok: false,
      status: res.status || 0,
      data: {} as T,
      error: errorMsg,
      code: "NETWORK_ERROR",
      raw: { success: false, error: errorMsg, code: "NETWORK_ERROR" },
    };
  }

  if (!rawText || !rawText.trim()) {
    const ok = res.ok;
    const errorMsg = ok ? undefined : `Server returned empty response (${res.status})`;
    return {
      ok,
      status: res.status,
      data: {} as T,
      error: errorMsg,
      code: ok ? undefined : "EMPTY_RESPONSE",
      raw: { success: ok, error: errorMsg, code: ok ? undefined : "EMPTY_RESPONSE" },
    };
  }

  try {
    const json: ApiResponse<T> = JSON.parse(rawText);
    const isSuccess = json.success !== undefined ? Boolean(json.success) : res.ok && !json.error;
    const error = json.error ? (typeof json.error === "string" ? json.error : (json.error as any).message || JSON.stringify(json.error)) : (!isSuccess ? `Request error (${res.status})` : undefined);
    const code = json.code;
    
    // Normalize data payload: if json has 'data' property use it, otherwise use root object or relevant payload key
    const payloadData = (json.data !== undefined ? json.data : json) as T;

    return {
      ok: isSuccess,
      status: res.status,
      data: payloadData,
      error,
      code,
      raw: json,
    };
  } catch {
    // Non-JSON response (e.g. Serverless / Cloud Run 500/502 "A server error occurred...", Nginx HTML, or plain text)
    let cleanMessage = "Server temporarily busy. Please try again in a few moments.";
    if (rawText.length > 0 && rawText.length < 250 && !rawText.includes("<!DOCTYPE") && !rawText.includes("<html")) {
      cleanMessage = rawText.trim();
    }
    return {
      ok: false,
      status: res.status,
      data: {} as T,
      error: cleanMessage,
      code: "SERVER_ERROR",
      raw: { success: false, error: cleanMessage, code: "SERVER_ERROR" },
    };
  }
}

// Global API client helper that runs apiFetch and safeApiJson in one clean call
export async function apiRequest<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; code?: string; status: number }> {
  try {
    const res = await apiFetch(url, options);
    const result = await safeApiJson<T>(res);
    return {
      success: result.ok,
      data: result.data,
      error: result.error,
      code: result.code,
      status: result.status,
    };
  } catch (err: any) {
    const formatted = formatApiError(err);
    return {
      success: false,
      error: formatted,
      code: "CLIENT_FETCH_ERROR",
      status: 0,
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

