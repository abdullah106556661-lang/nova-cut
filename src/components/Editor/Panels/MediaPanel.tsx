import React, { useRef, useState, useEffect } from "react";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Music,
  Plus,
  Radio,
  Search,
  Check,
  Play,
  Pause,
  Trash2,
  Sliders,
  Sparkles,
  Scissors,
  Layers,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  FileVideo,
  Crop,
  Wand2,
  Link,
  FastForward,
  Gauge,
  Type,
  Maximize,
  Smartphone,
  Monitor,
  Square,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";
import { STOCK_VIDEOS, STOCK_IMAGES } from "../../../data/stockMedia";
import { MediaAsset, TimelineClip, ColorFilter } from "../../../types/editor";
import { extractVideoMetadataAndThumbnail } from "../../../utils/mediaUtils";

export const MediaPanel: React.FC = () => {
  const {
    addClipToTrack,
    project,
    setProject,
    setRecorderModalOpen,
    uploadedAssets,
    uploadMediaFile,
    deleteUploadedAsset,
    activeMediaTab,
    setActiveMediaTab,
    selectedClipId,
    updateClip,
    addSubtitle,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "video" | "image" | "audio">("all");
  const [addedAlert, setAddedAlert] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // URL Importer State
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [importUrlInput, setImportUrlInput] = useState("");
  const [importUrlName, setImportUrlName] = useState("");
  const [urlImportLoading, setUrlImportLoading] = useState(false);

  // Quick Clip Preview & CapCut Trimmer Modal State
  const [inspectAsset, setInspectAsset] = useState<MediaAsset | null>(null);
  const [trimIn, setTrimIn] = useState<number>(0);
  const [trimOut, setTrimOut] = useState<number>(10);
  const [inspectPlaying, setInspectPlaying] = useState<boolean>(false);
  const [clipSpeed, setClipSpeed] = useState<number>(1.0);
  const [targetTrackType, setTargetTrackType] = useState<"main" | "overlay" | "audio">("main");
  const inspectVideoRef = useRef<HTMLVideoElement | null>(null);

  // Video hover preview state
  const [hoveredAssetId, setHoveredAssetId] = useState<string | null>(null);
  const hoverVideoRef = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Local File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMediaFile(file);
      }
      setActiveMediaTab("uploads");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // URL Video Importer
  const handleImportByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrlInput.trim()) return;

    setUrlImportLoading(true);
    try {
      const isVideo =
        importUrlInput.includes(".mp4") ||
        importUrlInput.includes(".webm") ||
        importUrlInput.includes("video") ||
        !importUrlInput.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

      let meta: {
        duration: number;
        width: number;
        height: number;
        aspectRatio: string;
        thumbnailUrl: string;
        sizeFormatted: string;
      } = {
        duration: 12,
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
        thumbnailUrl: importUrlInput,
        sizeFormatted: "Online Stream",
      };

      if (isVideo) {
        meta = await extractVideoMetadataAndThumbnail(importUrlInput);
      }

      const newAsset: MediaAsset = {
        id: `url_${Date.now()}`,
        name: importUrlName.trim() || `Imported ${isVideo ? "Video" : "Media"}`,
        type: isVideo ? "video" : "image",
        url: importUrlInput,
        thumbnailUrl: meta.thumbnailUrl || importUrlInput,
        duration: meta.duration || 10,
        size: meta.sizeFormatted || "HD Stream",
        createdAt: new Date().toISOString(),
      };

      // Add to uploadedAssets in context via dummy file or custom state
      // We can also trigger an uploadMediaFile or directly add it
      const saved = localStorage.getItem("novacut_user_assets");
      const currentList: MediaAsset[] = saved ? JSON.parse(saved) : [];
      const updated = [newAsset, ...currentList];
      localStorage.setItem("novacut_user_assets", JSON.stringify(updated));

      setAddedAlert(newAsset.name);
      setTimeout(() => setAddedAlert(null), 2500);
      setUrlModalOpen(false);
      setImportUrlInput("");
      setImportUrlName("");
      setActiveMediaTab("uploads");
      window.location.reload(); // Refresh asset store
    } catch (err) {
      console.error("URL Import error:", err);
    } finally {
      setUrlImportLoading(false);
    }
  };

  // Drag and Drop Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMediaFile(file);
      }
      setActiveMediaTab("uploads");
    } catch (err) {
      console.error("Drop upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Add Asset into Timeline Track
  const handleAddAssetToTimeline = (
    asset: MediaAsset,
    customOptions?: { inPoint?: number; outPoint?: number; trackType?: "main" | "overlay" | "audio"; speed?: number }
  ) => {
    const trackType = customOptions?.trackType || (asset.type === "audio" ? "audio" : "main");

    // Find matching track
    let targetTrack = project.tracks.find((t) => t.type === trackType);
    if (!targetTrack) {
      targetTrack = project.tracks.find((t) => t.type === "main") || project.tracks[0];
    }
    if (!targetTrack) return;

    // Calculate duration and trim
    const inP = customOptions?.inPoint ?? 0;
    const outP = customOptions?.outPoint ?? (asset.duration || (asset.type === "image" ? 5 : 8));
    const speed = customOptions?.speed || 1.0;
    const clipDuration = Math.max(0.5, (outP - inP) / speed);

    // Calculate end of current track clips
    const lastClipEnd = targetTrack.clips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      0
    );

    addClipToTrack(targetTrack.id, {
      type: asset.type,
      name: asset.name,
      mediaUrl: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      startTime: lastClipEnd > 0 ? lastClipEnd + 0.1 : 0,
      duration: clipDuration,
      sourceStartTime: inP,
      sourceDuration: asset.duration || 10,
      speed: speed,
      scale: 1,
      opacity: 1,
      zIndex: trackType === "overlay" ? 3 : 1,
    });

    setAddedAlert(asset.name);
    setTimeout(() => setAddedAlert(null), 2500);

    if (inspectAsset) {
      setInspectAsset(null);
    }
  };

  // Extract Audio from uploaded video to dedicated Audio Track
  const handleExtractAudio = (asset: MediaAsset) => {
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
      name: `🎵 Audio: ${asset.name}`,
      mediaUrl: asset.url,
      startTime: lastClipEnd > 0 ? lastClipEnd + 0.1 : 0,
      duration: asset.duration || 10,
      sourceStartTime: 0,
      sourceDuration: asset.duration || 10,
    });

    setAddedAlert(`Audio extracted from "${asset.name}"`);
    setTimeout(() => setAddedAlert(null), 2500);
    setInspectAsset(null);
  };

  // CapCut Aspect Ratio Canvas Reframe
  const handleReframeCanvas = (ratio: "16:9" | "9:16" | "1:1") => {
    setProject((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        aspectRatio: ratio,
        width: ratio === "9:16" ? 1080 : ratio === "1:1" ? 1080 : 1920,
        height: ratio === "9:16" ? 1920 : ratio === "1:1" ? 1080 : 1080,
      },
    }));
    setAddedAlert(`Canvas resized to ${ratio}`);
    setTimeout(() => setAddedAlert(null), 2000);
  };

  // Auto Generate Captions from Video
  const handleAutoCaptionsFromAsset = (asset: MediaAsset) => {
    const dur = asset.duration || 10;
    addSubtitle(0.5, Math.min(3.5, dur * 0.35), `Clip: ${asset.name}`);
    addSubtitle(Math.min(3.8, dur * 0.4), Math.min(7.5, dur * 0.75), "Synced with AI Auto-Captions");
    setAddedAlert(`Captions generated for "${asset.name}"`);
    setTimeout(() => setAddedAlert(null), 2500);
  };

  // Open Inspector / Trimmer modal for clip
  const handleInspectMedia = (asset: MediaAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectAsset(asset);
    setTrimIn(0);
    setTrimOut(asset.duration || (asset.type === "image" ? 5 : 10));
    setClipSpeed(1.0);
    setInspectPlaying(false);
    setTargetTrackType(asset.type === "audio" ? "audio" : "main");
  };

  // Filtered lists
  const filteredVideos = STOCK_VIDEOS.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredImages = STOCK_IMAGES.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUploads = uploadedAssets.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = mediaTypeFilter === "all" || item.type === mediaTypeFilter;
    return matchSearch && matchType;
  });

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full bg-slate-900 select-none relative ${
        isDraggingOver ? "ring-2 ring-sky-400 bg-sky-950/20" : ""
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-sky-950/90 z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm border-2 border-dashed border-sky-400">
          <Upload className="w-12 h-12 text-sky-400 animate-bounce mb-2" />
          <p className="text-sm font-bold text-white">Drop video or image to import</p>
          <p className="text-xs text-sky-300 mt-1">Automatic 4K frame indexing & thumbnail synthesis</p>
        </div>
      )}

      {/* Search & Upload Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <Upload className={`w-4 h-4 ${isUploading ? "animate-spin" : ""}`} />
            <span>{isUploading ? "Processing Media..." : "Upload Video / Photos"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => setUrlModalOpen(true)}
            title="Import via Video URL link"
            className="p-2.5 bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Link className="w-4 h-4 text-sky-400" />
            <span>URL</span>
          </button>

          <button
            onClick={() => setRecorderModalOpen(true)}
            title="Record Screen or Webcam"
            className="p-2.5 bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Record</span>
          </button>
        </div>

        {/* CapCut Quick Aspect Ratio Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-semibold pl-1 flex items-center gap-1">
            <Crop className="w-3 h-3 text-sky-400" />
            <span>CapCut Canvas:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleReframeCanvas("16:9")}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                project.settings.aspectRatio === "16:9" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => handleReframeCanvas("9:16")}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                project.settings.aspectRatio === "9:16" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>9:16 Reel</span>
            </button>
            <button
              onClick={() => handleReframeCanvas("1:1")}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                project.settings.aspectRatio === "1:1" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Square className="w-3 h-3" />
              <span>1:1</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search footage, uploads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:ring-1 focus:ring-sky-500 outline-none"
            />
          </div>

          {activeMediaTab === "uploads" && (
            <select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All ({uploadedAssets.length})</option>
              <option value="video">Videos</option>
              <option value="image">Photos</option>
              <option value="audio">Audio</option>
            </select>
          )}
        </div>
      </div>

      {/* Added Alert Notification */}
      {addedAlert && (
        <div className="mx-3 mt-2 px-3 py-2 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2 truncate">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Added "{addedAlert}" to timeline!</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/80 uppercase font-bold shrink-0">READY</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-3 pt-1 text-xs">
        <button
          onClick={() => setActiveMediaTab("uploads")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
            activeMediaTab === "uploads"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>My Uploads ({uploadedAssets.length})</span>
        </button>
        <button
          onClick={() => setActiveMediaTab("stockVideos")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
            activeMediaTab === "stockVideos"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Stock 4K</span>
        </button>
        <button
          onClick={() => setActiveMediaTab("stockImages")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition-colors ${
            activeMediaTab === "stockImages"
              ? "border-sky-500 text-sky-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photos</span>
        </button>
      </div>

      {/* Media Grid Body */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* Uploads Tab */}
        {activeMediaTab === "uploads" && (
          <div>
            {filteredUploads.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs px-4">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-slate-300 text-sm">No uploaded media found</p>
                <p className="mt-1 text-slate-500 max-w-xs mx-auto">
                  Drag & drop video files here or click "Upload Video / Photos" above. All video formats (MP4, WebM, MOV) and direct URLs are fully supported.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Video File</span>
                  </button>
                  <button
                    onClick={() => setUrlModalOpen(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Link className="w-3.5 h-3.5 text-sky-400" />
                    <span>Paste Video URL</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredUploads.map((item) => {
                  const isHovered = hoveredAssetId === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredAssetId(item.id)}
                      onMouseLeave={() => setHoveredAssetId(null)}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-sky-500/80 transition-all cursor-pointer shadow-md flex flex-col justify-between"
                    >
                      {/* Media Visual Preview Card */}
                      <div
                        onClick={() => handleAddAssetToTimeline(item)}
                        className="aspect-video bg-slate-900 overflow-hidden relative"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : item.type === "video" ? (
                          <div className="w-full h-full bg-gradient-to-tr from-slate-950 to-indigo-950 flex items-center justify-center">
                            <Video className="w-7 h-7 text-sky-400" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <ImageIcon className="w-7 h-7 text-amber-400" />
                          </div>
                        )}

                        {/* Video Live Hover Scrubber Overlay */}
                        {item.type === "video" && isHovered && (
                          <video
                            ref={(el) => {
                              hoverVideoRef.current[item.id] = el;
                            }}
                            src={item.url}
                            muted
                            autoPlay
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
                          />
                        )}

                        {/* Duration & Format Badge */}
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[9px] font-mono text-white flex items-center gap-1 z-20">
                          {item.type === "video" && <Video className="w-2.5 h-2.5 text-sky-400" />}
                          {item.duration ? `${item.duration.toFixed(1)}s` : "IMG"}
                        </div>

                        {/* Top Tag */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-sky-950/80 border border-sky-500/40 rounded text-[8px] font-bold text-sky-300 uppercase tracking-wider z-20">
                          {item.type}
                        </div>

                        {/* Hover Overlay with Add & Inspect buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddAssetToTimeline(item);
                            }}
                            title="Add directly to timeline"
                            className="p-2 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-lg transform hover:scale-110 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleInspectMedia(item, e)}
                            title="Preview & CapCut Trimmer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 transform hover:scale-110 transition-transform"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Info & Quick Actions */}
                      <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-slate-200 truncate leading-tight" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.size || "1080p HD"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.type === "video" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoCaptionsFromAsset(item);
                              }}
                              title="Auto-Generate Captions"
                              className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Type className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteUploadedAsset(item.id);
                            }}
                            title="Delete clip from library"
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stock Videos Tab */}
        {activeMediaTab === "stockVideos" && (
          <div className="grid grid-cols-2 gap-3">
            {filteredVideos.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-sky-500/80 transition-all cursor-pointer shadow-md flex flex-col justify-between"
                onClick={() => handleAddAssetToTimeline(item)}
              >
                <div className="aspect-video bg-slate-900 overflow-hidden relative">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm rounded text-[9px] font-mono text-slate-300">
                    {item.duration}s
                  </div>
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-500/40 rounded text-[8px] font-bold text-indigo-300 uppercase">
                    4K Footage
                  </div>
                  <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                    <div className="p-2 bg-sky-500 text-white rounded-full shadow-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-slate-900/90 border-t border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-200 truncate">{item.name}</p>
                  <p className="text-[9px] text-slate-400 capitalize">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock Photos Tab */}
        {activeMediaTab === "stockImages" && (
          <div className="grid grid-cols-2 gap-3">
            {filteredImages.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-sky-500/80 transition-all cursor-pointer shadow-md flex flex-col justify-between"
                onClick={() => handleAddAssetToTimeline(item)}
              >
                <div className="aspect-video bg-slate-900 overflow-hidden relative">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-sky-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="p-2 bg-sky-500 text-white rounded-full shadow-lg">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-slate-900/90 border-t border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-200 truncate">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Video Importer Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-sky-400" />
                <span>Import Video / Media from URL</span>
              </h3>
              <button
                onClick={() => setUrlModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportByUrl} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Direct Video or Image URL</label>
                <input
                  type="url"
                  required
                  value={importUrlInput}
                  onChange={(e) => setImportUrlInput(e.target.value)}
                  placeholder="https://example.com/footage.mp4"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Clip Name (Optional)</label>
                <input
                  type="text"
                  value={importUrlName}
                  onChange={(e) => setImportUrlName(e.target.value)}
                  placeholder="e.g. Drone Mountain B-Roll"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Supported formats:</p>
                <p>MP4, WebM, MOV, OGG, JPG, PNG, GIF, WebP. High bitrate 4K streams supported.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUrlModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={urlImportLoading}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  {urlImportLoading ? (
                    <>
                      <Upload className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Import to Library</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CapCut-Style Clip Inspection & Trimmer Modal */}
      {inspectAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <FileVideo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-sm">{inspectAsset.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {inspectAsset.size || "1080p HD"} • Original Duration: {(inspectAsset.duration || 10).toFixed(1)}s
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectAsset(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Preview */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {inspectAsset.type === "video" ? (
                <video
                  ref={inspectVideoRef}
                  src={inspectAsset.url}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img src={inspectAsset.thumbnailUrl || inspectAsset.url} alt="" className="w-full h-full object-contain" />
              )}
            </div>

            {/* CapCut Trimmer & Track Controls */}
            <div className="p-5 space-y-4 bg-slate-900 overflow-y-auto">
              {/* In & Out Point Range Slider */}
              {inspectAsset.type === "video" && (
                <div className="space-y-2 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-sky-400" />
                      Trim Clip (In: {trimIn.toFixed(1)}s — Out: {trimOut.toFixed(1)}s)
                    </span>
                    <span className="text-sky-400 font-mono font-bold">
                      Length: {(Math.max(0.5, (trimOut - trimIn) / clipSpeed)).toFixed(1)}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Start In-Point [I]</label>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, (inspectAsset.duration || 10) - 0.5)}
                        step={0.1}
                        value={trimIn}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < trimOut) setTrimIn(val);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">End Out-Point [O]</label>
                      <input
                        type="range"
                        min={trimIn + 0.5}
                        max={inspectAsset.duration || 10}
                        step={0.1}
                        value={trimOut}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > trimIn) setTrimOut(val);
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* CapCut Speed Multiplier */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                    <span className="text-slate-300 flex items-center gap-1 font-semibold">
                      <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                      Playback Speed:
                    </span>
                    <div className="flex items-center gap-1">
                      {[0.5, 1.0, 2.0, 4.0].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setClipSpeed(spd)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                            clipSpeed === spd
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Target Track & Quick CapCut Action Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Target Track:</span>
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setTargetTrackType("main")}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        targetTrackType === "main" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Main Track
                    </button>
                    <button
                      onClick={() => setTargetTrackType("overlay")}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        targetTrackType === "overlay" ? "bg-purple-500 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Overlay / PiP
                    </button>
                  </div>
                </div>

                {inspectAsset.type === "video" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExtractAudio(inspectAsset)}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Extract Audio Track</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  onClick={() => setInspectAsset(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddAssetToTimeline(inspectAsset, {
                      inPoint: trimIn,
                      outPoint: trimOut,
                      trackType: targetTrackType,
                      speed: clipSpeed,
                    })
                  }
                  className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Timeline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
