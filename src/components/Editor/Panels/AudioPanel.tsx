import React, { useState } from "react";
import {
  Music,
  Play,
  Pause,
  Plus,
  Volume2,
  Sparkles,
  Zap,
  Mic,
  Disc,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { STOCK_AUDIO, SOUND_EFFECTS } from "../../../data/stockMedia";
import { globalAudioMixer } from "../../../engine/audioMixer";

export const AudioPanel: React.FC = () => {
  const { addClipToTrack, project } = useEditor();
  const [activeTab, setActiveTab] = useState<"music" | "sfx" | "tts">("music");
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState("Welcome to NovaCut Studio. Unleash your visual creativity today.");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);

  // Play/Stop Audio Preview
  const toggleAudioPreview = (id: string, url: string) => {
    if (previewingId === id) {
      globalAudioMixer.stopPreview();
      setPreviewingId(null);
    } else {
      globalAudioMixer.playPreview(url);
      setPreviewingId(id);
    }
  };

  // Add music track to Audio Track on timeline
  const handleAddMusic = (audio: (typeof STOCK_AUDIO)[0]) => {
    let audioTrack = project.tracks.find((t) => t.type === "audio");
    if (!audioTrack) {
      audioTrack = project.tracks[0];
    }
    if (!audioTrack) return;

    const lastClipEnd = audioTrack.clips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      0
    );

    addClipToTrack(audioTrack.id, {
      type: "audio",
      name: audio.name,
      mediaUrl: audio.url,
      startTime: lastClipEnd > 0 ? lastClipEnd : 0,
      duration: Math.min(project.settings.duration, audio.duration || 15),
      sourceDuration: audio.duration || 30,
      audioProps: {
        volume: 0.8,
        muted: false,
        fadeIn: 1.0,
        fadeOut: 1.5,
        speed: 1,
      },
    });
  };

  // Play Sound Effect via Web Audio Synthesizer / Procedural SFX
  const playSfxTone = (type: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "whoosh") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "pop") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "impact") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Bell / Chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // ignore
    }
  };

  // Add SFX to timeline
  const handleAddSfx = (sfx: (typeof SOUND_EFFECTS)[0]) => {
    let audioTrack = project.tracks.find((t) => t.type === "audio");
    if (!audioTrack) audioTrack = project.tracks[0];
    if (!audioTrack) return;

    playSfxTone(sfx.category);

    addClipToTrack(audioTrack.id, {
      type: "audio",
      name: `SFX: ${sfx.name}`,
      mediaUrl: sfx.url,
      startTime: 0,
      duration: sfx.duration || 1.5,
      sourceDuration: sfx.duration || 1.5,
      audioProps: {
        volume: 1.0,
        muted: false,
        fadeIn: 0,
        fadeOut: 0,
        speed: 1,
      },
    });
  };

  // Generate TTS
  const handleGenerateTts = () => {
    setIsGeneratingTts(true);
    setTimeout(() => {
      let audioTrack = project.tracks.find((t) => t.type === "audio");
      if (!audioTrack) audioTrack = project.tracks[0];
      if (audioTrack) {
        addClipToTrack(audioTrack.id, {
          type: "audio",
          name: `AI Voice: "${ttsText.slice(0, 15)}..."`,
          mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          startTime: 0,
          duration: 4.5,
          sourceDuration: 4.5,
          audioProps: { volume: 1.0, muted: false, fadeIn: 0.1, fadeOut: 0.2, speed: 1 },
        });
      }
      setIsGeneratingTts(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 select-none">
      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-3 pt-2 text-xs">
        <button
          onClick={() => setActiveTab("music")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "music"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Royalty-Free Tracks</span>
        </button>
        <button
          onClick={() => setActiveTab("sfx")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "sfx"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Sound Effects</span>
        </button>
        <button
          onClick={() => setActiveTab("tts")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            activeTab === "tts"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>AI Voiceover</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar text-xs">
        {/* MUSIC TRACKS */}
        {activeTab === "music" && (
          <div className="space-y-2">
            {STOCK_AUDIO.map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <button
                    onClick={() => toggleAudioPreview(track.id, track.url)}
                    className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                  >
                    {previewingId === track.id ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-slate-200 truncate">{track.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {track.category} • {track.duration}s
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleAddMusic(track)}
                  title="Add to Audio Track"
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium shrink-0 transition-colors shadow-sm"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SOUND EFFECTS SOUNDBOARD */}
        {activeTab === "sfx" && (
          <div className="space-y-3">
            <p className="text-slate-400 text-[11px]">
              Click any sound effect to preview instant procedural audio or add to the timeline.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SOUND_EFFECTS.map((sfx) => (
                <div
                  key={sfx.id}
                  onClick={() => playSfxTone(sfx.category)}
                  className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-lg cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-mono text-slate-400">{sfx.duration}s</span>
                  </div>
                  <p className="font-semibold text-slate-200 text-xs mb-2">{sfx.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSfx(sfx);
                    }}
                    className="w-full py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to Timeline</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI TTS VOICEOVER */}
        {activeTab === "tts" && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 block mb-1 font-medium">Script to Read</label>
              <textarea
                rows={4}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Type narration script for Gemini TTS..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-medium">AI Voice Model</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="Kore">Kore (Energetic & Dynamic)</option>
                <option value="Puck">Puck (Playful & Viral)</option>
                <option value="Charon">Charon (Deep & Cinematic Narrator)</option>
                <option value="Fenrir">Fenrir (Authoritative Executive)</option>
                <option value="Aoede">Aoede (Warm & Conversational)</option>
              </select>
            </div>

            <button
              disabled={isGeneratingTts || !ttsText.trim()}
              onClick={handleGenerateTts}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingTts ? "Generating Voiceover..." : "Generate & Add to Timeline"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
