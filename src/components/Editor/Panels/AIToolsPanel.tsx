import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  Video,
  FileText,
  Send,
  Check,
  Copy,
  Layers,
  Wand2,
  RefreshCw,
  Flame,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { AIService, ScriptGenerationResult, VideoPromptResult } from "../../../engine/aiService";
import { STOCK_VIDEOS } from "../../../data/stockMedia";

export const AIToolsPanel: React.FC = () => {
  const { project, setProject, addClipToTrack, addSubtitle } = useEditor();
  const [activeTab, setActiveTab] = useState<"script" | "veo" | "chat">("script");

  // Script Gen State
  const [scriptTopic, setScriptTopic] = useState("5 AI Secrets that will 10x your content creation");
  const [scriptPlatform, setScriptPlatform] = useState("tiktok");
  const [scriptTone, setScriptTone] = useState("viral & high energy");
  const [scriptDuration, setScriptDuration] = useState("15s");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptGenerationResult | null>(null);

  // Veo Prompt State
  const [veoIdea, setVeoIdea] = useState("A hyper-detailed cybernetic bird soaring over a futuristic Tokyo neon skyline");
  const [veoStyle, setVeoStyle] = useState("cinematic 8k photorealistic anamorphic");
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);
  const [veoResult, setVeoResult] = useState<VideoPromptResult | null>(null);

  // Chat Copilot State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "Hello creator! I'm your NovaCut AI Director. Ask me for hook ideas, sound design advice, pacing recommendations, or color grading formulas.",
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // 1. Generate Video Script
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const result = await AIService.generateVideoScript({
        topic: scriptTopic,
        platform: scriptPlatform,
        tone: scriptTone,
        duration: scriptDuration,
      });
      setGeneratedScript(result);
    } catch (err: any) {
      alert(err.message || "Failed to generate script");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Convert Generated Script directly into working timeline tracks & clips!
  const handleApplyScriptToTimeline = () => {
    if (!generatedScript) return;

    // Set project name
    setProject((prev) => ({
      ...prev,
      name: generatedScript.title,
      settings: { ...prev.settings, duration: 15 },
    }));

    // Find main video track and text track
    let mainTrack = project.tracks.find((t) => t.type === "main");
    let textTrack = project.tracks.find((t) => t.type === "text");
    if (!mainTrack) mainTrack = project.tracks[0];
    if (!textTrack) textTrack = project.tracks[0];

    // Add stock B-roll scenes
    generatedScript.scenes.forEach((scene, idx) => {
      const stock = STOCK_VIDEOS[idx % STOCK_VIDEOS.length];
      const start = idx * 3.5;
      if (mainTrack) {
        addClipToTrack(mainTrack.id, {
          type: "video",
          name: `Scene ${idx + 1}: ${stock.name}`,
          mediaUrl: stock.url,
          thumbnailUrl: stock.thumbnailUrl,
          startTime: start,
          duration: 3.5,
          sourceDuration: 5,
        });
      }

      // Add On-Screen bold text
      if (textTrack && scene.onScreenText) {
        addClipToTrack(textTrack.id, {
          type: "text",
          name: `Title: ${scene.onScreenText.slice(0, 15)}`,
          startTime: start + 0.2,
          duration: 3.0,
          textProps: {
            text: scene.onScreenText,
            fontSize: 42,
            fontWeight: "900",
            color: "#ffffff",
            backgroundColor: idx === 0 ? "#ef4444" : "#0284c7",
            animation: "pop",
          },
        });
      }
    });

    // Add generated subtitles
    if (generatedScript.subtitles) {
      generatedScript.subtitles.forEach((sub) => {
        addSubtitle(sub.startTime, sub.endTime, sub.text);
      });
    }

    alert("✨ Script applied! Scenes, titles, and synchronized subtitles added to your timeline.");
  };

  // 2. Generate Veo Prompt
  const handleGenerateVeo = async () => {
    setIsGeneratingVeo(true);
    try {
      const result = await AIService.generateVeoVideoPrompt({
        idea: veoIdea,
        style: veoStyle,
      });
      setVeoResult(result);
    } catch (err: any) {
      alert(err.message || "Failed to generate video prompt");
    } finally {
      setIsGeneratingVeo(false);
    }
  };

  // 3. Chat with Copilot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    setChatInput("");
    const newMsgs = [...chatMessages, { role: "user" as const, content: userText }];
    setChatMessages(newMsgs);
    setIsChatLoading(true);

    try {
      const reply = await AIService.chatWithCopilot(newMsgs);
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Pro Editor Tip: For maximum retention on TikTok & Reels, make your first 3 seconds visually jarring with a fast push-in zoom and a bold contrasting color hook.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none text-xs">
      {/* Top Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-3 pt-2">
        <button
          onClick={() => setActiveTab("script")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "script"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Script Writer</span>
        </button>

        <button
          onClick={() => setActiveTab("veo")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "veo"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Veo 3.1 Video Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "chat"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Director Copilot</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
        {/* TAB 1: SCRIPT WRITER */}
        {activeTab === "script" && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Video Topic or Theme</label>
              <textarea
                rows={2}
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder="What is this video about?"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Platform</label>
                <select
                  value={scriptPlatform}
                  onChange={(e) => setScriptPlatform(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-1.5 text-slate-200"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="shorts">YouTube Shorts</option>
                  <option value="reels">Instagram Reels</option>
                  <option value="youtube">YouTube Longform</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tone</label>
                <select
                  value={scriptTone}
                  onChange={(e) => setScriptTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-1.5 text-slate-200"
                >
                  <option value="viral & high energy">⚡ Viral & High Energy</option>
                  <option value="educational & clear">🎓 Educational</option>
                  <option value="cinematic & mysterious">🎬 Cinematic</option>
                  <option value="humorous & witty">😂 Humorous</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Duration</label>
                <select
                  value={scriptDuration}
                  onChange={(e) => setScriptDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md p-1.5 text-slate-200"
                >
                  <option value="15s">15s Quick Hook</option>
                  <option value="30s">30s Standard</option>
                  <option value="60s">60s Deep Dive</option>
                </select>
              </div>
            </div>

            <button
              disabled={isGeneratingScript}
              onClick={handleGenerateScript}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGeneratingScript ? "Writing Viral Script..." : "Generate AI Storyboard"}</span>
            </button>

            {/* Generated Script Display */}
            {generatedScript && (
              <div className="mt-4 p-3.5 bg-slate-950 border border-sky-500/40 rounded-xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-sky-400 text-sm truncate">
                    {generatedScript.title}
                  </h4>
                  <button
                    onClick={handleApplyScriptToTimeline}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Build Timeline</span>
                  </button>
                </div>

                {/* Hook */}
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    🪝 3-Second Retention Hook
                  </span>
                  <p className="text-slate-200 font-semibold mt-0.5">{generatedScript.hook}</p>
                </div>

                {/* Scenes */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Storyboard Scenes
                  </span>
                  {generatedScript.scenes.map((sc, i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono">
                        <span>Scene {i + 1} ({sc.timeRange})</span>
                        <span className="text-purple-300">SFX: {sc.sfx}</span>
                      </div>
                      <p className="text-slate-300 font-medium text-[11px]">{sc.visualDescription}</p>
                      <div className="text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800 text-amber-300 font-mono">
                        "{sc.onScreenText}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VEO 3.1 VIDEO PROMPTS */}
        {activeTab === "veo" && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Video Concept / Scene</label>
              <textarea
                rows={3}
                value={veoIdea}
                onChange={(e) => setVeoIdea(e.target.value)}
                placeholder="Describe your desired scene (e.g. Cyberpunk sports car speeding through rain)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">Aesthetic Style</label>
              <select
                value={veoStyle}
                onChange={(e) => setVeoStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="cinematic 8k photorealistic anamorphic">🎬 8K Cinematic Anamorphic 35mm</option>
                <option value="3D Pixar Disney animated stylized">✨ 3D Stylized Studio Animation</option>
                <option value="retro anime 90s vintage cel shading">📼 90s Vintage Cyberpunk Anime</option>
                <option value="drone FPV high-speed dynamic sweep">🚁 High-Speed Drone FPV Action</option>
              </select>
            </div>

            <button
              disabled={isGeneratingVeo}
              onClick={handleGenerateVeo}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingVeo ? "Engineering Veo Prompt..." : "Generate Master Video Prompt"}</span>
            </button>

            {veoResult && (
              <div className="mt-4 p-3.5 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3 shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Ready-to-use Veo 3.1 Prompt
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(veoResult.enhancedPrompt);
                        alert("Copied prompt to clipboard!");
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <p className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs leading-relaxed">
                    {veoResult.enhancedPrompt}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Camera Direction</span>
                    <span className="text-sky-300 font-medium">{veoResult.cameraMovement}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Aspect Ratio</span>
                    <span className="text-emerald-300 font-mono">{veoResult.aspectRatio}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CHAT COPILOT */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[380px] custom-scrollbar">
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs ${
                    m.role === "user"
                      ? "bg-sky-600 text-white ml-6 rounded-tr-none"
                      : "bg-slate-950 border border-slate-800 text-slate-200 mr-4 rounded-tl-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {isChatLoading && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl rounded-tl-none mr-6 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>AI Director thinking...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about transitions, hooks, pacing..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:ring-1 focus:ring-sky-500 text-xs"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
