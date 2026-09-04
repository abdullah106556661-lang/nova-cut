import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAuth } from "../auth";
import { validateBody, projectSaveSchema } from "../middleware/validation";
import { sendError, sendSuccess } from "../utils/errors";

export const projectRouter = Router();

// Enforce authentication on all project operations
projectRouter.use(requireAuth);

// 1. GET ALL PROJECTS FOR CURRENT USER
projectRouter.get("/", (req: AuthenticatedRequest, res: Response) => {
  const projects = db.getUserProjects(req.user!.id);
  return sendSuccess(res, { projects });
});

// 2. GET SINGLE PROJECT BY ID
projectRouter.get("/:id", (req: AuthenticatedRequest, res: Response) => {
  const project = db.getProjectById(req.params.id, req.user!.id);
  if (!project) {
    return sendError(res, "Project not found or unauthorized access.", 404, "NOT_FOUND");
  }
  return sendSuccess(res, { project });
});

// 3. CREATE PROJECT
projectRouter.post("/", validateBody(projectSaveSchema), (req: AuthenticatedRequest, res: Response) => {
  const { title, description, aspectRatio = "16:9", resolution = "1080p", fps = 30, duration = 15, tracks = [], thumbnailUrl } = req.body;

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

  const userProjects = db.getUserProjects(req.user!.id);
  db.updateUser(req.user!.id, { projectsCount: userProjects.length });

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    eventType: "PROJECT_CREATE",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Created project "${saved.title}" (${saved.id})`,
  });

  return sendSuccess(res, { project: saved }, 201);
});

// 4. UPDATE EXISTING PROJECT
projectRouter.put("/:id", (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getProjectById(req.params.id, req.user!.id);
  if (!existing) {
    return sendError(res, "Project not found or access denied.", 404, "NOT_FOUND");
  }

  const { title, description, aspectRatio, resolution, fps, duration, tracks, thumbnailUrl } = req.body;

  const updated = db.saveProject({
    id: req.params.id,
    userId: req.user!.id,
    title: title !== undefined ? String(title).slice(0, 120) : existing.title,
    description: description !== undefined ? description : existing.description,
    aspectRatio: aspectRatio || existing.aspectRatio,
    resolution: resolution || existing.resolution,
    fps: fps || existing.fps,
    duration: duration !== undefined ? Number(duration) : existing.duration,
    tracks: tracks !== undefined ? tracks : existing.tracks,
    thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
  });

  return sendSuccess(res, { project: updated });
});

// 5. DUPLICATE PROJECT
projectRouter.post("/:id/duplicate", (req: AuthenticatedRequest, res: Response) => {
  const existing = db.getProjectById(req.params.id, req.user!.id);
  if (!existing) {
    return sendError(res, "Project not found.", 404, "NOT_FOUND");
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

  return sendSuccess(res, { project: duplicated }, 201);
});

// 6. DELETE PROJECT
projectRouter.delete("/:id", (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteProject(req.params.id, req.user!.id);
  if (!deleted) {
    return sendError(res, "Project not found or access denied.", 404, "NOT_FOUND");
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

  return sendSuccess(res, { message: "Project deleted successfully." });
});
