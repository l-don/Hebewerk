import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { TimerService } from '../../services/timer.service';
import { WorkoutPlan, WorkoutLog, LoggedExercise, LoggedSet } from '../../models/gym.models';

interface ActiveSet {
  reps: number;
  weight: number;
  targetReps: number;
  targetWeight: number;
  restSeconds: number;
  completed: boolean;
  isPR?: boolean;
}

interface ActiveExercise {
  name: string;
  sets: ActiveSet[];
}

@Component({
  selector: 'app-workout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 md:p-8 max-w-3xl mx-auto space-y-6 relative min-h-screen">
      
      <!-- Ambient background glows -->
      <div class="absolute top-10 left-10 w-60 h-60 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-20 right-10 w-60 h-60 bg-neon-mint/5 rounded-full blur-3xl pointer-events-none"></div>

      @if (!workoutCompleted()) {
        <!-- ACTIVE WORKOUT PANEL -->
        
        <!-- Header -->
        <div class="glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-neon-cyan/20">
          <div>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan font-extrabold uppercase tracking-wider">Laufendes Training</span>
            <h1 class="text-2xl font-black text-white mt-1">{{ plan()?.name }}</h1>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-center sm:text-right">
              <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Dauer</span>
              <span class="text-xl font-bold font-display text-white mt-0.5">{{ durationFormatted() }}</span>
            </div>
            <button 
              (click)="finishWorkout()"
              class="px-5 py-3 bg-gradient-accent text-slate-950 font-extrabold rounded-xl hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider uppercase glow-mint"
            >
              Abschliessen
            </button>
          </div>
        </div>

        <!-- Timer Panel (Always floating or inline when active) -->
        @if (timerService.isActive() || timerService.isCompleted()) {
          <div class="glass-card rounded-2xl p-4 border border-neon-mint/30 flex items-center justify-between gap-6 animate-pulse-slow">
            <div class="flex items-center gap-4">
              <!-- Radial Progress Ring -->
              <div class="relative w-14 h-14 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" stroke="rgba(29,38,59,0.5)" stroke-width="4" fill="transparent" />
                  <circle cx="28" cy="28" r="24" stroke="#00f5b8" stroke-width="4" fill="transparent"
                    [attr.stroke-dasharray]="150"
                    [attr.stroke-dashoffset]="150 - (150 * timerService.progressPercent()) / 100"
                    class="transition-all duration-300"
                  />
                </svg>
                <span class="absolute text-xs font-black font-display text-white">{{ timerService.timeLeft() }}s</span>
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">Satzpause</h4>
                <p class="text-xs text-slate-400">Atme tief durch und trinke einen Schluck.</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              @if (timerService.isActive()) {
                <button (click)="timerService.pauseTimer()" class="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 9v6m4-6v6" /></svg>
                </button>
              } @else {
                <button (click)="timerService.resumeTimer()" class="p-2 bg-slate-900 border border-slate-800 rounded-lg text-neon-mint hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                </button>
              }
              <button (click)="skipTimer()" class="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors">
                Überspringen
              </button>
            </div>
          </div>
        }

        <!-- Active Exercise Container -->
        @if (currentExercise(); as ex) {
          <div class="glass-card rounded-2xl p-6 space-y-6">
            <!-- Exercise navigation bar -->
            <div class="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
              <div>
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Übung {{ currentExIndex() + 1 }} von {{ exercises().length }}</span>
                <h2 class="text-xl font-bold text-white tracking-tight mt-0.5">{{ ex.name }}</h2>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  (click)="prevExercise()" 
                  [disabled]="currentExIndex() === 0"
                  class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button 
                  (click)="nextExercise()" 
                  [disabled]="currentExIndex() === exercises().length - 1"
                  class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            <!-- Sets Tracker Table -->
            <div class="space-y-3">
              <div class="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                <span class="col-span-2 text-center">Satz</span>
                <span class="col-span-3 text-center">Richtwert</span>
                <span class="col-span-3 text-center">Gewicht (kg)</span>
                <span class="col-span-2 text-center">Wdh.</span>
                <span class="col-span-2 text-center">Erledigt</span>
              </div>

              @for (set of ex.sets; track setIdx; let setIdx = $index) {
                <div 
                  class="grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all border border-transparent"
                  [ngClass]="set.completed ? 'glass-card-active border-neon-mint/20' : 'bg-slate-950/40'"
                >
                  <!-- Set number -->
                  <div class="col-span-2 text-center">
                    <span class="text-xs font-extrabold text-slate-400">{{ setIdx + 1 }}</span>
                  </div>

                  <!-- Reference target -->
                  <div class="col-span-3 text-center text-xs text-slate-500 font-bold">
                    {{ set.targetWeight }}kg x {{ set.targetReps }}
                  </div>

                  <!-- Actual weight input -->
                  <div class="col-span-3">
                    <input 
                      type="number" 
                      [(ngModel)]="set.weight" 
                      [disabled]="set.completed"
                      step="0.5"
                      min="0"
                      class="w-full text-center px-1 py-2 text-sm font-semibold rounded-lg glass-input disabled:opacity-50"
                    />
                  </div>

                  <!-- Actual reps input -->
                  <div class="col-span-2">
                    <input 
                      type="number" 
                      [(ngModel)]="set.reps" 
                      [disabled]="set.completed"
                      min="0"
                      class="w-full text-center px-1 py-2 text-sm font-semibold rounded-lg glass-input disabled:opacity-50"
                    />
                  </div>

                  <!-- Checkbox / Complete set -->
                  <div class="col-span-2 flex justify-center">
                    <button 
                      (click)="toggleSetComplete(setIdx)"
                      class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                      [ngClass]="set.completed ? 'bg-neon-mint border-neon-mint text-slate-950 shadow-sm' : 'border-slate-800 hover:border-slate-700 text-transparent hover:text-slate-700'"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Complete Exercise / Next actions -->
            <div class="flex gap-4 border-t border-slate-800/60 pt-5">
              @if (currentExIndex() < exercises().length - 1) {
                <button 
                  (click)="nextExercise()"
                  class="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-neon-cyan font-bold rounded-xl text-xs tracking-wider uppercase transition-colors"
                >
                  Nächste Übung
                </button>
              } @else {
                <button 
                  (click)="finishWorkout()"
                  class="flex-1 py-3 bg-gradient-accent text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase hover:brightness-110 transition-all glow-mint"
                >
                  Training beenden
                </button>
              }
            </div>

          </div>
        }
        
        <!-- Cancel Workout link -->
        <div class="text-center">
          <a 
            routerLink="/plans"
            (click)="cancelWorkout()"
            class="text-xs text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer"
          >
            Training abbrechen (Verwirft alle Daten)
          </a>
        </div>

      } @else {
        <!-- SUMMARY PANEL ON FINISH -->
        <div class="glass-card rounded-2xl p-8 border border-neon-mint/30 text-center space-y-8 animate-scale-up relative overflow-hidden">
          
          <!-- Radial light glow -->
          <div class="absolute -top-20 -left-20 w-60 h-60 bg-neon-mint/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -right-20 w-60 h-60 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Confetti badge -->
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neon-mint/10 border border-neon-mint/20 text-neon-mint mb-2">
            <!-- Trophy -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>

          <div>
            <h1 class="text-3xl font-black text-white font-display">Training abgeschlossen!</h1>
            <p class="text-sm text-slate-400 mt-2">Hervorragende Arbeit. Du hast dein Training erfolgreich eingetragen.</p>
          </div>

          <!-- Key stats dashboard -->
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dauer</span>
              <span class="text-lg font-black text-white mt-1 block">{{ summaryMinutes() }} Min</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Volumen</span>
              <span class="text-lg font-black text-white mt-1 block">{{ summaryVolume() }} kg</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Belohnung</span>
              <span class="text-lg font-black text-neon-mint mt-1 block">+{{ summaryXp() }} XP</span>
            </div>
          </div>

          <!-- Personal records alert -->
          @if (personalRecords().length > 0) {
            <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left">
              <div class="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Neue Bestleistungen!</span>
              </div>
              <ul class="list-disc list-inside space-y-1 font-medium">
                @for (pr of personalRecords(); track $index) {
                  <li>{{ pr.exerciseName }}: {{ pr.weight }}kg</li>
                }
              </ul>
            </div>
          }

          <div class="pt-4">
            <button 
              routerLink="/dashboard"
              class="w-full py-3.5 bg-gradient-accent text-slate-950 font-extrabold rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm shadow-md glow-mint"
            >
              Zum Dashboard
            </button>
          </div>

        </div>
      }

    </div>
  `,
  styles: []
})
export class WorkoutComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workoutService = inject(WorkoutService);
  timerService = inject(TimerService);

  plan = signal<WorkoutPlan | null>(null);
  exercises = signal<ActiveExercise[]>([]);
  currentExIndex = signal<number>(0);
  currentExercise = computed(() => this.exercises()[this.currentExIndex()] || null);

  // Training state
  startTime = new Date();
  workoutCompleted = signal<boolean>(false);
  
  // Timer tracking
  activeTimerSetIdx: number | null = null;

  // Active workout stats for UI/Interval
  durationMinutes = signal<number>(0);
  private elapsedInterval: any = null;

  // Summary outputs
  summaryMinutes = signal<number>(0);
  summaryVolume = signal<number>(0);
  summaryXp = signal<number>(0);
  personalRecords = signal<Array<{ exerciseName: string; weight: number }>>([]);

  durationFormatted = computed(() => {
    const mins = this.durationMinutes();
    const sec = 0; // We can keep it simple as MM:SS with fractional or just MM min
    const hours = Math.floor(mins / 60);
    const displayMins = Math.floor(mins % 60);
    
    // Ticking seconds calculation
    const elapsedMs = Date.now() - this.startTime.getTime();
    const elapsedSecs = Math.floor(elapsedMs / 1000) % 60;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    
    return `${elapsedMins.toString().padStart(2, '0')}:${elapsedSecs.toString().padStart(2, '0')}`;
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const planId = params.get('id');
      if (planId) {
        const selectedPlan = this.workoutService.plans().find(p => p.id === planId);
        if (selectedPlan) {
          this.plan.set(selectedPlan);
          this.initializeWorkout(selectedPlan);
        } else {
          this.router.navigate(['/plans']);
        }
      } else {
        this.router.navigate(['/plans']);
      }
    });

    // Start ticking duration
    this.elapsedInterval = setInterval(() => {
      const diffMs = Date.now() - this.startTime.getTime();
      this.durationMinutes.set(diffMs / 60000);
    }, 1000);
  }

  ngOnDestroy() {
    if (this.elapsedInterval) {
      clearInterval(this.elapsedInterval);
    }
    this.timerService.stopTimer();
    this.timerService.resetTimer();
  }

  private initializeWorkout(plan: WorkoutPlan) {
    this.startTime = new Date();
    this.durationMinutes.set(0);
    this.workoutCompleted.set(false);

    // Fetch previous workout log of same plan to serve as target baseline
    const lastLog = this.workoutService.getPreviousWorkoutForPlan(plan.id);

    const activeExercises: ActiveExercise[] = plan.exercises.map(ex => {
      // Find matching logged exercise
      const prevEx = lastLog?.exercises.find(le => le.name.toLowerCase() === ex.name.toLowerCase());
      
      const activeSets: ActiveSet[] = ex.sets.map((set, idx) => {
        // Find previous set reference
        const prevSet = prevEx?.sets[idx] || prevEx?.sets[prevEx.sets.length - 1];
        const targetReps = prevSet ? prevSet.reps : set.reps;
        const targetWeight = prevSet ? prevSet.weight : set.weight;

        return {
          // Prefill actual fields with target values as guide (UX optimization)
          reps: targetReps,
          weight: targetWeight,
          targetReps,
          targetWeight,
          restSeconds: set.restSeconds,
          completed: false
        };
      });

      return {
        name: ex.name,
        sets: activeSets
      };
    });

    this.exercises.set(activeExercises);
    this.currentExIndex.set(0);
  }

  toggleSetComplete(setIdx: number) {
    const currentEx = this.currentExercise();
    if (!currentEx) return;

    const set = currentEx.sets[setIdx];
    set.completed = !set.completed;

    if (set.completed) {
      // Start rest timer defined in plan for this set
      this.activeTimerSetIdx = setIdx;
      this.timerService.startTimer(set.restSeconds || 90);
    } else {
      // If unchecked, cancel timer if it was running for this set
      if (this.activeTimerSetIdx === setIdx) {
        this.timerService.stopTimer();
        this.timerService.resetTimer();
        this.activeTimerSetIdx = null;
      }
    }
  }

  skipTimer() {
    this.timerService.stopTimer();
    this.timerService.resetTimer();
    this.activeTimerSetIdx = null;
  }

  prevExercise() {
    if (this.currentExIndex() > 0) {
      this.currentExIndex.update(idx => idx - 1);
    }
  }

  nextExercise() {
    if (this.currentExIndex() < this.exercises().length - 1) {
      this.currentExIndex.update(idx => idx + 1);
    }
  }

  cancelWorkout() {
    if (confirm('Bist du sicher, dass du das Training abbrechen möchtest? Alle erfassten Sätze gehen verloren.')) {
      this.timerService.stopTimer();
      this.timerService.resetTimer();
      this.router.navigate(['/plans']);
    }
  }

  finishWorkout() {
    const plan = this.plan();
    if (!plan) return;

    // Check if any sets are logged
    const loggedExercises: LoggedExercise[] = this.exercises()
      .map(ex => {
        // Save only completed sets (or save all if user hits finish, treating them as completed if they have values)
        const completedSets = ex.sets.filter(s => s.completed || (s.reps > 0 && s.weight >= 0));
        
        return {
          name: ex.name,
          sets: completedSets.map(s => ({
            reps: s.reps,
            weight: s.weight,
            targetReps: s.targetReps,
            targetWeight: s.targetWeight
          }))
        };
      })
      .filter(ex => ex.sets.length > 0); // exclude exercises where no sets were registered

    if (loggedExercises.length === 0) {
      alert('Bitte logge mindestens einen abgeschlossenen Satz, bevor du das Training beendest.');
      return;
    }

    // Stop tickers
    if (this.elapsedInterval) {
      clearInterval(this.elapsedInterval);
    }
    this.timerService.stopTimer();

    const duration = Math.round(Math.max(1, (Date.now() - this.startTime.getTime()) / 60000));
    
    // Create log object
    const newLog: WorkoutLog = {
      id: '',
      userId: '',
      planId: plan.id,
      planName: plan.name,
      date: new Date().toISOString(),
      durationMinutes: duration,
      exercises: loggedExercises
    };

    // Calculate volume
    let totalVolume = 0;
    loggedExercises.forEach(ex => {
      ex.sets.forEach(s => totalVolume += s.reps * s.weight);
    });

    // Check Personal Records (PRs)
    const newPRs: Array<{ exerciseName: string; weight: number }> = [];
    const allPastLogs = this.workoutService.logs();
    
    loggedExercises.forEach(ex => {
      let maxWeightInPast = 0;
      allPastLogs.forEach(pl => {
        const pastEx = pl.exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
        if (pastEx) {
          pastEx.sets.forEach(s => {
            if (s.weight > maxWeightInPast) maxWeightInPast = s.weight;
          });
        }
      });

      const maxWeightInActive = Math.max(...ex.sets.map(s => s.weight));
      // It's a PR if the current max exceeds the past max (and there was past history)
      if (maxWeightInPast > 0 && maxWeightInActive > maxWeightInPast) {
        newPRs.push({ exerciseName: ex.name, weight: maxWeightInActive });
      }
    });

    // Log workout in system and retrieve XP
    const xpGained = this.workoutService.logWorkout(newLog);

    // Save outputs for summary view
    this.summaryMinutes.set(duration);
    this.summaryVolume.set(totalVolume);
    this.summaryXp.set(xpGained);
    this.personalRecords.set(newPRs);

    // Show summary screen
    this.workoutCompleted.set(true);

    // Trigger level up/confetti animation
    setTimeout(() => {
      try {
        (window as any).triggerConfetti?.();
      } catch (e) {}
    }, 200);
  }
}
