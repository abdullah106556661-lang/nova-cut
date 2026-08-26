import React, { useState } from "react";
import {
  LayoutTemplate,
  Search,
  ArrowRight,
  Filter,
  Play,
  Check,
  Video,
  Sparkles,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { VIDEO_TEMPLATES } from "../../data/templatesData";
import { VideoTemplate } from "../../types/editor";

export const TemplatesView: React.FC = () => {
  const { loadTemplate } = useEditor();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplate | null>(null);

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "tiktok", label: "TikTok & Reels (9:16)" },
    { id: "youtube", label: "YouTube (16:9)" },
    { id: "promo", label: "Product & Commercials" },
    { id: "cinematic", label: "Cinematic Film & Travel" },
  ];

  const filteredTemplates = VIDEO_TEMPLATES.filter((tpl) => {
    const matchCategory = selectedCategory === "all" || tpl.category === selectedCategory;
    const matchAspect = aspectFilter === "all" || tpl.aspectRatio === aspectFilter;
    const matchQuery =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchAspect && matchQuery;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
            <span>50+ Creator Ready Presets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Professional Video Templates
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick a pre-assembled timeline complete with animated hooks, music tracks, shaders, and text callouts.
          </p>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Ratio */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </div>

          <select
            value={aspectFilter}
            onChange={(e) => setAspectFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500"
          >
            <option value="all">All Ratios</option>
            <option value="16:9">16:9 Landscape</option>
            <option value="9:16">9:16 Vertical</option>
            <option value="1:1">1:1 Square</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            {/* Card Thumbnail Preview */}
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              <img
                src={tpl.thumbnailUrl}
                alt={tpl.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono font-bold">
                {tpl.aspectRatio} • {tpl.duration}s
              </div>

              {/* Tag pill */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
                {tpl.tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-black/60 backdrop-blur-sm text-slate-300 text-[9px] rounded font-semibold uppercase"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content & Action */}
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => loadTemplate(tpl)}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
                >
                  <span>Open in Video Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
