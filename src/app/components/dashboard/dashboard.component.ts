import { Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { Firestore, collection, onSnapshot, query, orderBy, limit, doc, getDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { WorkoutService } from '../../services/workout.service';
import { FriendsService } from '../../services/friends.service';
import { MockDataService } from '../../services/mock-data.service';
import { WorkoutPlan, ActivityFeedItem, Exercise } from '../../models/gym.models';
import { environment } from '../../../environments/environment';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  template: `
    <div class="p-3 sm:p-5 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
      
      <!-- 1️⃣ Header (Top Bar) -->
      <div class="flex items-center justify-between gap-3 pb-2 border-b border-[#2D3748]/20">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold font-heading text-[#1A1A1A]">
            <span class="highlighter-line inline-block px-1">Hi, {{ currentUser()?.displayName || 'Athlet' }}!</span>
          </h1>
          <p class="text-xs sm:text-sm text-[#718096] font-body mt-0.5">Dein persönliches Trainings-Notizbuch</p>
        </div>

        <!-- Right: Avatar + Level & XP Display (Double Underline) -->
        @if (currentUser(); as user) {
          <div class="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-[#2D3748]/20 shadow-sm shrink-0">
            <img [src]="user.photoURL" class="w-9 h-9 rounded-full border-2 border-[#FEF08A] bg-[#FAF8F2] object-cover shrink-0" alt="Avatar" />
            <div class="text-right">
              <div class="text-xs sm:text-sm font-bold font-heading text-[#1A1A1A] leading-tight border-b-2 border-double border-[#2D3748]">
                LVL {{ user.stats.level }}
              </div>
              <div class="text-[10px] sm:text-xs font-body font-bold text-[#718096] leading-none mt-0.5">
                {{ user.stats.xp }} / {{ nextLevelXpStart() }} XP
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage()) {
        <div class="p-3 rounded-xl bg-[#FEF08A] border border-[#2D3748] text-[#1A1A1A] text-sm font-bold font-heading flex items-center justify-between shadow-sm animate-fade-in">
          <div class="flex items-center gap-2">
            <img src="assets/icons/Form-Validation-Check-Circle--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="OK" />
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set(null)" class="text-[#2D3748] hover:text-black text-xs font-bold">✕</button>
        </div>
      }

      <!-- 2️⃣ Main Action Card ("TRAINING STARTEN") -->
      <div class="notebook-postit rounded-2xl p-4 sm:p-5 relative shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <!-- CSS Tape Strips on corners -->
        <div class="notebook-tape-left"></div>
        <div class="notebook-tape-right"></div>

        <div class="flex items-center gap-4">
          <img src="assets/symbols/dumbell_symbol_1.png" class="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-sm" alt="Dumbbell Symbol" />
          <div>
            <span class="text-[11px] font-heading font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded border border-[#2D3748]/20 text-[#1A1A1A]">
              Bereit fürs heutige Training?
            </span>
            <h2 class="text-xl sm:text-2xl font-bold text-[#1A1A1A] font-heading mt-1">Nächste Einheit eintragen</h2>
            <p class="text-xs text-[#2D3748]/80 font-body">Wähle deinen Trainingsplan & halte deine Gewichte fest.</p>
          </div>
        </div>

        <a 
          routerLink="/plans"
          class="notebook-btn-primary px-6 py-3 rounded-xl text-lg font-heading shadow-md hover:bg-yellow-300 transition-all flex items-center gap-2 shrink-0 border border-[#2D3748]"
        >
          <span>TRAINING STARTEN</span>
          <img src="assets/icons/Arrow-Right--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Arrow" />
        </a>
      </div>

      <!-- 3️⃣ Middle Section (2-Spalten Grid: Streak & Letztes Training) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <!-- Linke Spalte (Streak-Widget) -->
        @if (currentUser(); as user) {
          <div class="notebook-card p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div class="flex items-center justify-between border-b border-[#2D3748]/10 pb-2 mb-3">
              <span class="text-lg font-bold font-heading text-[#1A1A1A] uppercase tracking-wide">STREAK</span>
              <img src="assets/icons/Analytics-Graph-Bar-Line--Streamline-Freehand.png" class="w-5 h-5 object-contain opacity-60" alt="Streak" />
            </div>

            <div class="flex items-center gap-4 my-1">
              <img src="assets/symbols/flame_symbol.png" class="w-14 h-14 object-contain shrink-0 drop-shadow-sm" alt="Flame Symbol" />
              <div>
                <div class="flex items-baseline gap-2">
                  <span class="text-4xl sm:text-5xl font-bold font-heading text-[#1A1A1A]">{{ user.stats.currentStreak || 0 }}</span>
                  <span class="highlighter-yellow text-sm font-bold font-heading uppercase text-[#1A1A1A]">WOCHEN</span>
                </div>
                <p class="text-xs text-[#718096] font-body mt-1">Dranbleiben für maximale Gains!</p>
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-[#2D3748]/10 flex items-center justify-between text-xs text-[#718096] font-body">
              <span>Zuletzt aktiv</span>
              <span class="font-bold text-[#1A1A1A]">{{ lastActiveFormatted() }}</span>
            </div>
          </div>
        }

        <!-- Rechte Spalte (Letztes Training) -->
        <div class="notebook-card p-4 rounded-2xl flex flex-col justify-between relative">
          @if (lastWorkoutLog(); as log) {
            <div>
              <div class="flex items-center justify-between border-b border-[#2D3748]/10 pb-2 mb-3">
                <div class="flex items-center gap-2">
                  <img src="assets/icons/Fitness-Dumbbell--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Hantel" />
                  <span class="text-lg font-bold font-heading text-[#1A1A1A] uppercase tracking-wide">LETZTES TRAINING</span>
                </div>
                <div class="flex items-center gap-1 text-xs text-[#718096] font-body">
                  <img src="assets/symbols/calendar_symbol.png" class="w-4 h-4 object-contain" alt="Datum" />
                  <span>{{ lastWorkoutDateFormatted() }}</span>
                </div>
              </div>

              <!-- Tag-Badge: Textmarker-Highlight Hintergrund -->
              <div class="space-y-2 mb-3">
                <div>
                  <span class="highlighter-yellow text-sm sm:text-base font-bold font-heading text-[#1A1A1A] rounded-md px-2 py-0.5">
                    {{ lastWorkoutName() }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs font-body text-[#2D3748]">
                  <img src="assets/symbols/energy_symbol.png" class="w-4 h-4 object-contain" alt="Gewicht" />
                  <span class="font-bold text-[#1A1A1A] text-sm">{{ lastWorkoutMovedWeightFormatted() }}</span>
                </div>
              </div>
            </div>

            <a 
              routerLink="/history"
              class="notebook-btn-outline w-full py-2 text-center text-sm font-heading flex items-center justify-center gap-1 border border-[#2D3748] mt-2"
            >
              <span>VERLAUF ANSEHEN</span>
              <img src="assets/icons/Arrow-Right--Streamline-Freehand.png" class="w-4 h-4 object-contain" alt="Arrow" />
            </a>
          } @else {
            <div>
              <div class="flex items-center justify-between border-b border-[#2D3748]/10 pb-2 mb-3">
                <div class="flex items-center gap-2">
                  <img src="assets/icons/Fitness-Dumbbell--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Hantel" />
                  <span class="text-lg font-bold font-heading text-[#1A1A1A] uppercase tracking-wide">LETZTES TRAINING</span>
                </div>
              </div>

              <div class="space-y-1 mb-3">
                <span class="text-sm font-bold font-heading text-[#1A1A1A] block">Noch kein Training absolviert</span>
                <p class="text-xs text-[#718096] font-body">Sobald du eine Einheit beendest, erscheint deine Zusammenfassung hier.</p>
              </div>
            </div>

            <a 
              routerLink="/plans"
              class="notebook-btn-primary w-full py-2 text-center text-sm font-heading flex items-center justify-center gap-1 border border-[#2D3748] mt-2"
            >
              <span>TRAINING STARTEN</span>
              <img src="assets/icons/Arrow-Right--Streamline-Freehand.png" class="w-4 h-4 object-contain" alt="Arrow" />
            </a>
          }
        </div>

      </div>

      <!-- 4️⃣ Activity Feed ("AKTIVITÄTEN DEINER FREUNDE") -->
      <div class="notebook-card p-4 rounded-2xl space-y-3">
        <div class="flex items-center justify-between border-b border-[#2D3748]/15 pb-2">
          <div class="flex items-center gap-2">
            <img src="assets/icons/Multiple-Man-Woman--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Freunde" />
            <h3 class="text-lg font-bold font-heading text-[#1A1A1A] uppercase tracking-wide">AKTIVITÄTEN DEINER FREUNDE</h3>
          </div>
          <span class="text-[10px] font-heading font-bold px-2 py-0.5 rounded bg-[#FEF08A] border border-[#2D3748]/30 text-[#1A1A1A]">
            ● Live Feed
          </span>
        </div>

        @if (activityFeedItems().length > 0) {
          <!-- Display max 3 items compactly -->
          <div class="space-y-2">
            @for (item of activityFeedItems().slice(0, 3); track item.id) {
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 hover:border-[#2D3748]/40 transition-colors">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <img [src]="item.photoURL" class="w-9 h-9 rounded-full border border-[#2D3748]/30 shrink-0 bg-white object-cover shadow-sm" alt="Avatar" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-baseline gap-2">
                      <span class="text-sm font-bold font-heading text-[#1A1A1A] truncate">{{ item.displayName }}</span>
                      <span class="text-[10px] text-[#718096] font-body">{{ item.timestamp | date:'dd.MM. HH:mm' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-[#2D3748] truncate">
                      <button 
                        (click)="openPlanPreview(item)"
                        class="highlighter-yellow font-heading font-bold text-xs hover:underline truncate text-left"
                      >
                        {{ item.details.workoutName }}
                      </button>
                      <span class="text-[11px] text-[#718096] font-body">({{ item.details.detailsString || item.details.xpGained + ' XP' }})</span>
                    </div>
                  </div>
                </div>

                <button 
                  (click)="openPlanPreview(item)"
                  class="p-1 text-[#2D3748] hover:text-black font-heading font-bold text-lg ml-2"
                  title="Plan anzeigen"
                >
                  ›
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="p-6 text-center text-[#718096] text-xs font-body border border-dashed border-[#2D3748]/20 rounded-xl bg-[#FAF8F2]">
            Noch keine Aktivitäten von deinen Freunden. Absolviere ein Training, um den Notizbuch-Feed zu füllen!
          </div>
        }
      </div>

      <!-- 5️⃣ Analytics & Charts Section (Notebook Style) -->
      <div class="notebook-card p-4 rounded-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-[#2D3748]/15 pb-2">
          <div class="flex items-center gap-2">
            <img src="assets/icons/Analytics-Graph-Bar-Line--Streamline-Freehand.png" class="w-6 h-6 object-contain" alt="Statistiken" />
            <h3 class="text-lg font-bold font-heading text-[#1A1A1A] uppercase tracking-wide">STATISTIKEN & ANALYTICS</h3>
          </div>
          <span class="text-[10px] font-heading font-bold px-2 py-0.5 rounded highlighter-yellow border border-[#2D3748]/30 text-[#1A1A1A]">
            Fortschritt
          </span>
        </div>

        @if (logs().length > 0) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- Chart 1: Gesamtvolumen -->
            <div class="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15">
              <div class="flex items-center justify-between mb-3 border-b border-[#2D3748]/10 pb-2">
                <div>
                  <h4 class="text-base font-bold font-heading text-[#1A1A1A]">Gesamtvolumen Entwicklung</h4>
                  <p class="text-xs text-[#718096] font-body">Volumen in kg über die Zeit</p>
                </div>
                <span class="text-[10px] font-heading font-bold px-2 py-0.5 rounded bg-[#FEF08A] border border-[#2D3748]/20 text-[#1A1A1A]">Volumen</span>
              </div>
              <div class="h-56 min-h-[220px] relative chart-container">
                <canvas baseChart
                  [data]="volumeChartData()"
                  [options]="chartOptions"
                  [type]="'line'">
                </canvas>
              </div>
            </div>

            <!-- Chart 2: Kraftzuwachs -->
            <div class="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15">
              <div class="flex items-center justify-between mb-3 border-b border-[#2D3748]/10 pb-2">
                <div>
                  <h4 class="text-base font-bold font-heading text-[#1A1A1A]">Kraftzuwachs Hauptübungen</h4>
                  <p class="text-xs text-[#718096] font-body">Maximales Arbeitsgewicht in kg</p>
                </div>
                <span class="text-[10px] font-heading font-bold px-2 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-800">Max Weight</span>
              </div>
              <div class="h-56 min-h-[220px] relative chart-container">
                <canvas baseChart
                  [data]="strengthChartData()"
                  [options]="chartOptions"
                  [type]="'line'">
                </canvas>
              </div>
            </div>
          </div>
        } @else {
          <!-- Empty State when no logs present on this device -->
          <div class="p-6 text-center space-y-3 bg-[#FAF8F2] border border-dashed border-[#2D3748]/20 rounded-xl">
            <img src="assets/icons/Analytics-Graph-Bar-Line--Streamline-Freehand.png" class="w-12 h-12 mx-auto opacity-60 object-contain" alt="Statistiken" />
            <div>
              <h4 class="text-base font-bold font-heading text-[#1A1A1A]">Noch keine Statistik-Daten auf diesem Gerät</h4>
              <p class="text-xs text-[#718096] font-body max-w-md mx-auto mt-1">
                Sobald du Workouts absolvierst, werden deine Kraftzuwächse & Volumen-Diagramme hier automatisch gezeichnet.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button 
                (click)="generateMockData()"
                class="notebook-btn-primary px-4 py-2 rounded-xl text-sm font-heading shadow-sm"
              >
                Test-Statistiken laden (3 Monate Daten)
              </button>
              <a 
                routerLink="/plans"
                class="notebook-btn-outline px-4 py-2 rounded-xl text-sm font-heading"
              >
                Erstes Training starten
              </a>
            </div>
          </div>
        }
      </div>

    </div>

    <!-- PLAN PREVIEW & COPY MODAL -->
    @if (selectedFeedItem()) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="notebook-card rounded-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 relative border-2 border-[#2D3748] shadow-2xl bg-[#FFFFFF]">
          
          <!-- Close button -->
          <button 
            (click)="closePlanPreview()"
            class="absolute top-4 right-4 text-[#718096] hover:text-black font-heading text-xl p-1 rounded-lg"
          >
            ✕
          </button>

          @if (isLoadingPlan()) {
            <div class="py-10 text-center text-[#718096] font-body text-sm">
              Lade Notizbuch Plan-Details...
            </div>
          } @else {
            @if (previewPlan(); as plan) {
              
              <!-- Header -->
              <div class="space-y-1 pr-6 border-b border-[#2D3748]/15 pb-3">
                <div class="flex items-center gap-2">
                  <span class="highlighter-yellow text-[10px] font-bold font-heading uppercase">
                    {{ plan.isPublic ? 'Öffentlicher Plan' : 'Eigener Plan' }}
                  </span>
                  <span class="text-xs text-[#718096] font-body">von {{ selectedFeedItem()?.displayName }}</span>
                </div>
                <h2 class="text-2xl font-bold text-[#1A1A1A] font-heading mt-1">{{ plan.name }}</h2>
                @if (plan.description) {
                  <p class="text-xs text-[#718096] font-body mt-1 leading-relaxed">{{ plan.description }}</p>
                }
              </div>

              <!-- Compact Exercises & Sets Overview List -->
              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <span class="text-xs font-bold font-heading text-[#1A1A1A] block">Enthaltene Übungen & Gewichte ({{ plan.exercises.length }})</span>
                @for (ex of plan.exercises; track ex.id || idx; let idx = $index) {
                  <div class="p-2.5 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold text-[#1A1A1A] font-heading">{{ idx + 1 }}. {{ ex.name }}</span>
                      <span class="text-xs font-body font-bold text-[#d97706]">{{ ex.sets.length }} {{ ex.sets.length === 1 ? 'Satz' : 'Sätze' }}</span>
                    </div>
                    <!-- Detailed sets overview -->
                    <div class="flex flex-wrap gap-1">
                      @for (s of ex.sets; track setIdx; let setIdx = $index) {
                        <span class="text-xs font-body px-2 py-0.5 rounded bg-white border border-[#2D3748]/20 text-[#1A1A1A]">
                          S{{ setIdx + 1 }}: <strong>{{ s.reps }}×</strong> <span class="font-bold text-[#0284c7]">{{ s.weight }}kg</span>
                        </span>
                      }
                    </div>
                  </div>
                }
                @if (plan.exercises.length === 0) {
                  <div class="p-4 rounded-xl bg-[#FAF8F2] border border-[#2D3748]/15 text-center text-xs text-[#718096] font-body">
                    Keine Übungs-Details verfügbar.
                  </div>
                }
              </div>

              <!-- Copy Action Button -->
              <div class="pt-3 border-t border-[#2D3748]/15 flex gap-3">
                <button 
                  (click)="copyPlanToMyPlans(plan)"
                  class="notebook-btn-primary flex-1 py-3 rounded-xl text-base font-heading shadow-sm flex items-center justify-center gap-2"
                >
                  <img src="assets/icons/Copy-Paste-Clipboard--Streamline-Freehand.png" class="w-5 h-5 object-contain" alt="Kopieren" />
                  <span>Plan zu meinen Plänen kopieren</span>
                </button>
              </div>

            } @else {
              <!-- Private Plan Info -->
              <div class="text-center py-6 space-y-3">
                <div class="w-12 h-12 rounded-2xl bg-[#FAF8F2] border border-[#2D3748]/20 flex items-center justify-center mx-auto text-xl">
                  🔒
                </div>
                <h3 class="text-lg font-bold text-[#1A1A1A] font-heading">Privater Trainingsplan</h3>
                <p class="text-xs text-[#718096] font-body max-w-xs mx-auto leading-relaxed">
                  Dieser Trainingsplan wurde von <span class="font-bold text-[#1A1A1A]">{{ selectedFeedItem()?.displayName }}</span> als privat markiert.
                </p>
                <button 
                  (click)="closePlanPreview()"
                  class="notebook-btn-outline px-6 py-2 rounded-xl text-sm font-heading mt-2"
                >
                  Schließen
                </button>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: []
})
export class DashboardComponent implements OnDestroy {
  private authService = inject(AuthService);
  public workoutService = inject(WorkoutService);
  private friendsService = inject(FriendsService);
  private mockDataService = inject(MockDataService);
  private firestore = inject(Firestore, { optional: true });

  currentUser = this.authService.currentUser;
  logs = this.workoutService.logs;

  // Activity Feed Signals & Modals
  activityFeedItems = signal<ActivityFeedItem[]>([]);
  selectedFeedItem = signal<ActivityFeedItem | null>(null);
  previewPlan = signal<WorkoutPlan | null>(null);
  isPlanPrivate = signal<boolean>(false);
  isLoadingPlan = signal<boolean>(false);
  toastMessage = signal<string | null>(null);

  private unsubFeed: (() => void) | null = null;

  // KPIs
  workoutCount = computed(() => this.logs().length);
  
  exerciseCount = computed(() => {
    const plans = this.workoutService.plans();
    let count = 0;
    plans.forEach(p => count += p.exercises.length);
    return count || 7;
  });

  totalVolumeTons = computed(() => {
    let volumeKg = 0;
    this.logs().forEach(log => {
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          volumeKg += s.reps * s.weight;
        });
      });
    });
    return volumeKg / 1000;
  });

  lastActiveFormatted = computed(() => {
    const user = this.currentUser();
    if (!user || !user.stats.lastActive) return '-';
    const date = new Date(user.stats.lastActive);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  });

  lastWorkoutLog = computed(() => {
    const list = this.logs();
    return list.length > 0 ? list[0] : null;
  });

  lastWorkoutDateFormatted = computed(() => {
    const log = this.lastWorkoutLog();
    if (!log) return null;
    const d = new Date(log.date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  });

  lastWorkoutName = computed(() => {
    const log = this.lastWorkoutLog();
    return log ? log.planName : null;
  });

  lastWorkoutMovedWeightFormatted = computed(() => {
    const log = this.lastWorkoutLog();
    if (!log) return null;
    let vol = 0;
    log.exercises.forEach(ex => {
      ex.sets.forEach(s => vol += s.reps * s.weight);
    });
    return `${vol.toLocaleString('de-DE')} kg bewegt`;
  });

  // Gamification calculations
  currentLevelXpStart = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const lvl = user.stats.level;
    return Math.pow(lvl - 1, 2) * 100;
  });

  nextLevelXpStart = computed(() => {
    const user = this.currentUser();
    if (!user) return 100;
    const lvl = user.stats.level;
    return Math.pow(lvl, 2) * 100;
  });

  xpNeededForNextLevel = computed(() => {
    const user = this.currentUser();
    if (!user) return 100;
    return this.nextLevelXpStart() - user.stats.xp;
  });

  levelProgressPercent = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    const range = this.nextLevelXpStart() - this.currentLevelXpStart();
    const relativeXp = user.stats.xp - this.currentLevelXpStart();
    return Math.max(0, Math.min(100, Math.round((relativeXp / range) * 100)));
  });

  // Chart configuration options
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#1A1A1A', font: { family: 'Patrick Hand', size: 13, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#1A1A1A',
        bodyColor: '#1A1A1A',
        titleFont: { family: 'Patrick Hand', size: 14, weight: 'bold' },
        bodyFont: { family: 'Kalam', size: 12 },
        borderColor: '#2D3748',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#718096', font: { family: 'Patrick Hand', size: 12 } }
      },
      y: {
        grid: { color: 'rgba(45, 55, 72, 0.15)' },
        ticks: { color: '#718096', font: { family: 'Patrick Hand', size: 12 } }
      }
    }
  };

  generateMockData() {
    this.mockDataService.generateThreeMonthsMockData();
    this.showToast('3 Monate Test-Statistiken geladen! 📈');
  }

  constructor() {
    this.loadActivityFeed();
    
    // Auto-update feed when friends or logs change
    effect(() => {
      if (this.currentUser() || this.friendsService.friends().length >= 0) {
        this.loadActivityFeed();
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubFeed) {
      this.unsubFeed();
    }
  }

  private isFirebaseConfigured(): boolean {
    return !!(environment.firebase.apiKey && environment.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY');
  }

  loadActivityFeed() {
    const user = this.currentUser();
    const userId = user ? user.uid : 'local_guest';

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      if (this.unsubFeed) { this.unsubFeed(); }

      const feedRef = collection(this.firestore, 'activity_feed');
      const q = query(feedRef, orderBy('timestamp', 'desc'), limit(30));

      this.unsubFeed = onSnapshot(q, (snapshot) => {
        const items: ActivityFeedItem[] = [];
        const friendIds = new Set(this.friendsService.friends().map(f => f.profile.uid));
        friendIds.add(userId);

        snapshot.forEach(docSnap => {
          const item = docSnap.data() as ActivityFeedItem;
          if (friendIds.has(item.userId) || item.userId === userId || friendIds.size <= 1) {
            items.push(item);
          }
        });

        this.activityFeedItems.set(items);
        localStorage.setItem('hebewerk_activity_feed', JSON.stringify(items));
      }, (err) => {
        console.warn('Firestore activity_feed listener error', err);
        this.loadLocalFeed();
      });
      return;
    }

    this.loadLocalFeed();
  }

  private loadLocalFeed() {
    const local = localStorage.getItem('hebewerk_activity_feed') || localStorage.getItem('gym_activity_feed');
    this.activityFeedItems.set(local ? JSON.parse(local) : []);
  }

  async openPlanPreview(item: ActivityFeedItem) {
    this.selectedFeedItem.set(item);
    this.previewPlan.set(null);
    this.isPlanPrivate.set(false);
    this.isLoadingPlan.set(true);

    const planId = item.details.planId;
    const user = this.currentUser();
    const isMine = !!(user && (item.userId === user.uid));

    // 1. Search user's own plans
    let found = planId ? this.workoutService.plans().find(p => p.id === planId) : undefined;

    // 2. Search friends' public plans
    if (!found && planId) {
      for (const friend of this.friendsService.friends()) {
        const p = friend.publicPlans.find(plan => plan.id === planId);
        if (p) {
          found = p;
          break;
        }
      }
    }

    // 3. Try fetching from Firestore
    if (!found && planId && this.firestore && this.isFirebaseConfigured()) {
      try {
        const planDocRef = doc(this.firestore, `workout_plans/${planId}`);
        const snap = await getDoc(planDocRef);
        if (snap.exists()) {
          found = snap.data() as WorkoutPlan;
        }
      } catch (e) {
        console.warn('Error fetching plan from Firestore', e);
      }
    }

    // 4. Construct fallback plan from embedded activity item exercises if not found in store
    if (!found && item.details.exercises && item.details.exercises.length > 0) {
      const convertedExercises: Exercise[] = item.details.exercises.map((ex, idx) => ({
        id: 'ex_feed_' + idx,
        name: ex.name,
        sets: ex.sets.map(s => ({
          reps: s.reps,
          weight: s.weight,
          restSeconds: 90
        }))
      }));

      found = {
        id: planId || 'plan_feed_' + Math.random().toString(36).substring(2, 7),
        userId: item.userId,
        name: item.details.workoutName,
        description: `Absolvierter Trainingsplan von ${item.displayName}`,
        isPublic: true,
        exercises: convertedExercises
      };
    }

    this.isLoadingPlan.set(false);

    if (isMine) {
      if (found) {
        this.previewPlan.set(found);
      } else {
        this.previewPlan.set({
          id: planId || 'plan_own',
          userId: user!.uid,
          name: item.details.workoutName,
          description: 'Absolviertes Training aus deiner Historie',
          isPublic: true,
          exercises: []
        });
      }
    } else if (found && (found.isPublic !== false)) {
      this.previewPlan.set(found);
    } else {
      this.isPlanPrivate.set(true);
    }
  }

  closePlanPreview() {
    this.selectedFeedItem.set(null);
    this.previewPlan.set(null);
    this.isPlanPrivate.set(false);
  }

  copyPlanToMyPlans(plan: WorkoutPlan) {
    const user = this.currentUser();
    if (!user) return;

    const newPlan: WorkoutPlan = {
      ...JSON.parse(JSON.stringify(plan)),
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      name: plan.name + ' (Kopie)',
      isPublic: false
    };

    this.workoutService.savePlan(newPlan);
    this.closePlanPreview();
    this.showToast(`Plan '${newPlan.name}' wurde zu deinen Plänen hinzugefügt! 🚀`);
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4000);
  }

  // --- Charts calculations ---
  volumeChartData = computed<ChartConfiguration['data']>(() => {
    const sorted = [...this.logs()].reverse();
    const labels = sorted.map(log => {
      const d = new Date(log.date);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const datasetVolume = sorted.map(log => {
      let vol = 0;
      log.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          vol += s.reps * s.weight;
        });
      });
      return vol;
    });

    return {
      labels,
      datasets: [
        {
          data: datasetVolume,
          label: 'Volumen (kg)',
          borderColor: '#ff9f1c',
          backgroundColor: 'rgba(255, 159, 28, 0.12)',
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: '#ffbf00',
          pointHoverRadius: 6
        }
      ]
    };
  });

  strengthChartData = computed<ChartConfiguration['data']>(() => {
    const sorted = [...this.logs()].reverse();
    const labels = sorted.map(log => {
      const d = new Date(log.date);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    });

    const squatData = sorted.map(log => {
      const squatEx = log.exercises.find(ex => ex.name.toLowerCase().includes('kniebeugen') || ex.name.toLowerCase().includes('squat'));
      if (!squatEx) return null;
      return Math.max(...squatEx.sets.map(s => s.weight));
    });

    const benchData = sorted.map(log => {
      const benchEx = log.exercises.find(ex => ex.name.toLowerCase().includes('bankdrücken') || ex.name.toLowerCase().includes('bench'));
      if (!benchEx) return null;
      return Math.max(...benchEx.sets.map(s => s.weight));
    });

    return {
      labels,
      datasets: [
        {
          data: squatData,
          label: 'Kniebeugen (kg)',
          borderColor: '#ff9f1c',
          backgroundColor: 'rgba(255, 159, 28, 0.2)',
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: '#ffbf00'
        },
        {
          data: benchData,
          label: 'Bankdrücken (kg)',
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.2)',
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: '#00e5ff'
        }
      ]
    };
  });
}
