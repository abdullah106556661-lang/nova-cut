import { VideoProject } from "../types/editor";
import { VIDEO_TEMPLATES } from "./templatesData";

export const DEFAULT_STARTER_PROJECT: VideoProject = {
  id: "proj_starter_demo",
  name: "My First Cinematic Edit",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  thumbnailUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80",
  settings: {
    aspectRatio: "16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: "#080c14",
    duration: 14.5,
  },
  tracks: JSON.parse(JSON.stringify(VIDEO_TEMPLATES[1].projectData.tracks || [])),
  subtitles: [
    { id: "sub_1", startTime: 1.0, endTime: 4.5, text: "Welcome to NovaCut Studio 2026." },
    { id: "sub_2", startTime: 5.0, endTime: 9.0, text: "Multi-track video editing right inside your browser." },
    { id: "sub_3", startTime: 9.5, endTime: 14.0, text: "Export in 1080p, add AI captions, or apply cyber glitch filters." },
  ],
  markers: [1.0, 5.0, 9.5],
};
