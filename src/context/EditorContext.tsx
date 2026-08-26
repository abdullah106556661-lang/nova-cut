import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  VideoProject,
  TimelineClip,
  TimelineTrack,
  SubtitleItem,
  ProjectSettings,
  VideoTemplate,
  MediaAsset,
} from "../types/editor";
import { DEFAULT_STARTER_PROJECT } from "../data/sampleProjects";
import { DEFAULT_COLOR_FILTER, STOCK_VIDEOS, STOCK_IMAGES } from "../data/stockMedia";
import { globalAudioMixer } from "../engine/audioMixer";
import { extractVideoMetadataAndThumbnail, createDefaultVideoThumbnailPlaceholder } from "../utils/mediaUtils";

export type NavTab =
  | "home"
  | "dashboard"
  | "projects"
  | "editor"
  | "ai-generate"
  | "media-transform"
  | "admin"
  | "login"
  | "signup"
  | "templates"
  | "pricing"
  | "profile"
  | "settings"
  | "help"
  | "contact"
  | "privacy"
  | "terms";

interface EditorContextType {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Active Project & State
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  currentTime: number;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  togglePlayPause: () => void;
  
  // Selection
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  selectedClip: TimelineClip | null;
  selectedTrackId: string | null;
  setSelectedTrackId: (id: string | null) => void;
  
  // Timeline Navigation & Zoom
  zoomLevel: number; // pixels per second
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  
  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Track & Clip operations
  addClipToTrack: (trackId: string, clipData: Partial<TimelineClip>) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  removeClip: (clipId: string) => void;
  splitClipAtPlayhead: (clipId?: string) => void;
  duplicateClip: (clipId: string) => void;
  addTrack: (type: TimelineTrack["type"], name?: string) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  
  // Subtitles
  addSubtitle: (startTime: number, endTime: number, text: string) => void;
  updateSubtitle: (subId: string, updates: Partial<SubtitleItem>) => void;
  removeSubtitle: (subId: string) => void;
  
  // Media Assets Library & Uploads
  uploadedAssets: MediaAsset[];
  addUploadedAsset: (asset: MediaAsset) => void;
  deleteUploadedAsset: (id: string) => void;
  clearUploadedAssets: () => void;
  uploadMediaFile: (file: File) => Promise<MediaAsset>;
  activeMediaTab: "uploads" | "stockVideos" | "stockImages" | "audio";
  setActiveMediaTab: (tab: "uploads" | "stockVideos" | "stockImages" | "audio") => void;

  // Multi-Project Management
  projects: VideoProject[];
  createProject: (settings: ProjectSettings, name?: string) => string;
  loadTemplate: (template: VideoTemplate) => void;
  loadProjectFromData: (projectData: VideoProject) => void;
  openProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  renameProject: (projectId: string, newName: string) => void;
  exportProjectJson: (projectId?: string) => void;
  importProjectJson: (jsonString: string) => boolean;

  // Search & Global Spotlight Modal
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  
  // Navigation & Modals in Editor
  activePanel: "media" | "audio" | "text" | "effects" | "transitions" | "captions" | "stickers" | "ai" | "templates";
  setActivePanel: (panel: "media" | "audio" | "text" | "effects" | "transitions" | "captions" | "stickers" | "ai" | "templates") => void;
  exportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (open: boolean) => void;
  aiCopilotOpen: boolean;
  setAiCopilotOpen: (open: boolean) => void;
  recorderModalOpen: boolean;
  setRecorderModalOpen: (open: boolean) => void;
  
  // Canvas Safe Zone & Viewport
  showSafeZone: boolean;
  setShowSafeZone: (show: boolean) => void;
}

const STORAGE_ACTIVE_PROJECT = "novacut_active_project_v1";
const STORAGE_PROJECTS_LIST = "novacut_projects_list_v1";

