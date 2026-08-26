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
    const res = await fetch("/api/ai/video-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate video script.");
    }
    return res.json();
  }

  public static async generateAutoCaptions(params: {
    transcript?: string;
    videoDescription?: string;
    duration?: number;
  }): Promise<{ id: string; startTime: number; endTime: number; text: string }[]> {
    const res = await fetch("/api/ai/auto-captions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate auto-captions.");
    }
    const data = await res.json();
    return data.subtitles || [];
  }

  public static async generateVeoVideoPrompt(params: {
    idea: string;
    style?: string;
  }): Promise<VideoPromptResult> {
    const res = await fetch("/api/ai/video-prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to generate video prompt.");
    }
    return res.json();
  }

  public static async chatWithCopilot(messages: { role: string; content: string }[]): Promise<string> {
    const res = await fetch("/api/gemini/chat", {
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
    if (!res.ok) throw new Error("Failed to chat with AI Copilot");
    const data = await res.json();
    return data.text || "No response received.";
  }
}
