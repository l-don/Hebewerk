import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkoutService } from '../../services/workout.service';
import { WorkoutLog } from '../../models/gym.models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 sm:p-5 md:p-6 max-w-4xl mx-auto space-y-5 animate-fade-in font-body">
      
      <!-- Header -->
      <div class="pb-2 border-b border-[#2D3748]/20 flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A]">
            <span class="highlighter-line inline-block px-1">TRAININGSVERLAUF</span>
          </h1>
          <p class="text-xs sm:text-sm text-[#718096] font-body mt-0.5">Hier findest du all deine absolvierten Notizbuch-Einheiten.</p>
        </div>
      </div>

      <!-- Logs List -->
      <div class="space-y-4">
        @for (log of logs(); track log.id; let idx = $index) {
          <div class="notebook-card rounded-2xl p-5 transition-all">
            
            <!-- Summary Header of Log Card -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2.5">
                  <h3 class="text-xl font-bold text-[#1A1A1A] font-heading">{{ log.planName }}</h3>
                  <span class="highlighter-yellow text-[11px] font-bold font-heading uppercase">
                    +{{ log.xpGained || 0 }} XP
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-[#718096] font-body mt-1">
                  <span class="flex items-center gap-1">
                    📅 {{ log.date | date:'dd. MMMM yyyy, HH:mm':'':'de-DE' }}
                  </span>
                  <span>•</span>
                  <span class="flex items-center gap-1 font-bold text-[#1A1A1A]">
                    ⏱️ {{ log.durationMinutes }} Min.
                  </span>
                </div>
              </div>

              <!-- Action button: Toggle details -->
              <button 
                (click)="toggleLogDetails(log.id)"
                class="notebook-btn-outline px-4 py-2 rounded-xl text-xs font-heading flex items-center gap-1.5 self-start sm:self-center border border-[#2D3748]"
              >
                <span>{{ isExpanded(log.id) ? 'Details ausblenden' : 'Details anzeigen' }}</span>
                <span [ngClass]="isExpanded(log.id) ? 'rotate-180' : ''" class="inline-block transition-transform">▼</span>
              </button>
            </div>

            <!-- Details Section (Accordion style) -->
            @if (isExpanded(log.id)) {
              <div class="mt-4 border-t border-[#2D3748]/15 pt-4 space-y-3">
                @for (ex of log.exercises; track $index) {
                  <div class="p-3 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 space-y-2">
                    <h4 class="text-sm font-bold text-[#1A1A1A] font-heading">{{ ex.name }}</h4>
                    
                    <!-- Sets subtable -->
                    <div class="grid grid-cols-4 gap-2 text-[11px] font-bold text-[#718096] font-heading uppercase tracking-wider px-1">
                      <span>Satz</span>
                      <span class="text-center">Gewicht</span>
                      <span class="text-center">Wdh.</span>
                      <span class="text-right">Richtwert</span>
                    </div>

                    @for (set of ex.sets; track setIdx; let setIdx = $index) {
                      <div class="grid grid-cols-4 gap-2 items-center text-xs text-[#1A1A1A] font-body px-1">
                        <span class="text-[#718096] font-bold">#{{ setIdx + 1 }}</span>
                        <span class="text-center font-bold text-[#0284c7]">{{ set.weight }} kg</span>
                        <span class="text-center font-bold text-[#1A1A1A]">{{ set.reps }}</span>
                        <span class="text-right text-[#718096]">{{ set.targetWeight }}kg x {{ set.targetReps }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }

          </div>
        } @empty {
          <div class="notebook-card rounded-2xl p-10 text-center bg-[#FAF8F2]">
            <img src="assets/icons/Analytics-Graph-Bar-Line--Streamline-Freehand.png" class="w-12 h-12 mx-auto mb-3 opacity-60 object-contain" alt="Verlauf" />
            <h3 class="text-lg font-bold font-heading text-[#1A1A1A]">Keine Trainingseinträge</h3>
            <p class="text-xs text-[#718096] font-body mt-1 max-w-sm mx-auto">Du hast noch keine Trainingseinheiten in deinem Notizbuch. Starte ein Workout, um Einträge zu erstellen.</p>
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
