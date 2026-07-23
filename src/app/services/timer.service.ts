import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerInterval: any = null;

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

    this.timerInterval = setInterval(() => {
      this._elapsedSeconds.update(val => val + 1);

      // Check if target reached for audio & vibration alert (triggers once)
      if (this._elapsedSeconds() >= this._targetSeconds() && !this._hasPlayedAlert() && this._targetSeconds() > 0) {
        this._hasPlayedAlert.set(true);
        this.triggerAlert();
      }
    }, 1000);
  }

  pauseTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this._isActive.set(false);
    }
  }

  resumeTimer(): void {
    if (!this._isActive()) {
      this._isActive.set(true);
      this.timerInterval = setInterval(() => {
        this._elapsedSeconds.update(val => val + 1);

        if (this._elapsedSeconds() >= this._targetSeconds() && !this._hasPlayedAlert() && this._targetSeconds() > 0) {
          this._hasPlayedAlert.set(true);
          this.triggerAlert();
        }
      }, 1000);
    }
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this._isActive.set(false);
  }

  resetTimer(): void {
    this.stopTimer();
    this._elapsedSeconds.set(0);
    this._targetSeconds.set(0);
    this._hasPlayedAlert.set(false);
  }

  private triggerAlert(): void {
    // 1. Play synthetic high-quality audio chime
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        
        // Quadruple chime sequence for clear notification: 880Hz (A5), 1100Hz (C#6), 1320Hz (E6), 1760Hz (A6)
        const chime = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
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
  }
}
