import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerInterval: any = null;
  private startTimeMs: number = 0;
  private pausedAccumulatedMs: number = 0;

  // Signals for state tracking
  private _elapsedSeconds = signal<number>(0);
  readonly elapsedSeconds = computed(() => this._elapsedSeconds());

  private _targetSeconds = signal<number>(0);
  readonly targetSeconds = computed(() => this._targetSeconds());

  private _isActive = signal<boolean>(false);
  readonly isActive = computed(() => this._isActive());

  private _hasPlayedAlert = signal<boolean>(false);
  
  readonly isTargetReached = computed(() => {
    return this._targetSeconds() > 0 && this._elapsedSeconds() >= this._targetSeconds();
  });

  // Backward compatibility aliases
  readonly isCompleted = computed(() => this.isTargetReached());
  readonly timeLeft = computed(() => Math.max(0, this._targetSeconds() - this._elapsedSeconds()));
  readonly duration = computed(() => this._targetSeconds());

  // Formatted strings: 0s -> 59s, 60s -> 1:00, 75s -> 1:15, 125s -> 2:05
  readonly formattedElapsed = computed(() => this.formatTime(this._elapsedSeconds()));
  readonly formattedTarget = computed(() => this.formatTime(this._targetSeconds()));

  // Progress percentage (0 to 100)
  readonly progressPercent = computed(() => {
    if (this._targetSeconds() === 0) return 0;
    return Math.min(100, Math.round((this._elapsedSeconds() / this._targetSeconds()) * 100));
  });

  constructor() {
    // Listen for tab focus / screen unlock events to instantly sync real elapsed time
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.syncTime());
      window.addEventListener('focus', () => this.syncTime());
      window.addEventListener('pageshow', () => this.syncTime());
    }

    // Request notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    return `${mins}:${remSecs.toString().padStart(2, '0')}`;
  }

  startTimer(seconds: number): void {
    this.stopTimer();

    this._targetSeconds.set(seconds);
    this._elapsedSeconds.set(0);
    this._hasPlayedAlert.set(false);
    this._isActive.set(true);

    this.startTimeMs = Date.now();
    this.pausedAccumulatedMs = 0;

    this.startInterval();
  }

  pauseTimer(): void {
    if (this._isActive()) {
      this.syncTime();
      this.stopInterval();
      this.pausedAccumulatedMs = this._elapsedSeconds() * 1000;
      this._isActive.set(false);
    }
  }

  resumeTimer(): void {
    if (!this._isActive()) {
      this.startTimeMs = Date.now() - this.pausedAccumulatedMs;
      this._isActive.set(true);
      this.startInterval();
    }
  }

  stopTimer(): void {
    this.stopInterval();
    this._isActive.set(false);
  }

  resetTimer(): void {
    this.stopTimer();
    this._elapsedSeconds.set(0);
    this._targetSeconds.set(0);
    this._hasPlayedAlert.set(false);
    this.startTimeMs = 0;
    this.pausedAccumulatedMs = 0;
  }

  private startInterval(): void {
    this.stopInterval();
    this.timerInterval = setInterval(() => {
      this.syncTime();
    }, 500);
  }

  private stopInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private syncTime(): void {
    if (!this._isActive()) return;

    const realElapsedMs = Date.now() - this.startTimeMs;
    const realElapsedSecs = Math.max(0, Math.floor(realElapsedMs / 1000));

    this._elapsedSeconds.set(realElapsedSecs);

    // Check if target reached for audio & vibration alert (triggers once)
    if (realElapsedSecs >= this._targetSeconds() && !this._hasPlayedAlert() && this._targetSeconds() > 0) {
      this._hasPlayedAlert.set(true);
      this.triggerAlert();
    }
  }

  private triggerAlert(): void {
    // 1. Play synthetic high-quality audio chime
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        
        const chime = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.25, startTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        chime(880, now, 0.2);
        chime(1100, now + 0.12, 0.2);
        chime(1320, now + 0.24, 0.2);
        chime(1760, now + 0.36, 0.5);
      }
    } catch (e) {
      console.warn('AudioContext chime failed to play', e);
    }

    // 2. Trigger browser vibration API (mobile devices)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (e) {
        console.warn('Vibration API not supported or blocked');
      }
    }

    // 3. Web Push Notification (works even when phone was locked/unlocked)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Satzpause beendet! 🎉', {
          body: `Deine Pause von ${this.formattedTarget()} ist abgelaufen. Zeit für den nächsten Satz!`,
          icon: 'assets/icons/Time-Clock-Circle-1--Streamline-Freehand.png'
        });
      } catch (e) {
        console.warn('Browser Notification failed', e);
      }
    }
  }
}
