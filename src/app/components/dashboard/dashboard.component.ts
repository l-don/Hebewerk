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
    <div class="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      <!-- Top Header / Welcome -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-white font-display">WILLKOMMEN ZURÜCK, <span class="text-gradient-amber">{{ currentUser()?.displayName }}</span>!</h1>
          <p class="text-sm text-slate-400 mt-1">Deine Maschinen & Hebedaten im Überblick.</p>
        </div>
      </div>

      <!-- Toast Feedback -->
      @if (toastMessage()) {
        <div class="p-4 rounded-xl bg-forge-amber/15 border border-forge-amber/30 text-forge-amber text-sm font-bold font-mono flex items-center justify-between shadow-lg animate-fade-in">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ toastMessage() }}</span>
          </div>
          <button (click)="toastMessage.set(null)" class="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      }

      <!-- User Profile Gamification Dashboard -->
      @if (currentUser(); as user) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Level & XP Card -->
          <div class="hebewerk-card rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Dein Level</span>
                <h3 class="text-4xl font-extrabold text-white mt-1 text-gradient-amber font-display">LVL {{ user.stats.level }}</h3>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Erfahrungspunkte (XP)</span>
                <p class="text-sm font-bold text-slate-200 mt-1 font-mono">{{ user.stats.xp }} XP Gesamt</p>
              </div>
            </div>
            
            <!-- XP Progress Bar -->
            <div class="space-y-2">
              <div class="flex justify-between text-xs font-mono font-bold text-slate-300">
                <span>Fortschritt zu Lvl {{ user.stats.level + 1 }}</span>
                <span>{{ user.stats.xp - currentLevelXpStart() }} / {{ nextLevelXpStart() - currentLevelXpStart() }} XP</span>
              </div>
              <div class="w-full bg-iron-950 h-3.5 rounded-lg p-0.5 border border-slate-800">
                <div class="bg-gradient-to-r from-forge-gold to-forge-amber h-full rounded-md transition-all duration-700 shadow-sm" [style.width.%]="levelProgressPercent()"></div>
              </div>
            </div>
          </div>

          <!-- Streak Card -->
          <div class="hebewerk-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 w-28 h-28 bg-forge-amber/5 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Trainings-Streak</span>
              <div class="flex items-baseline gap-2 mt-2">
                <span class="text-4xl font-extrabold text-amber-400 font-mono">{{ user.stats.currentStreak }}</span>
                <span class="text-sm font-bold text-slate-300 uppercase font-display">Wochen</span>
              </div>
              <p class="text-xs text-slate-400 mt-2">Beständigkeit ist der Schlüssel für maximalen Kraftaufbau!</p>
            </div>
            <div class="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Zuletzt aktiv</span>
              <span class="font-mono font-bold text-slate-200">{{ lastActiveFormatted() }}</span>
            </div>
          </div>
        </div>
      }

      <!-- KPI Grid Overview -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="hebewerk-card rounded-xl p-4 border border-slate-800">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display block">Absolvierte Workouts</span>
          <span class="text-2xl font-extrabold text-white font-mono block mt-1">{{ workoutCount() }}</span>
        </div>

        <div class="hebewerk-card rounded-xl p-4 border border-slate-800">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display block">Gesamtvolumen</span>
          <span class="text-2xl font-extrabold text-forge-amber font-mono block mt-1">{{ totalVolumeTons() | number:'1.1-1' }} t</span>
        </div>

        <div class="hebewerk-card rounded-xl p-4 border border-slate-800">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display block">Verfügbare Pläne</span>
          <span class="text-2xl font-extrabold text-steel-cyan font-mono block mt-1">{{ workoutService.plans().length }}</span>
        </div>

        <div class="hebewerk-card rounded-xl p-4 border border-slate-800">
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display block">Übungsdatenbank</span>
          <span class="text-2xl font-extrabold text-slate-200 font-mono block mt-1">{{ exerciseCount() }}</span>
        </div>
      </div>

      <!-- Quick Action / Start Workout Banner -->
      <div class="hebewerk-card rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-forge-amber">
        <div class="space-y-1 text-center md:text-left">
          <span class="text-[10px] px-2.5 py-1 rounded bg-forge-amber/15 text-forge-amber font-extrabold uppercase tracking-wider font-mono">
            BEREIT FÜR DIE NÄCHSTE EINHEIT?
          </span>
          <h2 class="text-2xl font-black text-white font-display mt-2">Bereit das Eisen zu bewegen?</h2>
          <p class="text-sm text-slate-400">Starte jetzt dein geplantes Training und zeichne deine Gewichte auf.</p>
        </div>
        <a 
          routerLink="/plans"
          class="hebewerk-btn-amber px-8 py-3.5 rounded-xl text-sm font-extrabold shadow-lg shrink-0"
        >
          Training Jetzt Starten →
        </a>
      </div>

      <!-- Analytics & Charts Section -->
      @if (logs().length > 0) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Chart 1: Gesamtvolumen -->
          <div class="hebewerk-card rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-white font-display">Gesamtvolumen Entwicklung</h3>
                <p class="text-xs text-slate-400">Summe aus (Wiederholungen × Gewicht) in kg</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-iron-950 border border-slate-800 text-forge-amber font-mono font-bold">Volumen</span>
            </div>
            <div class="h-64 relative chart-container">
              <canvas baseChart
                [data]="volumeChartData()"
                [options]="chartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>

          <!-- Chart 2: Maximalgewicht (Kraftzuwachs) -->
          <div class="hebewerk-card rounded-2xl p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-white font-display">Kraftzuwachs Hauptübungen</h3>
                <p class="text-xs text-slate-400">Maximales Arbeitsgewicht in kg</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-iron-950 border border-slate-800 text-steel-cyan font-mono font-bold">Max Weight</span>
            </div>
            <div class="h-64 relative chart-container">
              <canvas baseChart
                [data]="strengthChartData()"
                [options]="chartOptions"
                [type]="'line'">
              </canvas>
            </div>
          </div>
        </div>
      }

      <!-- Real-Time Social Activity Feed -->
      <div class="hebewerk-card rounded-2xl p-6 space-y-4 border-l-4 border-l-steel-cyan">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h3 class="text-lg font-black text-white font-display uppercase">Aktivitäts-Feed</h3>
            <p class="text-xs text-slate-400 mt-0.5">Echtzeit-Aktivitäten von dir und deinen Freunden (Klicke auf Pläne zur Vorschau)</p>
          </div>
          <span class="text-[10px] px-2.5 py-1 rounded bg-iron-950 border border-slate-800 text-steel-cyan font-mono font-bold uppercase tracking-wider animate-pulse">
            ● Live Synchronisation
          </span>
        </div>

        @if (activityFeedItems().length > 0) {
          <div class="space-y-3 max-h-96 overflow-y-auto pr-1">
            @for (item of activityFeedItems(); track item.id) {
              <div class="flex items-start gap-3.5 p-3.5 rounded-xl bg-iron-950 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <img [src]="item.photoURL" class="w-10 h-10 rounded-xl border border-forge-amber shrink-0 bg-iron-900 shadow-md" alt="Avatar" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-sm font-bold text-white font-display">{{ item.displayName }}</span>
                    <span class="text-[10px] text-slate-400 font-mono font-bold">{{ item.timestamp | date:'dd.MM.HH:mm' }}</span>
                  </div>
                  <p class="text-xs text-slate-300 mt-1">
                    hat das Training 
                    <button 
                      (click)="openPlanPreview(item)"
                      class="text-forge-amber font-bold font-display hover:underline transition-all inline-flex items-center gap-1 text-left"
                      title="Klicken für Plan-Vorschau"
                    >
                      <span>{{ item.details.workoutName }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </button> 
                    absolviert.
                  </p>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                      </svg>
                      +{{ item.details.xpGained }} XP
                    </span>
                    <span class="text-[10px] text-slate-400 font-mono">{{ item.details.detailsString }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="p-8 text-center text-slate-400 text-sm font-mono border border-dashed border-slate-800 rounded-xl">
            Noch keine Aktivitäten von dir oder deinen Freunden vorhanden. Absolviere ein Training, um den Feed zu füllen!
          </div>
        }
      </div>

    </div>

    <!-- PLAN PREVIEW & COPY MODAL -->
    @if (selectedFeedItem()) {
      <div class="fixed inset-0 bg-iron-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
        <div class="hebewerk-card rounded-2xl p-6 md:p-8 w-full max-w-lg space-y-6 relative border-l-4 border-l-forge-amber shadow-2xl">
          
          <!-- Close button -->
          <button 
            (click)="closePlanPreview()"
            class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-iron-850"
          >
            ✕
          </button>

          @if (isLoadingPlan()) {
            <div class="py-12 text-center text-slate-400 font-mono text-sm">
              Lade Plan-Details...
            </div>
          } @else {
            @if (previewPlan(); as plan) {
              
              <!-- Header -->
              <div class="space-y-1 pr-6">
                <div class="flex items-center gap-2">
                  <span class="text-[9px] px-2 py-0.5 rounded uppercase font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {{ plan.isPublic ? 'Öffentlicher Plan' : 'Eigener Plan' }}
                  </span>
                  <span class="text-xs text-slate-400 font-mono">von {{ selectedFeedItem()?.displayName }}</span>
                </div>
                <h2 class="text-2xl font-black text-white font-display uppercase mt-1">{{ plan.name }}</h2>
                @if (plan.description) {
                  <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ plan.description }}</p>
                }
              </div>

              <!-- Compact Exercises & Sets Overview List -->
              <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display block">Enthaltene Übungen & Gewichte ({{ plan.exercises.length }})</span>
                @for (ex of plan.exercises; track ex.id || idx; let idx = $index) {
                  <div class="p-3 rounded-xl bg-iron-950 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold text-white font-display">{{ idx + 1 }}. {{ ex.name }}</span>
                      <span class="text-xs font-mono font-bold text-forge-amber">{{ ex.sets.length }} {{ ex.sets.length === 1 ? 'Satz' : 'Sätze' }}</span>
                    </div>
                    <!-- Detailed sets pill overview -->
                    <div class="flex flex-wrap gap-1.5">
                      @for (s of ex.sets; track setIdx; let setIdx = $index) {
                        <span class="text-[11px] font-mono px-2.5 py-1 rounded bg-iron-900 border border-slate-800 text-slate-300">
                          S{{ setIdx + 1 }}: <strong class="text-white">{{ s.reps }}×</strong> <span class="text-steel-cyan font-bold">{{ s.weight }}kg</span>
                        </span>
                      }
                    </div>
                  </div>
                }
                @if (plan.exercises.length === 0) {
                  <div class="p-4 rounded-xl bg-iron-950 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                    Keine Übungs-Details verfügbar.
                  </div>
                }
              </div>

              <!-- Copy Action Button -->
              <div class="pt-4 border-t border-slate-800/80 flex gap-3">
                <button 
                  (click)="copyPlanToMyPlans(plan)"
                  class="hebewerk-btn-amber flex-1 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Plan zu meinen Plänen kopieren</span>
                </button>
              </div>

            } @else {
              <!-- Private Plan Info -->
              <div class="text-center py-6 space-y-3">
                <div class="w-14 h-14 rounded-2xl bg-iron-950 border border-slate-800 text-forge-amber flex items-center justify-center mx-auto text-2xl">
                  🔒
                </div>
                <h3 class="text-lg font-bold text-white font-display uppercase">Privater Trainingsplan</h3>
                <p class="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Dieser Trainingsplan wurde von <span class="text-forge-amber font-bold">{{ selectedFeedItem()?.displayName }}</span> als <strong>PRIVAT</strong> markiert und kann nicht angezeigt oder kopiert werden.
                </p>
                <button 
                  (click)="closePlanPreview()"
                  class="hebewerk-btn-cyan px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider mt-2"
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
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: '#0e1322',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: '#1d263b',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
      },
      y: {
        grid: { color: 'rgba(29, 38, 59, 0.4)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 10 } }
      }
    }
  };

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
