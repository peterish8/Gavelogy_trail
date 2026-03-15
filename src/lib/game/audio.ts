/**
 * Singleton Audio Manager for Game Arena
 * Handles all SFX + background music with global mute control.
 * React-safe: singleton prevents duplicate instances on remount.
 */

class GameAudioManager {
  private static instance: GameAudioManager;
  private muted: boolean = false;
  private bgMusic: HTMLAudioElement | null = null;
  private sfxCache: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    // Load mute preference
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('gavelogy-audio-muted') === 'true';
    }
  }

  static getInstance(): GameAudioManager {
    if (!GameAudioManager.instance) {
      GameAudioManager.instance = new GameAudioManager();
    }
    return GameAudioManager.instance;
  }

  // ─── MUTE CONTROL ─────────────────────────

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gavelogy-audio-muted', String(muted));
    }
    if (muted && this.bgMusic) {
      this.bgMusic.pause();
    } else if (!muted && this.bgMusic) {
      this.bgMusic.play().catch(() => {});
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ─── SFX ───────────────────────────────────

  private getSfx(path: string): HTMLAudioElement {
    if (!this.sfxCache.has(path)) {
      const audio = new Audio(path);
      audio.volume = 0.5;
      this.sfxCache.set(path, audio);
    }
    return this.sfxCache.get(path)!;
  }

  private playSfx(path: string, volume: number = 0.5): void {
    if (this.muted || typeof window === 'undefined') return;
    try {
      const audio = this.getSfx(path);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      // Silently fail if audio not available
    }
  }

  playClick(): void        { this.playSfx('/sounds/click.mp3', 0.3); }
  playCorrect(): void      { this.playSfx('/sounds/correct.mp3', 0.5); }
  playWrong(): void        { this.playSfx('/sounds/wrong.mp3', 0.4); }
  playWin(): void          { this.playSfx('/sounds/win.mp3', 0.6); }
  playLose(): void         { this.playSfx('/sounds/lose.mp3', 0.5); }
  playCountdown(): void    { this.playSfx('/sounds/countdown.mp3', 0.4); }
  playLevelUp(): void      { this.playSfx('/sounds/levelup.mp3', 0.7); }
  playEliminated(): void   { this.playSfx('/sounds/eliminated.mp3', 0.6); }
  playSelect(): void       { this.playSfx('/sounds/select.mp3', 0.3); }

  // ─── BACKGROUND MUSIC ─────────────────────

  startBgMusic(path: string = '/sounds/bg-arena.mp3'): void {
    if (this.muted || typeof window === 'undefined') return;
    
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
    
    this.bgMusic = new Audio(path);
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.15;
    this.bgMusic.play().catch(() => {});
  }

  stopBgMusic(): void {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
      this.bgMusic = null;
    }
  }

  // ─── CLEANUP ──────────────────────────────

  destroy(): void {
    this.stopBgMusic();
    this.sfxCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.sfxCache.clear();
  }
}

// Export singleton getter
export const gameAudio = typeof window !== 'undefined' 
  ? GameAudioManager.getInstance() 
  : null;

export type { GameAudioManager };
