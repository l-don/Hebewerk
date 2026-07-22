import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkoutService } from '../../services/workout.service';
import { WorkoutLog } from '../../models/gym.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white font-display">Trainingsverlauf</h1>
        <p class="text-sm text-slate-400 mt-1">Hier findest du all deine absolvierten Trainingseinheiten.</p>
      </div>

      <!-- Logs List -->
      <div class="space-y-4">
        @for (log of logs(); track log.id; let idx = $index) {
          <div class="glass-card rounded-2xl p-5 transition-all">
            
            <!-- Summary Header of Log Card -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <h3 class="text-lg font-bold text-white tracking-tight">{{ log.planName }}</h3>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-neon-mint/10 border border-neon-mint/20 text-neon-mint font-bold uppercase">
                    +{{ log.xpGained || 0 }} XP
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ log.date | date:'dd. MMMM yyyy, HH:mm':'':'de-DE' }}
                  </span>
                  <span class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ log.durationMinutes }} Min.
                  </span>
                </div>
              </div>

              <!-- Action button: Toggle details -->
              <button 
                (click)="toggleLogDetails(log.id)"
                class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5 self-start sm:self-center"
              >
                <span>{{ isExpanded(log.id) ? 'Details ausblenden' : 'Details anzeigen' }}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  class="h-4 w-4 transform transition-transform" 
                  [ngClass]="isExpanded(log.id) ? 'rotate-180' : ''" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Details Section (Accordion style) -->
            @if (isExpanded(log.id)) {
              <div class="mt-5 border-t border-slate-800/80 pt-5 space-y-4 animate-slide-down">
                @for (ex of log.exercises; track $index) {
                  <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 space-y-2">
                    <h4 class="text-sm font-extrabold text-white tracking-tight">{{ ex.name }}</h4>
                    
                    <!-- Sets subtable -->
                    <div class="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      <span>Satz</span>
                      <span class="text-center">Gewicht</span>
                      <span class="text-center">Wiederholungen</span>
                      <span class="text-right">Richtwert</span>
                    </div>

                    @for (set of ex.sets; track setIdx; let setIdx = $index) {
                      <div class="grid grid-cols-4 gap-2 items-center text-xs text-slate-300 font-medium px-1">
                        <span class="text-slate-500 font-bold">#{{ setIdx + 1 }}</span>
                        <span class="text-center font-bold text-slate-200">{{ set.weight }} kg</span>
                        <span class="text-center font-bold text-slate-200">{{ set.reps }}</span>
                        <span class="text-right text-slate-500">{{ set.targetWeight }}kg x {{ set.targetReps }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          </div>
        } @empty {
          <div class="glass-card rounded-2xl p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-bold text-slate-300">Keine Trainings einträge</h3>
            <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Du hast noch keine Trainingseinheiten in deinem Verlauf. Starte ein Workout, um Einträge zu erstellen.</p>
          </div>
        }
      </div>

    </div>
  `,
  styles: []
})
export class HistoryComponent {
  private workoutService = inject(WorkoutService);
  
  logs = this.workoutService.logs;
  expandedLogIds = signal<Record<string, boolean>>({});

  toggleLogDetails(logId: string) {
    this.expandedLogIds.update(current => ({
      ...current,
      [logId]: !current[logId]
    }));
  }

  isExpanded(logId: string): boolean {
    return !!this.expandedLogIds()[logId];
  }
}
