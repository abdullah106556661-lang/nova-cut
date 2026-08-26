import { VideoProject } from "../types/editor";

export class AudioMixer {
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  private previewAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 1.0;

  public playPreview(url: string) {
    this.stopPreview();
    try {
      this.previewAudio = new Audio(url);
      this.previewAudio.volume = this.masterVolume;
      this.previewAudio.play().catch(() => {});
    } catch {}
  }

  public stopPreview() {
    if (this.previewAudio) {
      this.previewAudio.pause();
      this.previewAudio = null;
    }
  }

  public playSoundEffect(url: string, volume = 1.0) {
    if (this.isMuted) return;
    try {
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, volume * this.masterVolume));
      audio.play().catch(() => {
        // Autoplay policy catch
      });
    } catch {
      // Audio play error ignore
    }
  }

  public registerAudioElement(id: string, el: HTMLAudioElement) {
    this.audioElements.set(id, el);
  }

  public unregisterAudioElement(id: string) {
    const el = this.audioElements.get(id);
    if (el) {
      el.pause();
      this.audioElements.delete(id);
    }
  }

  public syncProjectAudio(project: VideoProject, currentTime: number, isPlaying: boolean) {
    project.tracks.forEach((track) => {
      if (track.type !== "audio" && track.type !== "main") return;

      track.clips.forEach((clip) => {
        if (!clip.mediaUrl) return;

        let audio = this.audioElements.get(clip.id);
        if (!audio && (clip.type === "audio" || clip.type === "video")) {
          audio = new Audio(clip.mediaUrl);
          audio.preload = "auto";
          this.audioElements.set(clip.id, audio);
        }

        if (!audio) return;

        const isClipActive =
          currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration;

        if (isClipActive && isPlaying && !track.isMuted && !this.isMuted) {
          const clipRelTime = currentTime - clip.startTime;
          const targetSourceTime = clip.sourceStartTime + clipRelTime * clip.speed;

          // Sync playback position if drift exceeds 0.2s
          if (Math.abs(audio.currentTime - targetSourceTime) > 0.2) {
            audio.currentTime = targetSourceTime;
          }

          // Calculate Fade In / Fade Out volume
          let vol = (clip.audioProps?.volume ?? 1) * track.volume * this.masterVolume;
          if (clip.audioProps?.fadeIn && clipRelTime < clip.audioProps.fadeIn) {
            vol *= clipRelTime / clip.audioProps.fadeIn;
          }
          const timeFromEnd = clip.duration - clipRelTime;
          if (clip.audioProps?.fadeOut && timeFromEnd < clip.audioProps.fadeOut) {
            vol *= timeFromEnd / clip.audioProps.fadeOut;
          }

          audio.volume = Math.max(0, Math.min(1, vol));

          if (audio.paused) {
            audio.play().catch(() => {});
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
        }
      });
    });
  }

  public pauseAll() {
    this.audioElements.forEach((audio) => {
      audio.pause();
    });
  }

  public setMasterMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.pauseAll();
    }
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }
}

export const globalAudioMixer = new AudioMixer();
