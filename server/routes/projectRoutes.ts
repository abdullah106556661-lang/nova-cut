import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAuth } from "../auth";

export const projectRouter = Router();

// Enforce authentication on all project operations
projectRouter.use(requireAuth);

// 1. GET ALL PROJECTS FOR CURRENT USER
projectRouter.get("/", (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getUserProjects(req.user!.id);
  res.json({ projects });
});

// 2. GET SINGLE PROJECT BY ID
projectRouter.get("/:id", (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id, req.user!.id);
  if (!project) {
    return res.status(404).json({ error: "Project not found or unauthorized access." });
  }
  res.json({ project });
});

// 3. CREATE OR AUTOSAVE PROJECT
projectRouter.post("/", (req: AuthenticatedRequest, res: Response) => {
  const { title, description, aspectRatio = "16:9", resolution = "1080p", fps = 30, duration = 15, tracks = [], thumbnailUrl } = req.body;

  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Project title is required." });
  }

  const saved = db.saveProject({
    userId: req.user!.id,
    title: title.slice(0, 120),
    description,
    aspectRatio,
    resolution,
    fps,
    duration,
    tracks,
    thumbnailUrl,
  });

  // Update projects count on user record
  const userProjects = db.getUserProjects(req.user!.id);
  db.updateUser(req.user!.id, { projectsCount: userProjects.length });

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    eventType: "PROJECT_CREATE",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Created new project "${saved.title}" (ID: ${saved.id})`,
  });

  res.json({ success: true, project: saved });
});

// 4. UPDATE EXISTING PROJECT
projectRouter.put("/:id", (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getProjectById(req.params.id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: "Project not found or access denied." });
  }

  const { title, description, aspectRatio, resolution, fps, duration, tracks, thumbnailUrl } = req.body;

  const updated = db.saveProject({
    id: req.params.id,
    userId: req.user!.id,
    title: title !== undefined ? title.slice(0, 120) : existing.title,
    description: description !== undefined ? description : existing.description,
    aspectRatio: aspectRatio || existing.aspectRatio,
    resolution: resolution || existing.resolution,
    fps: fps || existing.fps,
    duration: duration !== undefined ? duration : existing.duration,
    tracks: tracks !== undefined ? tracks : existing.tracks,
    thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
  });

  res.json({ success: true, project: updated });
});

// 5. DUPLICATE PROJECT
projectRouter.post("/:id/duplicate", (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getProjectById(req.params.id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: "Project not found." });
  }

  const duplicated = db.saveProject({
    userId: req.user!.id,
    title: `${existing.title} (Copy)`,
    description: existing.description,
    aspectRatio: existing.aspectRatio,
    resolution: existing.resolution,
    fps: existing.fps,
    duration: existing.duration,
    tracks: JSON.parse(JSON.stringify(existing.tracks || [])),
    thumbnailUrl: existing.thumbnailUrl,
  });

  const userProjects = db.getUserProjects(req.user!.id);
  db.updateUser(req.user!.id, { projectsCount: userProjects.length });

  res.json({ success: true, project: duplicated });
});

// 6. DELETE PROJECT
projectRouter.delete("/:id", (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteProject(req.params.id, req.user!.id);
  if (!deleted) {
    return res.status(404).json({ error: "Project not found or access denied." });
  }

  const userProjects = db.getUserProjects(req.user!.id);
  db.updateUser(req.user!.id, { projectsCount: userProjects.length });

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    eventType: "PROJECT_DELETE",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Deleted project ${req.params.id}`,
  });

  res.json({ success: true, message: "Project deleted successfully." });
});
