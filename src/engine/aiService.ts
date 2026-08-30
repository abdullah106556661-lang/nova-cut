import { apiFetch, safeApiJson } from "../utils/api";

export interface ScriptGenerationResult {
  title: string;
  hook: string;
  scenes: {
    timeRange: string;
    visualDescription: string;
    onScreenText: string;
    narration: string;
    sfx: string;
  }[];
  callToAction: string;
  suggestedMusicMood: string;
  subtitles: { startTime: number; endTime: number; text: string }[];
  isSimulated?: boolean;
}

export interface VideoPromptResult {
  enhancedPrompt: string;
  negativePrompt: string;
  cameraMovement: string;
  aspectRatio: string;
  isSimulated?: boolean;
}

export class AIService {
  public static async generateVideoScript(params: {
    topic: string;
    platform: string;
    tone: string;
    duration: string;
  }): Promise<ScriptGenerationResult> {
    const res = await apiFetch("/api/ai/video-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const { ok, data, error } = await safeApiJson<ScriptGenerationResult>(res);
    if (!ok || !data) {
      throw new Error(error || "Failed to generate video script.");
    }
    return data;
  }

  public static async generateAutoCaptions(params: {
    transcript?: string;
    videoDescription?: string;
    duration?: number;
  }): Promise<{ id: string; startTime: number; endTime: number; text: string }[]> {
    const res = await apiFetch("/api/ai/auto-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const { ok, data, error } = await safeApiJson<{ subtitles: any[] }>(res);
    if (!ok) {
      throw new Error(error || "Failed to generate auto-captions.");
    }
    return data?.subtitles || [];
  }

  public static async generateVeoVideoPrompt(params: {
    idea: string;
    style?: string;
  }): Promise<VideoPromptResult> {
    const res = await apiFetch("/api/ai/video-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const { ok, data, error } = await safeApiJson<VideoPromptResult>(res);
    if (!ok || !data) {
      throw new Error(error || "Failed to generate video prompt.");
    }
    return data;
  }

  public static async chatWithCopilot(messages: { role: string; content: string }[]): Promise<string> {
    const res = await apiFetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        systemInstruction: `You are NovaCut Studio AI Copilot, an elite professional video editor, colorist, and YouTube/TikTok viral strategist.
Help the creator with pacing, clip trimming, sound design, hooks, color grading formulas, and creative video ideas.
Keep replies practical, structured, and punchy.`,
        model: "gemini-3.7-flash",
      }),
    });
    const { ok, data, error } = await safeApiJson<{ text?: string }>(res);
    if (!ok) {
      throw new Error(error || "Failed to chat with AI Copilot");
    }
    return data?.text || "No response received.";
  }
}