const INITIAL_PROJECTS: VideoProject[] = [
  DEFAULT_STARTER_PROJECT,
  {
    id: "proj_sample_tiktok",
    name: "Viral TikTok Tech Review",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    settings: {
      aspectRatio: "9:16",
      width: 1080,
      height: 1920,
      fps: 30,
      backgroundColor: "#090d16",
      duration: 12,
    },
    tracks: [
      {
        id: "track_main_t1",
        name: "Main Footage",
        type: "main",
        isMuted: false,
        isLocked: false,
        isHidden: false,
        volume: 1,
        clips: [
          {
            id: "clip_sample_vid_1",
            trackId: "track_main_t1",
            type: "video",
            name: "Cyber Neon City",
            mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80",
            startTime: 0,
            duration: 12,
            sourceStartTime: 0,
            sourceDuration: 15,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            opacity: 1,
            zIndex: 1,
            colorFilter: { ...DEFAULT_COLOR_FILTER },
            visualEffect: "cyberpunk",
            effectIntensity: 0.8,
            speed: 1,
            keyframes: [],
          },
        ],
      },
      {
        id: "track_txt_t1",
        name: "Captions",
        type: "text",
        isMuted: false,
        isLocked: false,
        isHidden: false,
        volume: 1,
        clips: [
          {
            id: "clip_txt_1",
            trackId: "track_txt_t1",
            type: "text",
            name: "Hook Title",
            mediaUrl: "",
            startTime: 0.5,
            duration: 4,
            sourceStartTime: 0,
            sourceDuration: 4,
            x: 0,
            y: -20,
            scale: 1.1,
            rotation: 0,
            opacity: 1,
            zIndex: 5,
            colorFilter: { ...DEFAULT_COLOR_FILTER },
            visualEffect: "none",
            effectIntensity: 1,
            speed: 1,
            keyframes: [],
            textProps: {
              text: "🔥 3 TECH TOOLS YOU NEED",
              fontSize: 32,
              fontWeight: "900",
              color: "#ffffff",
              backgroundColor: "rgba(0,0,0,0.6)",
              textAlign: "center",
            },
          },
        ],
      },
    ],
    subtitles: [
      { id: "s1", startTime: 0.5, endTime: 4.0, text: "Stop scrolling if you create content!" },
      { id: "s2", startTime: 4.2, endTime: 8.0, text: "Here is the new AI video editing engine." },
      { id: "s3", startTime: 8.2, endTime: 11.5, text: "Try NovaCut Studio right in your browser." },
    ],
    markers: [0.5, 4.2, 8.2],
  },
  {
    id: "proj_sample_youtube",
    name: "4K YouTube Cinematic Intro",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80",
    settings: {
      aspectRatio: "16:9",
      width: 3840,
      height: 2160,
      fps: 60,
      backgroundColor: "#05070c",
      duration: 15,
    },
    tracks: [
      {
        id: "tr_main_yt",
        name: "Main 4K Track",
        type: "main",
        isMuted: false,
        isLocked: false,
        isHidden: false,
        volume: 1,
        clips: [],
      },
    ],
    subtitles: [],
    markers: [0, 5, 10],
  },
];

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    try {
      const hash = window.location.hash.replace("#", "") as NavTab;
      const validTabs: NavTab[] = [
        "home",
        "dashboard",
        "projects",
        "editor",
        "ai-generate",
        "templates",
        "pricing",
        "profile",
        "settings",
        "help",
        "contact",
        "privacy",
        "terms",
      ];
      if (validTabs.includes(hash)) return hash;
    } catch {
      // ignore
    }
    return "dashboard";
  });

  // Sync activeTab with URL hash
  useEffect(() => {
    try {
      window.location.hash = activeTab;
    } catch {
      // ignore
    }
  }, [activeTab]);

  // Projects Collection
  const [projects, setProjects] = useState<VideoProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_LIST);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PROJECTS;
  });

  // Active Project
  const [project, setProject] = useState<VideoProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_PROJECT);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_STARTER_PROJECT;
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(45); // px per second
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  // Undo / Redo history stacks
  const historyRef = useRef<VideoProject[]>([]);
  const futureRef = useRef<VideoProject[]>([]);
  const isHistoryAction = useRef(false);

  // Modals & Panels
  const [activePanel, setActivePanel] = useState<"media" | "audio" | "text" | "effects" | "transitions" | "captions" | "stickers" | "ai" | "templates">("media");
  const [activeMediaTab, setActiveMediaTab] = useState<"uploads" | "stockVideos" | "stockImages" | "audio">("uploads");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [recorderModalOpen, setRecorderModalOpen] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);

  // Global Media Assets (Uploaded Videos & Images)
  const [uploadedAssets, setUploadedAssets] = useState<MediaAsset[]>(() => {
    try {
      const saved = localStorage.getItem("novacut_media_uploads_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default starter uploaded clips so the user always has sample video assets ready
    return [
      {
        id: "asset_sample_1",
        name: "Cyberpunk Night Walk 4K.mp4",
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80",
        duration: 15,
        size: "14.2 MB",
        aspectRatio: "16:9",
        createdAt: new Date().toISOString(),
      },
      {
        id: "asset_sample_2",
        name: "Drone Coastal Sunset 4K.mp4",
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80",
        duration: 15,
        size: "18.6 MB",
        aspectRatio: "16:9",
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Save uploaded media assets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("novacut_media_uploads_v1", JSON.stringify(uploadedAssets));
    } catch {
      // ignore
    }
  }, [uploadedAssets]);

  const addUploadedAsset = useCallback((asset: MediaAsset) => {
    setUploadedAssets((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)]);
    setActiveMediaTab("uploads");
  }, []);

  const deleteUploadedAsset = useCallback((id: string) => {
    setUploadedAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearUploadedAssets = useCallback(() => {
    setUploadedAssets([]);
  }, []);

  // Upload video / media file with automatic metadata and high-res canvas thumbnail extraction
  const uploadMediaFile = useCallback(async (file: File): Promise<MediaAsset> => {
    const isVid = file.type.startsWith("video");
    const isImg = file.type.startsWith("image");
    const isAud = file.type.startsWith("audio");
    const url = URL.createObjectURL(file);

    let duration = 10;
    let thumbnailUrl = isImg ? url : undefined;
    let aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "21:9" = "16:9";

    if (isVid) {
      try {
        const meta = await extractVideoMetadataAndThumbnail(file);
        duration = meta.duration;
        thumbnailUrl = meta.thumbnailUrl;
        aspectRatio = meta.aspectRatio;
      } catch (err) {
        console.warn("Could not extract video metadata, using fallback:", err);
        thumbnailUrl = createDefaultVideoThumbnailPlaceholder(file.name);
      }
    } else if (isImg) {
      thumbnailUrl = url;
    }

    const newAsset: MediaAsset = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: file.name,
      type: isVid ? "video" : isImg ? "image" : isAud ? "audio" : "video",
      url,
      thumbnailUrl: thumbnailUrl || (isVid ? createDefaultVideoThumbnailPlaceholder(file.name) : undefined),
      duration,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      aspectRatio,
      createdAt: new Date().toISOString(),
    };

    setUploadedAssets((prev) => [newAsset, ...prev]);
    setActiveMediaTab("uploads");
    return newAsset;
  }, []);

  // Save projects list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECTS_LIST, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects]);

  // Auto-save active project & update it in projects list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PROJECT, JSON.stringify(project));
    } catch {
      // ignore
    }

    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) {
        return prev.map((p) => (p.id === project.id ? { ...project, updatedAt: new Date().toISOString() } : p));
      } else {
        return [{ ...project, updatedAt: new Date().toISOString() }, ...prev];
      }
    });

    if (!isHistoryAction.current) {
      historyRef.current.push(JSON.parse(JSON.stringify(project)));
      if (historyRef.current.length > 40) historyRef.current.shift();
      futureRef.current = [];
    }
    isHistoryAction.current = false;
  }, [project]);

  // Audio Sync on Playback
  useEffect(() => {
    globalAudioMixer.syncProjectAudio(project, currentTime, isPlaying);
  }, [currentTime, isPlaying, project]);

  // Playback timer ticker loop (requestAnimationFrame)
  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const loop = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTs) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= project.settings.duration) {
            setIsPlaying(false);
            return 0; // loop back to start
          }
          return next;
        });
      }
      lastTs = now;
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, project.settings.duration]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Find currently selected clip object
  const selectedClip = React.useMemo(() => {
    if (!selectedClipId) return null;
    for (const track of project.tracks) {
      const found = track.clips.find((c) => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [project.tracks, selectedClipId]);

  // Undo implementation
  const undo = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    isHistoryAction.current = true;
    const current = historyRef.current.pop();
    if (current) {
      futureRef.current.push(current);
      const prev = historyRef.current[historyRef.current.length - 1];
      if (prev) {
        setProject(JSON.parse(JSON.stringify(prev)));
      }
    }
  }, []);

  // Redo implementation
  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    isHistoryAction.current = true;
    const next = futureRef.current.pop();
    if (next) {
      historyRef.current.push(next);
      setProject(JSON.parse(JSON.stringify(next)));
    }
  }, []);

  const canUndo = historyRef.current.length > 1;
  const canRedo = futureRef.current.length > 0;

  // Add clip to specific track
  const addClipToTrack = useCallback((trackId: string, clipData: Partial<TimelineClip>) => {
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      trackId,
      type: clipData.type || "video",
      name: clipData.name || "Untitled Clip",
      mediaUrl: clipData.mediaUrl || "",
      thumbnailUrl: clipData.thumbnailUrl,
      startTime: clipData.startTime ?? 0,
      duration: clipData.duration ?? 4.0,
      sourceStartTime: clipData.sourceStartTime ?? 0,
      sourceDuration: clipData.sourceDuration ?? (clipData.duration || 4.0),
      x: clipData.x ?? 0,
      y: clipData.y ?? 0,
      scale: clipData.scale ?? 1,
      rotation: clipData.rotation ?? 0,
      opacity: clipData.opacity ?? 1,
      zIndex: clipData.zIndex ?? 1,
      colorFilter: clipData.colorFilter || { ...DEFAULT_COLOR_FILTER },
      visualEffect: clipData.visualEffect || "none",
      effectIntensity: clipData.effectIntensity ?? 1,
      speed: clipData.speed ?? 1,
      keyframes: clipData.keyframes || [],
      textProps: clipData.textProps,
      audioProps: clipData.audioProps,
      captionText: clipData.captionText,
      stickerEmoji: clipData.stickerEmoji,
    };

    setProject((prev) => {
      const tracks = prev.tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, clips: [...t.clips, newClip] };
        }
        return t;
      });

      const maxTime = Math.max(
        prev.settings.duration,
        newClip.startTime + newClip.duration + 1.0
      );

      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        settings: { ...prev.settings, duration: maxTime },
        tracks,
      };
    });

    setSelectedClipId(newClip.id);
  }, []);

  // Update specific clip
  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    setProject((prev) => {
      const tracks = prev.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      }));
      return { ...prev, updatedAt: new Date().toISOString(), tracks };
    });
  }, []);

  // Remove specific clip
  const removeClip = useCallback((clipId: string) => {
    setProject((prev) => {
      const tracks = prev.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      }));
      return { ...prev, updatedAt: new Date().toISOString(), tracks };
    });
    setSelectedClipId((cur) => (cur === clipId ? null : cur));
  }, []);

  // Split clip at current playhead time
  const splitClipAtPlayhead = useCallback((targetClipId?: string) => {
    const idToSplit = targetClipId || selectedClipId;
    if (!idToSplit) return;

    setProject((prev) => {
      let didSplit = false;
      const tracks = prev.tracks.map((track) => {
        const clipIdx = track.clips.findIndex((c) => c.id === idToSplit);
        if (clipIdx === -1) return track;

        const clip = track.clips[clipIdx];
        if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) {
          return track;
        }

        const leftDuration = currentTime - clip.startTime;
        const rightDuration = clip.duration - leftDuration;

        const leftClip: TimelineClip = {
          ...clip,
          id: `clip_${Date.now()}_a`,
          duration: leftDuration,
        };

        const rightClip: TimelineClip = {
          ...clip,
          id: `clip_${Date.now()}_b`,
          startTime: currentTime,
          duration: rightDuration,
          sourceStartTime: clip.sourceStartTime + leftDuration * clip.speed,
        };

        const newClips = [...track.clips];
        newClips.splice(clipIdx, 1, leftClip, rightClip);
        didSplit = true;

        return { ...track, clips: newClips };
      });

      if (!didSplit) return prev;
      return { ...prev, updatedAt: new Date().toISOString(), tracks };
    });
  }, [currentTime, selectedClipId]);

  // Duplicate clip
  const duplicateClip = useCallback((clipId: string) => {
    setProject((prev) => {
      const tracks = prev.tracks.map((t) => {
        const found = t.clips.find((c) => c.id === clipId);
        if (!found) return t;

        const duplicated: TimelineClip = {
          ...JSON.parse(JSON.stringify(found)),
          id: `clip_${Date.now()}_dup`,
          name: `${found.name} (Copy)`,
          startTime: found.startTime + found.duration + 0.5,
        };

        return { ...t, clips: [...t.clips, duplicated] };
      });
      return { ...prev, updatedAt: new Date().toISOString(), tracks };
    });
  }, []);

  // Add new track
  const addTrack = useCallback((type: TimelineTrack["type"], name?: string) => {
    const newTrack: TimelineTrack = {
      id: `track_${Date.now()}_${type}`,
      name: name || `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${project.tracks.length + 1}`,
      type,
      isMuted: false,
      isLocked: false,
      isHidden: false,
      volume: 1,
      clips: [],
    };

    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      tracks: [...prev.tracks, newTrack],
    }));
  }, [project.tracks.length]);

  // Remove track
  const removeTrack = useCallback((trackId: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      tracks: prev.tracks.filter((t) => t.id !== trackId),
    }));
  }, []);

  // Update track properties
  const updateTrack = useCallback((trackId: string, updates: Partial<TimelineTrack>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
    }));
  }, []);

  // Subtitles
  const addSubtitle = useCallback((startTime: number, endTime: number, text: string) => {
    const newSub: SubtitleItem = {
      id: `sub_${Date.now()}`,
      startTime,
      endTime,
      text,
    };
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      subtitles: [...(prev.subtitles || []), newSub].sort((a, b) => a.startTime - b.startTime),
    }));
  }, []);

  const updateSubtitle = useCallback((subId: string, updates: Partial<SubtitleItem>) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      subtitles: (prev.subtitles || []).map((s) => (s.id === subId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const removeSubtitle = useCallback((subId: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      subtitles: (prev.subtitles || []).filter((s) => s.id !== subId),
    }));
  }, []);

  // Load Template
  const loadTemplate = useCallback((template: VideoTemplate) => {
    const newProj: VideoProject = {
      id: `proj_${Date.now()}`,
      name: `${template.name} Project`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnailUrl: template.thumbnailUrl,
      settings: {
        aspectRatio: template.aspectRatio,
        width: template.projectData.settings?.width || (template.aspectRatio === "9:16" ? 1080 : 1920),
        height: template.projectData.settings?.height || (template.aspectRatio === "9:16" ? 1920 : 1080),
        fps: template.projectData.settings?.fps || 30,
        backgroundColor: template.projectData.settings?.backgroundColor || "#080c14",
        duration: template.duration || 12,
      },
      tracks: JSON.parse(JSON.stringify(template.projectData.tracks || [])),
      subtitles: JSON.parse(JSON.stringify(template.projectData.subtitles || [])),
      markers: [0, Math.floor(template.duration / 2)],
    };

    setProject(newProj);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setActiveTab("editor");
  }, []);

  // Create New Project
  const createProject = useCallback((settings: ProjectSettings, name = "Untitled Masterpiece") => {
    const newProj: VideoProject = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      thumbnailUrl:
        settings.aspectRatio === "9:16"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80",
      settings,
      tracks: [
        {
          id: `track_text_${Date.now()}`,
          name: "Text & Titles",
          type: "text",
          isMuted: false,
          isLocked: false,
          isHidden: false,
          volume: 1,
          clips: [],
        },
        {
          id: `track_main_${Date.now()}`,
          name: "Main Video Track",
          type: "main",
          isMuted: false,
          isLocked: false,
          isHidden: false,
          volume: 1,
          clips: [],
        },
        {
          id: `track_audio_${Date.now()}`,
          name: "Music & Sound Effects",
          type: "audio",
          isMuted: false,
          isLocked: false,
          isHidden: false,
          volume: 1,
          clips: [],
        },
      ],
      subtitles: [],
      markers: [0],
    };

    setProject(newProj);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setActiveTab("editor");
    return newProj.id;
  }, []);

  const loadProjectFromData = useCallback((projectData: VideoProject) => {
    setProject(projectData);
    setCurrentTime(0);
    setIsPlaying(false);
    setSelectedClipId(null);
    setActiveTab("editor");
  }, []);

  const openProject = useCallback(
    (projectId: string) => {
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        setProject(found);
        setCurrentTime(0);
        setIsPlaying(false);
        setSelectedClipId(null);
        setActiveTab("editor");
      }
    },
    [projects]
  );

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const duplicateProject = useCallback(
    (projectId: string) => {
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        const dup: VideoProject = {
          ...JSON.parse(JSON.stringify(found)),
          id: `proj_${Date.now()}_dup`,
          name: `${found.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProjects((prev) => [dup, ...prev]);
      }
    },
    [projects]
  );

  const renameProject = useCallback((projectId: string, newName: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p)));
    setProject((prev) => (prev.id === projectId ? { ...prev, name: newName, updatedAt: new Date().toISOString() } : prev));
  }, []);

  const exportProjectJson = useCallback(
    (projectId?: string) => {
      const target = projectId ? projects.find((p) => p.id === projectId) || project : project;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(target, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${target.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-project.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    },
    [project, projects]
  );

  const importProjectJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as VideoProject;
      if (parsed.settings && Array.isArray(parsed.tracks)) {
        const imported: VideoProject = {
          ...parsed,
          id: `proj_${Date.now()}_imported`,
          name: parsed.name ? `${parsed.name} (Imported)` : "Imported Project",
          updatedAt: new Date().toISOString(),
        };
        setProjects((prev) => [imported, ...prev]);
        setProject(imported);
        setActiveTab("editor");
        return true;
      }
    } catch (e) {
      console.error("Failed to parse project JSON", e);
    }
    return false;
  }, []);

  return (
    <EditorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        project,
        setProject,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
        togglePlayPause,
        selectedClipId,
        setSelectedClipId,
        selectedClip,
        selectedTrackId,
        setSelectedTrackId,
        zoomLevel,
        setZoomLevel,
        undo,
        redo,
        canUndo,
        canRedo,
        addClipToTrack,
        updateClip,
        removeClip,
        splitClipAtPlayhead,
        duplicateClip,
        addTrack,
        removeTrack,
        updateTrack,
        addSubtitle,
        updateSubtitle,
        removeSubtitle,
        uploadedAssets,
        addUploadedAsset,
        deleteUploadedAsset,
        clearUploadedAssets,
        uploadMediaFile,
        activeMediaTab,
        setActiveMediaTab,
        projects,
        createProject,
        loadTemplate,
        loadProjectFromData,
        openProject,
        deleteProject,
        duplicateProject,
        renameProject,
        exportProjectJson,
        importProjectJson,
        searchModalOpen,
        setSearchModalOpen,
        activePanel,
        setActivePanel,
        exportModalOpen,
        setExportModalOpen,
        shortcutsModalOpen,
        setShortcutsModalOpen,
        aiCopilotOpen,
        setAiCopilotOpen,
        recorderModalOpen,
        setRecorderModalOpen,
        showSafeZone,
        setShowSafeZone,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
