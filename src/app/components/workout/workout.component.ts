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
    <div class="p-3 sm:p-5 md:p-6 max-w-3xl mx-auto space-y-5 relative min-h-screen font-body">

      @if (!workoutCompleted()) {
        <!-- ACTIVE WORKOUT PANEL -->
        
        <!-- Header -->
        <div class="notebook-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-[#2D3748]">
          <div>
            <span class="highlighter-yellow text-[10px] font-bold font-heading uppercase tracking-wider">AKTIV ES LÄUFT</span>
            <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A] mt-1">{{ plan()?.name }}</h1>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-center sm:text-right">
              <span class="text-[10px] font-bold text-[#718096] uppercase font-heading block">Dauer</span>
              <span class="text-xl font-bold font-heading text-[#1A1A1A] mt-0.5">{{ durationFormatted() }}</span>
            </div>
            <button 
              (click)="finishWorkout()"
              class="notebook-btn-primary px-6 py-2.5 rounded-xl text-base font-heading shadow-sm shrink-0"
            >
              Abschließen
            </button>
          </div>
        </div>

        <!-- ⏱️ Satzpause Timer Panel (Notizbuch Style) -->
        @if (timerService.isActive() || timerService.elapsedSeconds() > 0) {
          <div 
            class="notebook-card rounded-2xl p-4 sm:p-5 border-2 transition-all shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            [ngClass]="{
              'border-[#2D3748] bg-[#FEF08A]/30': !timerService.isTargetReached(),
              'border-[#2D3748] bg-[#FEF08A] shadow-md animate-pulse-slow': timerService.isTargetReached()
            }"
          >
            <div class="flex items-center gap-3.5 w-full sm:w-auto">
              <!-- Circular Time Badge with Stopwatch Icon -->
              <div 
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#2D3748] flex flex-col items-center justify-center shrink-0 shadow-xs relative"
                [ngClass]="timerService.isTargetReached() ? 'bg-white text-[#1A1A1A]' : 'bg-[#FEF08A] text-[#1A1A1A]'"
              >
                <img src="assets/icons/Time-Clock-Circle-1--Streamline-Freehand.png" class="w-4 h-4 sm:w-5 sm:h-5 object-contain" alt="Stoppuhr" />
                <span class="text-xs sm:text-base font-bold font-heading leading-tight mt-0.5">
                  {{ timerService.formattedElapsed() }}
                </span>
              </div>

              <!-- Info & Target Text -->
              <div class="space-y-0.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base sm:text-lg font-bold font-heading text-[#1A1A1A] leading-none">Satzpause</h3>
                  @if (timerService.isTargetReached()) {
                    <span class="text-[11px] font-bold font-heading bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Zielzeit erreicht! 🎉
                    </span>
                  }
                </div>

                <p class="text-xs text-[#2D3748] font-body">
                  @if (timerService.isTargetReached()) {
                    <span class="font-bold text-emerald-900">Pause beendet (Ziel war {{ timerService.formattedTarget() }}). Nächster Satz kann starten!</span>
                  } @else {
                    <span>Zielzeit: <strong>{{ timerService.formattedTarget() }}</strong> • Atme tief durch & trinke etwas Wasser.</span>
                  }
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              @if (timerService.isActive()) {
                <button (click)="timerService.pauseTimer()" class="px-4 py-2 notebook-btn-outline text-xs font-heading border-[#2D3748]">
                  Pause
                </button>
              } @else {
                <button (click)="timerService.resumeTimer()" class="px-4 py-2 notebook-btn-primary text-xs font-heading border-[#2D3748]">
                  Weiter
                </button>
              }
              <button (click)="skipTimer()" class="px-4 py-2 notebook-btn-outline text-xs font-heading border-[#2D3748]">
                Überspringen
              </button>
            </div>
          </div>
        }

        <!-- Active Exercise Container -->
        @if (currentExercise(); as ex) {
          <div class="notebook-card rounded-2xl p-5 space-y-5">
            <!-- Exercise navigation bar -->
            <div class="flex items-center justify-between gap-4 border-b border-[#2D3748]/15 pb-3">
              <div>
                <span class="text-xs font-bold text-[#718096] font-heading uppercase">Übung {{ currentExIndex() + 1 }} von {{ exercises().length }}</span>
                <h2 class="text-2xl font-bold text-[#1A1A1A] font-heading mt-0.5">{{ ex.name }}</h2>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  (click)="prevExercise()" 
                  [disabled]="currentExIndex() === 0"
                  class="p-2 rounded-xl bg-[#FAF8F2] hover:bg-[#FEF08A]/50 disabled:opacity-30 border border-[#2D3748]/30 text-[#1A1A1A] transition-colors"
                >
                  ◀
                </button>
                <button 
                  (click)="nextExercise()" 
                  [disabled]="currentExIndex() === exercises().length - 1"
                  class="p-2 rounded-xl bg-[#FAF8F2] hover:bg-[#FEF08A]/50 disabled:opacity-30 border border-[#2D3748]/30 text-[#1A1A1A] transition-colors"
                >
                  ▶
                </button>
              </div>
            </div>

            <!-- Sets Tracker Table -->
            <div class="space-y-2.5">
              <div class="grid grid-cols-12 gap-2 text-[11px] font-bold text-[#718096] font-heading uppercase tracking-wider px-2">
                <span class="col-span-2 text-center">Satz</span>
                <span class="col-span-3 text-center">Richtwert</span>
                <span class="col-span-3 text-center">Gewicht (kg)</span>
                <span class="col-span-2 text-center">Wdh.</span>
                <span class="col-span-2 text-center">Erledigt</span>
              </div>

              @for (set of ex.sets; track setIdx; let setIdx = $index) {
                <div 
                  class="grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all border"
                  [ngClass]="set.completed ? 'bg-[#FEF08A]/50 border-[#2D3748]' : 'bg-[#FAF8F2] border-[#2D3748]/20'"
                >
                  <!-- Set number -->
                  <div class="col-span-2 text-center">
                    <span class="text-xs font-body font-bold text-[#1A1A1A]">{{ setIdx + 1 }}</span>
                  </div>

                  <!-- Reference target -->
                  <div class="col-span-3 text-center text-xs text-[#718096] font-body font-bold">
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
                      class="w-full text-center px-1 py-1.5 text-sm font-body font-bold rounded-lg notebook-input border border-[#2D3748]/20 disabled:opacity-60"
                    />
                  </div>

                  <!-- Actual reps input -->
                  <div class="col-span-2">
                    <input 
                      type="number" 
                      [(ngModel)]="set.reps" 
                      [disabled]="set.completed"
                      min="0"
                      class="w-full text-center px-1 py-1.5 text-sm font-body font-bold rounded-lg notebook-input border border-[#2D3748]/20 disabled:opacity-60"
                    />
                  </div>

                  <!-- Checkbox / Complete set -->
                  <div class="col-span-2 flex justify-center">
                    <button 
                      (click)="toggleSetComplete(setIdx)"
                      class="w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-sm transition-all"
                      [ngClass]="set.completed ? 'bg-[#FEF08A] border-[#2D3748] text-[#1A1A1A] shadow-sm' : 'bg-white border-[#2D3748]/30 text-transparent hover:text-gray-400'"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Complete Exercise / Next actions -->
            <div class="flex gap-3 border-t border-[#2D3748]/15 pt-4">
              @if (currentExIndex() < exercises().length - 1) {
                <button 
                  (click)="nextExercise()"
                  class="notebook-btn-outline flex-1 py-2.5 rounded-xl text-base font-heading border border-[#2D3748]"
                >
                  Nächste Übung →
                </button>
              } @else {
                <button 
                  (click)="finishWorkout()"
                  class="notebook-btn-primary flex-1 py-3 rounded-xl text-base font-heading shadow-sm"
                >
                  Training beenden
                </button>
              }
            </div>

          </div>
        }
        
        <!-- Cancel Workout link -->
        <div class="text-center pt-2">
          <a 
            routerLink="/plans"
            (click)="cancelWorkout()"
            class="text-xs text-rose-700 hover:underline font-body cursor-pointer"
          >
            Training abbrechen (Verwirft alle Daten)
          </a>
        </div>

      } @else {
        <!-- SUMMARY PANEL ON FINISH -->
        <div class="notebook-card rounded-2xl p-6 sm:p-8 border-2 border-[#2D3748] text-center space-y-6 animate-scale-up relative bg-white shadow-xl">
          
          <!-- Confetti badge -->
          <div class="w-16 h-16 rounded-2xl bg-[#FEF08A] border border-[#2D3748] flex items-center justify-center mx-auto text-3xl shadow-sm">
            🏆
          </div>

          <div>
            <h1 class="text-3xl font-bold text-[#1A1A1A] font-heading">Training abgeschlossen!</h1>
            <p class="text-xs sm:text-sm text-[#718096] font-body mt-1">Hervorragende Arbeit. Dein Training wurde ins Notizbuch eingetragen.</p>
          </div>

          <!-- Key stats dashboard -->
          <div class="grid grid-cols-3 gap-3">
            <div class="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/20">
              <span class="text-[10px] font-bold text-[#718096] font-heading uppercase block">Dauer</span>
              <span class="text-lg font-bold text-[#1A1A1A] font-heading mt-0.5 block">{{ summaryMinutes() }} Min</span>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/20">
              <span class="text-[10px] font-bold text-[#718096] font-heading uppercase block">Volumen</span>
              <span class="text-lg font-bold text-[#1A1A1A] font-heading mt-0.5 block">{{ summaryVolume() }} kg</span>
            </div>
            <div class="p-3.5 rounded-xl bg-[#FEF08A]/60 border border-[#2D3748]/30">
              <span class="text-[10px] font-bold text-[#1A1A1A] font-heading uppercase block">Belohnung</span>
              <span class="text-lg font-bold text-[#1A1A1A] font-heading mt-0.5 block">+{{ summaryXp() }} XP</span>
            </div>
          </div>

          <!-- Personal records alert -->
          @if (personalRecords().length > 0) {
            <div class="p-4 rounded-xl bg-[#FEF08A] border border-[#2D3748] text-[#1A1A1A] text-xs text-left shadow-sm">
              <div class="flex items-center gap-1.5 font-heading font-bold text-sm uppercase mb-1">
                <span>⭐ Neue Bestleistungen!</span>
              </div>
              <ul class="list-disc list-inside space-y-1 font-body">
                @for (pr of personalRecords(); track $index) {
                  <li>{{ pr.exerciseName }}: {{ pr.weight }}kg</li>
                }
              </ul>
            </div>
          }

          <div class="pt-2">
            <button 
              routerLink="/dashboard"
              class="notebook-btn-primary w-full py-3 rounded-xl text-lg font-heading shadow-sm"
            >
              Zum Dashboard
            </button>
          </div>
        </div>
      }

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
    const active = this.workoutService.activeWorkout();

    if (active && active.planId === plan.id) {
      // Restore existing active session
      this.startTime = new Date(active.startTime);
      this.exercises.set(active.exercises);
      this.currentExIndex.set(active.currentExIndex || 0);
      this.workoutCompleted.set(false);
      return;
    }

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

    this.persistState();
  }

  persistState() {
    const plan = this.plan();
    if (!plan || this.workoutCompleted()) return;

    this.workoutService.saveActiveWorkout({
      planId: plan.id,
      planName: plan.name,
      startTime: this.startTime.toISOString(),
      currentExIndex: this.currentExIndex(),
      exercises: this.exercises()
    });
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

    this.persistState();
  }

  skipTimer() {
    this.timerService.stopTimer();
    this.timerService.resetTimer();
    this.activeTimerSetIdx = null;
  }

  prevExercise() {
    if (this.currentExIndex() > 0) {
      this.currentExIndex.update(idx => idx - 1);
      this.persistState();
    }
  }

  nextExercise() {
    if (this.currentExIndex() < this.exercises().length - 1) {
      this.currentExIndex.update(idx => idx + 1);
      this.persistState();
    }
  }

  cancelWorkout() {
    if (confirm('Bist du sicher, dass du das Training abbrechen möchtest? Alle erfassten Sätze gehen verloren.')) {
      this.timerService.stopTimer();
      this.timerService.resetTimer();
      this.workoutService.clearActiveWorkout();
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

    // Clear active workout session state
    this.workoutService.clearActiveWorkout();

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
