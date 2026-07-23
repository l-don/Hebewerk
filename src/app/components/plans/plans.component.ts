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
    <div class="p-3 sm:p-5 md:p-6 max-w-5xl mx-auto space-y-5 animate-fade-in font-body">
      
      <!-- Header -->
      <div class="pb-2 border-b border-[#2D3748]/20 flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A]">
            <span class="highlighter-line inline-block px-1">MEINE TRAININGSPLÄNE</span>
          </h1>
          <p class="text-xs sm:text-sm text-[#718096] font-body mt-0.5">Verwalte deine Routinen oder erstelle neue Notizbuch-Pläne.</p>
        </div>
        @if (!isEditing()) {
          <button 
            (click)="startCreateNewPlan()"
            class="notebook-btn-primary px-5 py-2.5 rounded-xl text-base font-heading shadow-sm flex items-center gap-2"
          >
            <span>+ Neuer Plan</span>
          </button>
        }
      </div>

      <!-- Main Section: List of Plans OR Plan Editor -->
      @if (!isEditing()) {
        
        <!-- Plans Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          @for (plan of plans(); track plan.id) {
            <div class="notebook-card rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h3 class="text-xl font-bold text-[#1A1A1A] font-heading">{{ plan.name }}</h3>
                  <span 
                    class="text-[10px] font-bold font-heading px-2 py-0.5 rounded border uppercase"
                    [ngClass]="plan.isPublic ? 'highlighter-yellow border-[#2D3748]/30' : 'bg-[#FAF8F2] border-[#2D3748]/20 text-[#718096]'"
                  >
                    {{ plan.isPublic ? 'Öffentlich' : 'Privat' }}
                  </span>
                </div>
                
                <p class="text-xs text-[#718096] font-body line-clamp-2 mb-4 leading-relaxed">
                  {{ plan.description || 'Keine Beschreibung hinzugefügt.' }}
                </p>

                <!-- Exercise preview list -->
                <div class="space-y-1.5 mb-6">
                  <span class="text-xs font-bold font-heading text-[#1A1A1A] uppercase block">Übungen ({{ plan.exercises.length }})</span>
                  <div class="flex flex-wrap gap-1.5">
                    @for (ex of plan.exercises.slice(0, 3); track ex.id) {
                      <span class="text-xs bg-[#FAF8F2] border border-[#2D3748]/20 px-2 py-1 rounded-lg text-[#1A1A1A] font-body">
                        {{ ex.name }} ({{ ex.sets.length }}s)
                      </span>
                    }
                    @if (plan.exercises.length > 3) {
                      <span class="text-xs bg-[#FAF8F2] border border-[#2D3748]/20 px-2 py-1 rounded-lg text-[#718096] font-body">
                        +{{ plan.exercises.length - 3 }} weitere
                      </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Plan Card Buttons -->
              <div class="flex items-center gap-2.5 border-t border-[#2D3748]/15 pt-3.5 mt-auto">
                <a 
                  [routerLink]="['/workout', plan.id]"
                  class="notebook-btn-primary flex-1 py-2.5 rounded-xl text-center text-base font-heading shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>STARTEN</span>
                  <img src="assets/icons/Arrow-Right--Streamline-Freehand.png" class="w-4 h-4 object-contain" alt="Start" />
                </a>
                <button 
                  (click)="startEditPlan(plan)"
                  class="p-2.5 rounded-xl bg-[#FAF8F2] hover:bg-[#FEF08A]/50 border border-[#2D3748]/30 text-[#1A1A1A] transition-colors shrink-0"
                  title="Plan bearbeiten"
                >
                  <img src="assets/icons/Edit-Pencil-1--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Bearbeiten" />
                </button>
                <button 
                  (click)="deletePlan(plan.id)"
                  class="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 transition-colors shrink-0"
                  title="Plan löschen"
                >
                  <img src="assets/icons/Delete-Bin-1--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Löschen" />
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-2 notebook-card rounded-2xl p-10 text-center bg-[#FAF8F2]">
              <img src="assets/icons/Lists-Bullets--Streamline-Freehand.png" class="w-12 h-12 mx-auto mb-3 opacity-60 object-contain" alt="Pläne" />
              <h3 class="text-lg font-bold text-[#1A1A1A] font-heading">Keine Trainingspläne</h3>
              <p class="text-xs text-[#718096] font-body mt-1 max-w-sm mx-auto">Du hast noch keine eigenen Trainingspläne angelegt. Erstelle jetzt deinen ersten Notizbuch-Plan!</p>
            </div>
          }
        </div>

      } @else {

        <!-- Plan Editor (Create/Edit Form) -->
        <div class="notebook-card rounded-2xl p-5 md:p-7 space-y-5 shadow-lg bg-white border-2 border-[#2D3748]">
          <div class="flex items-center justify-between border-b border-[#2D3748]/15 pb-3">
            <h2 class="text-xl font-bold text-[#1A1A1A] font-heading">{{ editingPlanId ? 'Trainingsplan bearbeiten' : 'Neuen Trainingsplan erstellen' }}</h2>
            <button 
              (click)="cancelEditing()"
              class="notebook-btn-outline px-4 py-1.5 text-sm font-heading rounded-xl"
            >
              Abbrechen
            </button>
          </div>

          <!-- Basic Meta Form -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-[#1A1A1A] font-heading mb-1">Plan Name</label>
              <input 
                type="text" 
                [(ngModel)]="editName" 
                placeholder="z.B. Push A, Ganzkörper..." 
                class="w-full px-3.5 py-2.5 rounded-xl notebook-input font-body text-[#1A1A1A] text-sm border border-[#2D3748]/30"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-[#1A1A1A] font-heading mb-1">Sichtbarkeit</label>
              <div class="flex items-center h-11 bg-[#FAF8F2] border border-[#2D3748]/30 rounded-xl px-4">
                <input 
                  type="checkbox" 
                  id="isPublic"
                  [(ngModel)]="editIsPublic" 
                  class="w-4 h-4 rounded accent-[#FEF08A] mr-3 cursor-pointer"
                />
                <label for="isPublic" class="text-xs text-[#1A1A1A] font-bold font-heading uppercase cursor-pointer">Öffentlich teilen</label>
              </div>
            </div>
            <div class="md:col-span-3">
              <label class="block text-xs font-bold text-[#1A1A1A] font-heading mb-1">Beschreibung</label>
              <textarea 
                [(ngModel)]="editDescription" 
                rows="2"
                placeholder="Fokus auf Brust/Rücken, Pausenzeiten streng einhalten..." 
                class="w-full px-3.5 py-2.5 rounded-xl notebook-input font-body text-[#1A1A1A] text-sm resize-none border border-[#2D3748]/30"
              ></textarea>
            </div>
          </div>

          <!-- Exercise Section Header -->
          <div class="flex items-center justify-between border-t border-[#2D3748]/15 pt-5">
            <h3 class="text-base font-bold text-[#1A1A1A] font-heading">Übungen</h3>
            <button 
              (click)="addExerciseField()"
              class="notebook-btn-outline px-4 py-1.5 text-sm font-heading rounded-xl"
            >
              + Übung hinzufügen
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
                      class="w-full px-3 py-2 rounded-lg notebook-input font-heading text-[#1A1A1A] font-bold text-sm border border-[#2D3748]/30"
                    />
                  </div>
                  <button 
                    (click)="removeExerciseField(exIdx)"
                    class="p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 transition-colors flex items-center justify-center shrink-0"
                    title="Übung entfernen"
                  >
                    <img src="assets/icons/Delete-Bin-1--Streamline-Freehand.png" class="w-4 h-4 object-contain" alt="Löschen" />
                  </button>
                </div>

                <!-- Sets List inside Exercise -->
                <div class="space-y-2">
                  <div class="grid grid-cols-4 gap-2 text-[11px] font-bold text-[#718096] font-heading uppercase tracking-wider px-1">
                    <span>Satz</span>
                    <span>Wdh. (Reps)</span>
                    <span>Gewicht (kg)</span>
                    <span>Pause (sec)</span>
                  </div>

                  @for (set of ex.sets; track setIdx; let setIdx = $index) {
                    <div class="grid grid-cols-4 gap-2 items-center">
                      <span class="text-xs font-body font-bold text-[#1A1A1A] px-2 py-2 rounded-lg bg-[#FAF8F2] border border-[#2D3748]/20 text-center">{{ setIdx + 1 }}</span>
                      <input 
                        type="number" 
                        [(ngModel)]="set.reps" 
                        min="1"
                        class="px-2 py-2 rounded-lg notebook-input text-center text-xs font-body font-bold border border-[#2D3748]/20"
                      />
                      <input 
                        type="number" 
                        [(ngModel)]="set.weight" 
                        min="0"
                        step="0.5"
                        class="px-2 py-2 rounded-lg notebook-input text-center text-xs font-body font-bold border border-[#2D3748]/20"
                      />
                      <div class="flex items-center gap-2">
                        <input 
                          type="number" 
                          [(ngModel)]="set.restSeconds" 
                          min="0"
                          step="5"
                          class="flex-1 min-w-0 px-2 py-2 rounded-lg notebook-input text-center text-xs font-body font-bold border border-[#2D3748]/20"
                        />
                        <button 
                          (click)="removeSetField(exIdx, setIdx)"
                          [disabled]="ex.sets.length === 1"
                          class="p-1 text-[#718096] hover:text-rose-600 disabled:opacity-30 flex items-center justify-center shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  }
                  
                  <button 
                    (click)="addSetField(exIdx)"
                    class="text-xs font-bold font-heading text-[#d97706] hover:text-black transition-colors flex items-center gap-1 pt-1.5"
                  >
                    <span>+ Satz hinzufügen</span>
                  </button>
                </div>

              </div>
            } @empty {
              <div class="p-6 text-center text-[#718096] text-xs border border-dashed border-[#2D3748]/20 rounded-xl font-body bg-[#FAF8F2]">
                Füge mindestens eine Übung hinzu, um den Plan zu vervollständigen.
              </div>
            }
          </div>

          <!-- Save and Cancel actions -->
          <div class="flex gap-3 pt-5 border-t border-[#2D3748]/15">
            <button 
              (click)="savePlan()"
              [disabled]="!isValidForm()"
              class="notebook-btn-primary flex-1 py-3 rounded-xl text-base font-heading shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              Speichern
            </button>
            <button 
              (click)="cancelEditing()"
              class="notebook-btn-outline px-6 py-3 rounded-xl text-base font-heading"
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
