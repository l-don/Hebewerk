import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth.service';
import { WorkoutService } from '../../services/workout.service';
import { MockDataService } from '../../services/mock-data.service';
import { WorkoutLog } from '../../models/gym.models';

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
        
        <!-- Dev Options Industrial Panel -->
        <div class="flex items-center gap-3 p-2 bg-iron-900 border border-slate-800 rounded-xl self-start md:self-center">
          <button 
            (click)="generateMockData()"
            class="hebewerk-btn-cyan px-4 py-2 text-xs rounded-lg uppercase tracking-wide active:scale-95"
          >
            Mock-Daten laden
          </button>
          <button 
            (click)="clearAllLogs()"
            class="px-4 py-2 text-xs font-bold font-display rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all uppercase tracking-wide active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

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
      } @else {
        <div class="glass-card rounded-2xl p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 class="text-lg font-bold text-slate-300">Keine Trainingsdaten vorhanden</h3>
          <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Sobald du dein erstes Training absolviert hast, siehst du hier deine Leistungs- und Kraftentwicklungen.
            Oder verwende den <span class="text-neon-cyan font-semibold">Mock-Daten laden</span>-Schalter oben, um Testdaten zu simulieren.
          </p>
        </div>
      }

      <!-- Social Activity Feed (MVP Social Preview) -->
      <div class="glass-card rounded-2xl p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-white font-display">Aktivitäts-Feed</h3>
            <p class="text-xs text-slate-400 mt-0.5">Aktivitäten von dir und deinen (zukünftigen) Freunden</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold uppercase">Live Updates</span>
        </div>

        @if (activityFeedItems().length > 0) {
          <div class="space-y-4 max-h-80 overflow-y-auto pr-2">
            @for (item of activityFeedItems(); track item.id) {
              <div class="flex items-start gap-3.5 p-3 rounded-xl bg-slate-900/30 border border-slate-900/50 hover:bg-slate-900/50 transition-colors">
                <img [src]="item.photoURL" class="w-9 h-9 rounded-full border border-neon-cyan shrink-0 bg-slate-800" alt="Avatar" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-sm font-bold text-slate-200">{{ item.displayName }}</span>
                    <span class="text-[10px] text-slate-500 font-semibold">{{ item.timestamp | date:'dd.MM.HH:mm' }}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">
                    hat das Training <span class="text-neon-cyan font-bold">{{ item.details.workoutName }}</span> absolviert.
                  </p>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="text-[10px] font-bold text-neon-mint flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                      </svg>
                      +{{ item.details.xpGained }} XP
                    </span>
                    <span class="text-[10px] text-slate-500 font-medium">{{ item.details.detailsString }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="p-6 text-center text-slate-500 text-sm">
            Noch keine Aktivitäten vorhanden. Absolviere ein Training, um den Feed zu füllen!
          </div>
        }
      </div>

    </div>
  `,
  styles: []
})
export class DashboardComponent {
  private authService = inject(AuthService);
  public workoutService = inject(WorkoutService);
  private mockDataService = inject(MockDataService);

  currentUser = this.authService.currentUser;
  logs = this.workoutService.logs;

  // KPIs
  workoutCount = computed(() => this.logs().length);
  
  exerciseCount = computed(() => {
    const plans = this.workoutService.plans();
    let count = 0;
    plans.forEach(p => count += p.exercises.length);
    return count || 7; // fallback if no plans
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
    return volumeKg / 1000; // convert to metric tons
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

  // Activity Feed preview
  activityFeedItems = signal<any[]>([]);

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
    
    // Auto-update feed when logs change
    effect(() => {
      if (this.logs()) {
        this.loadActivityFeed();
      }
    });
  }

  loadActivityFeed() {
    const feed = localStorage.getItem('gym_activity_feed');
    this.activityFeedItems.set(feed ? JSON.parse(feed) : []);
  }

  generateMockData() {
    this.mockDataService.generateThreeMonthsMockData();
    this.loadActivityFeed();
  }

  clearAllLogs() {
    if (confirm('Bist du sicher, dass du deinen gesamten Verlauf und Level löschen möchtest?')) {
      this.workoutService.clearLogs();
      this.loadActivityFeed();
    }
  }

  // --- Charts calculations ---
  volumeChartData = computed<ChartConfiguration['data']>(() => {
    // Sort logs oldest to newest
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
