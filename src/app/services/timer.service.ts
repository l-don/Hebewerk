import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerInterval: any = null;

  // Signals for state tracking
  private _timeLeft = signal<number>(0);
  readonly timeLeft = computed(() => this._timeLeft());

  private _duration = signal<number>(0);
  readonly duration = computed(() => this._duration());

  private _isActive = signal<boolean>(false);
  readonly isActive = computed(() => this._isActive());

  private _isCompleted = signal<boolean>(false);
  readonly isCompleted = computed(() => this._isCompleted());

  // Progress percentage (0 to 100)
  readonly progressPercent = computed(() => {
    if (this._duration() === 0) return 0;
    return Math.round(((this._duration() - this._timeLeft()) / this._duration()) * 100);
  });

  startTimer(seconds: number): void {
    this.stopTimer();

    this._duration.set(seconds);
    this._timeLeft.set(seconds);
    this._isActive.set(true);
    this._isCompleted.set(false);

    this.timerInterval = setInterval(() => {
      if (this._timeLeft() > 1) {
        this._timeLeft.update(val => val - 1);
      } else {
        this._timeLeft.set(0);
        this._isCompleted.set(true);
        this.stopTimer();
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
    if (!this._isActive() && this._timeLeft() > 0) {
      this._isActive.set(true);
      this.timerInterval = setInterval(() => {
        if (this._timeLeft() > 1) {
          this._timeLeft.update(val => val - 1);
        } else {
          this._timeLeft.set(0);
          this._isCompleted.set(true);
          this.stopTimer();
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
    this._timeLeft.set(0);
    this._duration.set(0);
    this._isCompleted.set(false);
  }

  private triggerAlert(): void {
    // 1. Play synthetic high-quality audio chime
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        
        // Triple chime sequence: 880Hz (A5), 1100Hz (C#6), 1320Hz (E6)
        const chime = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        const now = ctx.currentTime;
        chime(880, now, 0.25);
        chime(1100, now + 0.15, 0.25);
        chime(1320, now + 0.3, 0.45);
      }
    } catch (e) {
      console.warn('AudioContext chime failed to play', e);
    }

    // 2. Trigger browser vibration API (mobile devices)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150, 80, 200]);
      } catch (e) {
        console.warn('Vibration API not supported or blocked');
      }
    }
  }
}
