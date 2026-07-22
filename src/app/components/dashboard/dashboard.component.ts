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
          <h1 class="text-3xl font-extrabold tracking-tight text-white font-display">Willkommen zurück, <span class="text-gradient">{{ currentUser()?.displayName }}</span>!</h1>
          <p class="text-sm text-slate-400 mt-1">Hier ist deine Trainingsübersicht für heute.</p>
        </div>
        
        <!-- Dev Options Glass Panel -->
        <div class="flex items-center gap-3 p-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm self-start md:self-center">
          <button 
            (click)="generateMockData()"
            class="px-4 py-2 text-xs font-bold rounded-xl bg-neon-cyan/15 hover:bg-neon-cyan/25 border border-neon-cyan/30 text-neon-cyan transition-all uppercase tracking-wide active:scale-95"
          >
            Mock-Daten laden
          </button>
          <button 
            (click)="clearAllLogs()"
            class="px-4 py-2 text-xs font-bold rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all uppercase tracking-wide active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- User Profile Gamification Dashboard -->
      @if (currentUser(); as user) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Level & XP Card -->
          <div class="glass-card rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Dein Level</span>
                <h3 class="text-4xl font-extrabold text-white mt-1 glow-text-mint">Lvl {{ user.stats.level }}</h3>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Erfahrungspunkte (XP)</span>
                <p class="text-sm font-semibold text-slate-200 mt-1">{{ user.stats.xp }} XP Gesamt</p>
              </div>
            </div>
            
            <!-- XP Progress Bar -->
            <div>
              <div class="flex justify-between text-xs font-bold mb-1.5 text-slate-400">
                <span>{{ currentLevelXpStart() }} XP</span>
                <span class="text-neon-mint">{{ xpNeededForNextLevel() }} XP bis Level {{ user.stats.level + 1 }}</span>
                <span>{{ nextLevelXpStart() }} XP</span>
              </div>
              <div class="w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  class="h-full bg-gradient-accent rounded-full glow-mint transition-all duration-1000"
                  [style.width.%]="levelProgressPercent()"
                ></div>
              </div>
            </div>
          </div>

          <!-- Streaks & Stats Card -->
          <div class="glass-card rounded-2xl p-6 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg relative shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-slate-950 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <!-- Spark glow -->
              <span class="absolute -top-1 -right-1 flex h-4 w-4">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Aktivitäts-Streak</span>
              <h3 class="text-3xl font-extrabold text-white mt-1">{{ user.stats.currentStreak }} {{ user.stats.currentStreak === 1 ? 'Woche' : 'Wochen' }}</h3>
              <p class="text-xs text-slate-400 mt-1">
                @if (user.stats.currentStreak > 0) {
                  Halte die Flamme am Brennen!
                } @else {
                  Starte dein erstes Training!
                }
              </p>
            </div>
          </div>
        </div>
      }

      <!-- KPI Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-card rounded-xl p-4 text-center">
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gesamte Workouts</span>
          <p class="text-2xl font-black text-white mt-1 glow-text-cyan">{{ workoutCount() }}</p>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gesamtvolumen (Tonnen)</span>
          <p class="text-2xl font-black text-white mt-1">{{ totalVolumeTons() | number:'1.1-2' }} t</p>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Übungen im System</span>
          <p class="text-2xl font-black text-white mt-1">{{ exerciseCount() }}</p>
        </div>
        <div class="glass-card rounded-xl p-4 text-center">
          <span class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Letzte Aktivität</span>
          <p class="text-sm font-bold text-white mt-2 truncate">{{ lastActiveFormatted() }}</p>
        </div>
      </div>

      <!-- Quick Action / Start Workout -->
      <div class="glass-card rounded-2xl p-6 bg-gradient-to-r from-slate-900/60 to-slate-900/40 border border-neon-cyan/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 class="text-lg font-bold text-white">Bereit für dein nächstes Training?</h3>
          <p class="text-sm text-slate-400 mt-1">Wähle einen deiner erstellten Pläne und starte das Tracking deiner Sätze.</p>
        </div>
        <a 
          routerLink="/plans"
          class="px-6 py-3 bg-gradient-accent text-slate-950 font-extrabold rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm shadow-md glow-mint"
        >
          Training starten
        </a>
      </div>

      <!-- Chart.js Analysis Section -->
      @if (workoutCount() > 0) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Volume Chart -->
          <div class="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 class="text-base font-bold text-white font-display">Trainingsvolumen (Gesamt)</h3>
              <p class="text-xs text-slate-400 mt-0.5">Summe aller Gewichte x Wiederholungen pro Training</p>
            </div>
            <div class="chart-container relative flex-1 mt-4">
              <canvas baseChart 
                [data]="volumeChartData()" 
                [options]="chartOptions" 
                [type]="'line'">
              </canvas>
            </div>
          </div>

          <!-- Strength Chart (1RM / Max weights for squat and bench) -->
          <div class="glass-card rounded-2xl p-5 flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 class="text-base font-bold text-white font-display">Kraftsteigerung (Squat / Bench)</h3>
              <p class="text-xs text-slate-400 mt-0.5">Maximales bewegtes Gewicht in Kniebeugen und Bankdrücken</p>
            </div>
            <div class="chart-container relative flex-1 mt-4">
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
  private workoutService = inject(WorkoutService);
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
          borderColor: '#00f5b8',
          backgroundColor: 'rgba(0, 245, 184, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: '#00f5b8',
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

    // Extract maximum weight for Kniebeugen and Bankdrücken
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
          data: squatData as any,
          label: 'Kniebeugen (Max kg)',
          borderColor: '#00d2ff',
          backgroundColor: 'transparent',
          tension: 0.2,
          borderWidth: 2,
          pointBackgroundColor: '#00d2ff',
          spanGaps: true
        },
        {
          data: benchData as any,
          label: 'Bankdrücken (Max kg)',
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          tension: 0.2,
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          spanGaps: true
        }
      ]
    };
  });
}
