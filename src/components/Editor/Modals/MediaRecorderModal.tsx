import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Radio,
  Monitor,
  Camera,
  Mic,
  StopCircle,
  Play,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useEditor } from "../../../context/EditorContext";

export const MediaRecorderModal: React.FC = () => {
  const { recorderModalOpen, setRecorderModalOpen, addClipToTrack, project } = useEditor();

  const [recordMode, setRecordMode] = useState<"screen" | "camera">("camera");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!recorderModalOpen) {
      stopStream();
      setRecordedBlob(null);
      setPreviewUrl(null);
      setIsRecording(false);
    }
  }, [recorderModalOpen]);

  const stopStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startStream = async (mode: "screen" | "camera") => {
    stopStream();
    setErrorMsg(null);
    try {
      let stream: MediaStream;
      if (mode === "screen") {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }
      mediaStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Camera/Screen access was denied or is not supported in this environment.");
    }
  };

  const startRecording = async () => {
    if (!mediaStreamRef.current) {
      await startStream(recordMode);
    }
    if (!mediaStreamRef.current) return;

    chunksRef.current = [];
    const mr = new MediaRecorder(mediaStreamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopStream();
    };

    mediaRecorderRef.current = mr;
    mr.start(100);
    setIsRecording(true);
    setRecordDuration(0);

    timerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAddToTimeline = () => {
    if (!previewUrl) return;

    let targetTrack = project.tracks.find((t) => t.type === "main");
    if (!targetTrack) targetTrack = project.tracks[0];
    if (!targetTrack) return;

    addClipToTrack(targetTrack.id, {
      type: "video",
      name: `Recording (${recordMode})`,
      mediaUrl: previewUrl,
      startTime: 0,
      duration: Math.max(1, recordDuration),
      sourceDuration: Math.max(1, recordDuration),
    });

    setRecorderModalOpen(false);
  };

  if (!recorderModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Studio Recorder (Webcam & Screen)
            </h3>
          </div>
          <button
            onClick={() => setRecorderModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Mode Selector */}
          {!isRecording && !previewUrl && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setRecordMode("camera");
                  startStream("camera");
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  recordMode === "camera"
                    ? "bg-rose-500/20 border-rose-500 text-rose-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Webcam Recording</span>
              </button>

              <button
                onClick={() => {
                  setRecordMode("screen");
                  startStream("screen");
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  recordMode === "screen"
                    ? "bg-rose-500/20 border-rose-500 text-rose-300 font-bold"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Screen Capture</span>
              </button>
            </div>
          )}

          {/* Video Preview Box */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
            {previewUrl ? (
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            ) : (
              <video
                ref={videoPreviewRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}

            {isRecording && (
              <div className="absolute top-3 right-3 px-3 py-1 bg-red-600/90 text-white rounded-full font-mono font-bold text-xs flex items-center gap-2 shadow-lg animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>REC {recordDuration}s</span>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setRecorderModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>

          {!previewUrl ? (
            isRecording ? (
              <button
                onClick={stopRecording}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop Recording</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-600/30 flex items-center gap-2"
              >
                <Radio className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            )
          ) : (
            <button
              onClick={handleAddToTimeline}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recording to Timeline</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
