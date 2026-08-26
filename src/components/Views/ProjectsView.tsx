import React, { useState, useRef } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  Download,
  Copy,
  Trash2,
  Edit2,
  Video,
  Grid,
  List,
  Clock,
  Filter,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { useEditor } from "../../context/EditorContext";
import { VideoProject, AspectRatio } from "../../types/editor";

export const ProjectsView: React.FC = () => {
  const {
    projects,
    openProject,
    deleteProject,
    duplicateProject,
    renameProject,
    exportProjectJson,
    importProjectJson,
    createProject,
  } = useEditor();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRatio, setFilterRatio] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"updated" | "name" | "duration">("updated");

  // Rename modal state
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // New Project modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newName, setNewName] = useState("My Next Viral Video");
  const [newRatio, setNewRatio] = useState<AspectRatio>("16:9");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort projects
  const filteredProjects = projects
    .filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRatio = filterRatio === "all" || p.settings.aspectRatio === filterRatio;
      return matchQuery && matchRatio;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "duration") return b.settings.duration - a.settings.duration;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        importProjectJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isPortrait = newRatio === "9:16";
    createProject(
      {
        aspectRatio: newRatio,
        width: isPortrait ? 1080 : 1920,
        height: isPortrait ? 1920 : 1080,
        fps: 30,
        backgroundColor: "#080c14",
        duration: 15,
      },
      newName.trim() || "Untitled Project"
    );
    setNewModalOpen(false);
  };

  const startRename = (proj: VideoProject) => {
    setEditingProjId(proj.id);
    setEditingName(proj.name);
  };

  const saveRename = (projId: string) => {
    if (editingName.trim()) {
      renameProject(projId, editingName.trim());
    }
    setEditingProjId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-sky-400" />
            <span>Projects & Workspace</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your video productions, duplicate timelines, or import/export JSON backups.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleImportClick}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import JSON</span>
          </button>
          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Search, Filters & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aspect Ratio Filter */}
          <select
            value={filterRatio}
            onChange={(e) => setFilterRatio(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-sky-500 font-medium"
          >
            <option value="all">All Formats</option>
            <option value="16:9">16:9 Landscape (YouTube)</option>
            <option value="9:16">9:16 Vertical (TikTok/Reels)</option>
            <option value="1:1">1:1 Square (Instagram)</option>
            <option value="4:5">4:5 Portrait</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-sky-500 font-medium"
          >
            <option value="updated">Recently Updated</option>
            <option value="name">Project Name</option>
            <option value="duration">Timeline Duration</option>
          </select>

          {/* Grid / List toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-slate-800 text-sky-400" : "text-slate-500"}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-slate-800 text-sky-400" : "text-slate-500"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid / List View */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <Video className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? "Try refining your search query." : "Create your first video project to get started!"}
          </p>
          <button
            onClick={() => setNewModalOpen(true)}
            className="px-4 py-2 bg-sky-500 text-white font-bold text-xs rounded-xl"
          >
            Create New Project
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-sky-500/50 transition-all flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => openProject(proj.id)}
                className="relative aspect-video bg-slate-950 cursor-pointer overflow-hidden"
              >
                {proj.thumbnailUrl ? (
                  <img
                    src={proj.thumbnailUrl}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700">
                    <Video className="w-8 h-8" />
                  </div>
                )}

                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white font-mono font-bold">
                  {proj.settings.aspectRatio} • {proj.settings.duration}s
                </span>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 bg-sky-500 text-white font-bold text-xs rounded-xl shadow-lg">
                    Open in Studio
                  </span>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 space-y-3">
                {editingProjId === proj.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(proj.id)}
                      className="flex-1 bg-slate-950 border border-sky-500 rounded px-2 py-1 text-xs text-white outline-none"
                    />
                    <button
                      onClick={() => saveRename(proj.id)}
                      className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingProjId(null)}
                      className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      onClick={() => openProject(proj.id)}
                      className="font-bold text-slate-100 text-sm hover:text-sky-400 cursor-pointer truncate flex-1"
                    >
                      {proj.name}
                    </h3>
                    <button
                      onClick={() => startRename(proj)}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Modified {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{proj.tracks.length} tracks</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <button
                    onClick={() => openProject(proj.id)}
                    className="text-sky-400 hover:text-sky-300 font-bold"
                  >
                    Open Studio
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateProject(proj.id)}
                      title="Duplicate"
                      className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => exportProjectJson(proj.id)}
                      title="Export JSON"
                      className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => deleteProject(proj.id)}
                        title="Delete"
                        className="p-1.5 hover:text-red-400 hover:bg-red-950/40 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  onClick={() => openProject(proj.id)}
                  className="w-16 h-10 rounded bg-slate-950 overflow-hidden shrink-0 cursor-pointer border border-slate-800"
                >
                  {proj.thumbnailUrl ? (
                    <img src={proj.thumbnailUrl} alt={proj.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Video className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    onClick={() => openProject(proj.id)}
                    className="font-bold text-slate-200 text-xs sm:text-sm hover:text-sky-400 cursor-pointer truncate"
                  >
                    {proj.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {proj.settings.aspectRatio} • {proj.settings.duration}s • Updated{" "}
                    {new Date(proj.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openProject(proj.id)}
                  className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-white font-bold text-xs rounded-lg transition-all"
                >
                  Open
                </button>
                <button
                  onClick={() => duplicateProject(proj.id)}
                  title="Duplicate"
                  className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => exportProjectJson(proj.id)}
                  title="Export JSON"
                  className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <Download className="w-4 h-4" />
                </button>
                {projects.length > 1 && (
                  <button
                    onClick={() => deleteProject(proj.id)}
                    title="Delete"
                    className="p-1.5 hover:text-red-400 hover:bg-red-950/40 rounded-lg text-slate-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Project Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Video Project</h3>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Project Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Aspect Ratio / Canvas</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRatio("16:9")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRatio === "16:9"
                        ? "bg-sky-500/20 border-sky-500 text-sky-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">16:9 Landscape</p>
                    <p className="text-[10px] text-slate-400">1920x1080 (YouTube/Vlog)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRatio("9:16")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRatio === "9:16"
                        ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">9:16 Vertical</p>
                    <p className="text-[10px] text-slate-400">1080x1920 (TikTok/Reels)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRatio("1:1")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRatio === "1:1"
                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">1:1 Square</p>
                    <p className="text-[10px] text-slate-400">1080x1080 (Instagram)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRatio("4:5")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      newRatio === "4:5"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">4:5 Social Feed</p>
                    <p className="text-[10px] text-slate-400">1080x1350 (Portrait)</p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Create & Open in Studio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
