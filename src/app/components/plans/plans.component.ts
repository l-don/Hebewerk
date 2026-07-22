import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { WorkoutPlan, Exercise, ExerciseSet } from '../../models/gym.models';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white font-display uppercase">Meine Trainingspläne</h1>
          <p class="text-sm text-slate-400 mt-1">Verwalte deine Schwerlast-Routinen oder erstelle neue Pläne.</p>
        </div>
        @if (!isEditing()) {
          <button 
            (click)="startCreateNewPlan()"
            class="hebewerk-btn-amber px-5 py-3 rounded-xl text-sm flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Neuer Plan</span>
          </button>
        }
      </div>

      <!-- Main Section: List of Plans OR Plan Editor -->
      @if (!isEditing()) {
        
        <!-- Plans Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (plan of plans(); track plan.id) {
            <div class="hebewerk-card hebewerk-card-hover rounded-2xl p-6 flex flex-col justify-between min-h-[220px]">
              <div>
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h3 class="text-xl font-bold text-white tracking-tight font-display">{{ plan.name }}</h3>
                  <span 
                    class="text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono font-bold"
                    [ngClass]="plan.isPublic ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-iron-950 border-slate-800 text-slate-400'"
                  >
                    {{ plan.isPublic ? 'Öffentlich' : 'Privat' }}
                  </span>
                </div>
                
                <p class="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {{ plan.description || 'Keine Beschreibung hinzugefügt.' }}
                </p>

                <!-- Exercise preview list -->
                <div class="space-y-1.5 mb-6">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display">Übungen ({{ plan.exercises.length }})</span>
                  <div class="flex flex-wrap gap-1.5">
                    @for (ex of plan.exercises.slice(0, 3); track ex.id) {
                      <span class="text-xs bg-iron-950 border border-slate-800 px-2 py-1 rounded-lg text-slate-300 font-mono font-semibold">
                        {{ ex.name }} ({{ ex.sets.length }}s)
                      </span>
                    }
                    @if (plan.exercises.length > 3) {
                      <span class="text-xs bg-iron-950 border border-slate-800 px-2 py-1 rounded-lg text-slate-400 font-mono font-bold">
                        +{{ plan.exercises.length - 3 }} weitere
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Plan Card Buttons -->
              <div class="flex items-center gap-3 border-t border-slate-800/80 pt-4 mt-auto">
                <a 
                  [routerLink]="['/workout', plan.id]"
                  class="hebewerk-btn-amber flex-1 py-2.5 rounded-xl text-center text-xs tracking-wider uppercase shadow-md shrink-0 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-iron-950 stroke-none" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>STARTEN</span>
                </a>
                <button 
                  (click)="startEditPlan(plan)"
                  class="p-2.5 rounded-xl bg-iron-950 hover:bg-iron-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center justify-center"
                  title="Plan bearbeiten"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  (click)="deletePlan(plan.id)"
                  class="p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/80 text-rose-400 hover:text-rose-300 transition-colors shrink-0 flex items-center justify-center"
                  title="Plan löschen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-2 hebewerk-card rounded-2xl p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 class="text-lg font-bold text-slate-300 font-display uppercase">Keine Trainingspläne</h3>
              <p class="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Du hast noch keine eigenen Trainingspläne angelegt. Erstelle jetzt deinen ersten Plan!</p>
            </div>
          }
        </div>

      } @else {

        <!-- Plan Editor (Create/Edit Form) -->
        <div class="hebewerk-card rounded-2xl p-6 md:p-8 space-y-6 animate-slide-up border-l-4 border-l-forge-amber">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 class="text-xl font-bold text-white font-display uppercase">{{ editingPlanId ? 'Trainingsplan bearbeiten' : 'Neuen Trainingsplan erstellen' }}</h2>
            <button 
              (click)="cancelEditing()"
              class="px-4 py-2 text-xs font-bold font-display rounded-xl bg-iron-950 border border-slate-800 hover:bg-iron-850 text-slate-300 transition-colors uppercase tracking-wider"
            >
              Abbrechen
            </button>
          </div>

          <!-- Basic Meta Form -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-300 font-display uppercase tracking-wider mb-2">Plan Name</label>
              <input 
                type="text" 
                [(ngModel)]="editName" 
                placeholder="z.B. Push A, Ganzkörper..." 
                class="w-full px-4 py-3 rounded-xl hebewerk-input font-bold text-white text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 font-display uppercase tracking-wider mb-2">Sichtbarkeit</label>
              <div class="flex items-center h-11 bg-iron-950 border border-slate-800 rounded-xl px-4">
                <input 
                  type="checkbox" 
                  id="isPublic"
                  [(ngModel)]="editIsPublic" 
                  class="w-4 h-4 rounded accent-forge-amber mr-3 cursor-pointer"
                />
                <label for="isPublic" class="text-sm text-slate-300 font-bold font-display uppercase cursor-pointer">Öffentlich teilen</label>
              </div>
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-slate-300 font-display uppercase tracking-wider mb-2">Beschreibung</label>
              <textarea 
                [(ngModel)]="editDescription" 
                rows="2"
                placeholder="Fokus auf Brust/Rücken, Pausenzeiten streng einhalten..." 
                class="w-full px-4 py-3 rounded-xl hebewerk-input font-medium text-white text-sm resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Exercise Section Header -->
          <div class="flex items-center justify-between border-t border-slate-800/80 pt-6">
            <h3 class="text-base font-bold text-white font-display uppercase">Übungen</h3>
            <button 
              (click)="addExerciseField()"
              class="hebewerk-btn-cyan px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Übung hinzufügen</span>
            </button>
          </div>

          <!-- Exercises List inside Form -->
          <div class="space-y-4">
            @for (ex of editExercises; track ex.id; let exIdx = $index) {
              <div class="p-4 rounded-xl bg-iron-950 border border-slate-800 space-y-4">
                
                <!-- Exercise Name & Delete -->
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1">
                    <input 
                      type="text" 
                      [(ngModel)]="ex.name"
                      placeholder="z.B. Kniebeugen, Bankdrücken..." 
                      class="w-full px-3 py-2.5 rounded-lg hebewerk-input font-bold text-white text-sm"
                    />
                  </div>
                  <button 
                    (click)="removeExerciseField(exIdx)"
                    class="p-2.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/80 text-rose-400 transition-colors flex items-center justify-center shrink-0"
                    title="Übung entfernen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                    </svg>
                  </button>
                </div>

                <!-- Sets List inside Exercise -->
                <div class="space-y-2">
                  <div class="grid grid-cols-4 gap-2 text-[10px] font-bold text-slate-400 font-display uppercase tracking-widest px-1">
                    <span>Satz</span>
                    <span>Wdh. (Reps)</span>
                    <span>Gewicht (kg)</span>
                    <span>Pause (sec)</span>
                  </div>

                  @for (set of ex.sets; track setIdx; let setIdx = $index) {
                    <div class="grid grid-cols-4 gap-2 items-center">
                      <span class="text-xs font-mono font-bold text-slate-300 px-2 py-2 rounded-lg bg-iron-900 border border-slate-800 text-center">{{ setIdx + 1 }}</span>
                      <input 
                        type="number" 
                        [(ngModel)]="set.reps" 
                        min="1"
                        class="px-2 py-2 rounded-lg hebewerk-input text-center text-xs font-mono font-bold"
                      />
                      <input 
                        type="number" 
                        [(ngModel)]="set.weight" 
                        min="0"
                        step="0.5"
                        class="px-2 py-2 rounded-lg hebewerk-input text-center text-xs font-mono font-bold"
                      />
                      <div class="flex items-center gap-2">
                        <input 
                          type="number" 
                          [(ngModel)]="set.restSeconds" 
                          min="0"
                          step="5"
                          class="flex-1 min-w-0 px-2 py-2 rounded-lg hebewerk-input text-center text-xs font-mono font-bold"
                        />
                        <button 
                          (click)="removeSetField(exIdx, setIdx)"
                          [disabled]="ex.sets.length === 1"
                          class="p-1 text-slate-400 hover:text-rose-400 disabled:opacity-30 flex items-center justify-center shrink-0"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                  
                  <button 
                    (click)="addSetField(exIdx)"
                    class="text-[11px] font-bold font-mono text-forge-amber hover:text-white transition-colors flex items-center gap-1 pt-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Satz hinzufügen</span>
                  </button>
                </div>

              </div>
            } @empty {
              <div class="p-8 text-center text-slate-400 text-sm border border-dashed border-slate-800 rounded-xl font-mono">
                Füge mindestens eine Übung hinzu, um den Plan zu vervollständigen.
              </div>
            }
          </div>

          <!-- Save and Cancel actions -->
          <div class="flex gap-4 pt-6 border-t border-slate-800/80">
            <button 
              (click)="savePlan()"
              [disabled]="!isValidForm()"
              class="hebewerk-btn-amber flex-1 py-3.5 rounded-xl text-sm font-extrabold shadow-lg disabled:opacity-50 disabled:pointer-events-none"
            >
              Speichern
            </button>
            <button 
              (click)="cancelEditing()"
              class="px-6 py-3.5 rounded-xl bg-iron-950 border border-slate-800 hover:bg-iron-850 text-slate-300 font-display font-bold text-sm uppercase transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>

      }

    </div>
  `,
  styles: []
})
export class PlansComponent {
  private workoutService = inject(WorkoutService);
  private router = inject(Router);

  plans = this.workoutService.plans;

  // Editor states
  isEditing = signal<boolean>(false);
  editingPlanId: string | null = null;

  // Editor Form Fields
  editName = '';
  editDescription = '';
  editIsPublic = false;
  editExercises: Exercise[] = [];

  startCreateNewPlan() {
    this.editingPlanId = null;
    this.editName = '';
    this.editDescription = '';
    this.editIsPublic = false;
    this.editExercises = [this.getNewExerciseObject('Kniebeugen (Squat)')];
    this.isEditing.set(true);
  }

  startEditPlan(plan: WorkoutPlan) {
    this.editingPlanId = plan.id;
    this.editName = plan.name;
    this.editDescription = plan.description || '';
    this.editIsPublic = plan.isPublic;
    // Deep copy
    this.editExercises = JSON.parse(JSON.stringify(plan.exercises));
    this.isEditing.set(true);
  }

  cancelEditing() {
    this.isEditing.set(false);
  }

  getNewExerciseObject(name = ''): Exercise {
    return {
      id: 'ex_field_' + Math.random().toString(36).substring(2, 9),
      name,
      sets: [
        { reps: 8, weight: 50, restSeconds: 90 },
        { reps: 8, weight: 50, restSeconds: 90 },
        { reps: 8, weight: 50, restSeconds: 90 }
      ]
    };
  }

  addExerciseField() {
    this.editExercises.push(this.getNewExerciseObject());
  }

  removeExerciseField(idx: number) {
    this.editExercises.splice(idx, 1);
  }

  addSetField(exIdx: number) {
    const sets = this.editExercises[exIdx].sets;
    const lastSet = sets[sets.length - 1] || { reps: 8, weight: 50, restSeconds: 90 };
    sets.push({ ...lastSet });
  }

  removeSetField(exIdx: number, setIdx: number) {
    this.editExercises[exIdx].sets.splice(setIdx, 1);
  }

  isValidForm(): boolean {
    return (
      this.editName.trim().length > 0 &&
      this.editExercises.length > 0 &&
      this.editExercises.every(ex => ex.name.trim().length > 0 && ex.sets.length > 0 && ex.sets.every(s => s.reps > 0 && s.weight >= 0 && s.restSeconds >= 0))
    );
  }

  savePlan() {
    if (!this.isValidForm()) return;

    const plan: WorkoutPlan = {
      id: this.editingPlanId || '',
      userId: '', // set in service
      name: this.editName.trim(),
      description: this.editDescription.trim(),
      isPublic: this.editIsPublic,
      exercises: this.editExercises
    };

    this.workoutService.savePlan(plan);
    this.isEditing.set(false);
  }

  deletePlan(planId: string) {
    if (confirm('Bist du sicher, dass du diesen Trainingsplan löschen möchtest?')) {
      this.workoutService.deletePlan(planId);
    }
  }
}
