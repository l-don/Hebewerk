import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { WorkoutPlan, WorkoutLog, Exercise, ExerciseSet, LoggedExercise, LoggedSet } from '../models/gym.models';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private authService = inject(AuthService);

  // Reactive signals
  private _plans = signal<WorkoutPlan[]>([]);
  readonly plans = computed(() => this._plans());

  private _logs = signal<WorkoutLog[]>([]);
  readonly logs = computed(() => this._logs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  constructor() {
    // Load plans and logs when user changes
    // Signals run reactive context, but we'll load once in constructor and on login change
    this.initializeData();
  }

  initializeData() {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    // 1. Load plans
    let storedPlans = localStorage.getItem(`gym_plans_${userId}`);
    if (storedPlans) {
      try {
        this._plans.set(JSON.parse(storedPlans));
      } catch (e) {
        this.setDefaultPlans(userId);
      }
    } else {
      this.setDefaultPlans(userId);
    }

    // 2. Load logs
    let storedLogs = localStorage.getItem(`gym_logs_${userId}`);
    if (storedLogs) {
      try {
        this._logs.set(JSON.parse(storedLogs));
      } catch (e) {
        this._logs.set([]);
      }
    } else {
      this._logs.set([]);
    }
  }

  private setDefaultPlans(userId: string) {
    const defaultPlans: WorkoutPlan[] = [
      {
        id: 'plan_full_body',
        userId: userId,
        name: 'Ganzkörper Krafttraining',
        description: 'Effektiver Ganzkörperplan für Muskelaufbau und Grundkraft. 2-3x pro Woche ausführen.',
        isPublic: true,
        exercises: [
          {
            id: 'ex_squat',
            name: 'Kniebeugen (Squat)',
            sets: [
              { reps: 8, weight: 60, restSeconds: 120 },
              { reps: 8, weight: 60, restSeconds: 120 },
              { reps: 8, weight: 60, restSeconds: 120 }
            ]
          },
          {
            id: 'ex_bench',
            name: 'Bankdrücken (Bench Press)',
            sets: [
              { reps: 8, weight: 50, restSeconds: 90 },
              { reps: 8, weight: 50, restSeconds: 90 },
              { reps: 8, weight: 50, restSeconds: 90 }
            ]
          },
          {
            id: 'ex_row',
            name: 'Langhantelrudern (Row)',
            sets: [
              { reps: 8, weight: 40, restSeconds: 90 },
              { reps: 8, weight: 40, restSeconds: 90 },
              { reps: 8, weight: 40, restSeconds: 90 }
            ]
          },
          {
            id: 'ex_overhead',
            name: 'Schulterdrücken (Overhead Press)',
            sets: [
              { reps: 10, weight: 30, restSeconds: 90 },
              { reps: 10, weight: 30, restSeconds: 90 }
            ]
          }
        ]
      },
      {
        id: 'plan_upper_body',
        userId: userId,
        name: 'Oberkörper Power-Split',
        description: 'Fokus auf Brust, Rücken, Schultern und Arme. Ideal für Splits.',
        isPublic: false,
        exercises: [
          {
            id: 'ex_pullup',
            name: 'Klimmzüge (Pull-ups)',
            sets: [
              { reps: 8, weight: 0, restSeconds: 120 },
              { reps: 8, weight: 0, restSeconds: 120 },
              { reps: 6, weight: 0, restSeconds: 120 }
            ]
          },
          {
            id: 'ex_incline_db',
            name: 'Schrägbankdrücken (Dumbbell Press)',
            sets: [
              { reps: 10, weight: 22, restSeconds: 90 },
              { reps: 10, weight: 22, restSeconds: 90 },
              { reps: 10, weight: 22, restSeconds: 90 }
            ]
          },
          {
            id: 'ex_lat_raise',
            name: 'Seitheben (Lateral Raise)',
            sets: [
              { reps: 12, weight: 8, restSeconds: 60 },
              { reps: 12, weight: 8, restSeconds: 60 }
            ]
          }
        ]
      }
    ];
    this._plans.set(defaultPlans);
    this.savePlans(userId, defaultPlans);
  }

  // --- CRUD Plans ---
  savePlan(plan: WorkoutPlan): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    let currentPlans = [...this._plans()];
    const index = currentPlans.findIndex(p => p.id === plan.id);

    if (index > -1) {
      currentPlans[index] = plan;
    } else {
      plan.id = plan.id || 'plan_' + Math.random().toString(36).substring(2, 9);
      plan.userId = userId;
      currentPlans.push(plan);
    }

    this._plans.set(currentPlans);
    this.savePlans(userId, currentPlans);
  }

  deletePlan(planId: string): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    const currentPlans = this._plans().filter(p => p.id !== planId);
    this._plans.set(currentPlans);
    this.savePlans(userId, currentPlans);
  }

  private savePlans(userId: string, plans: WorkoutPlan[]): void {
    localStorage.setItem(`gym_plans_${userId}`, JSON.stringify(plans));
  }

  // --- CRUD Logs ---
  logWorkout(log: WorkoutLog): number {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    // 1. Calculate XP Gained
    // XP = (sets * 10) + (volume / 100)
    let totalSets = 0;
    let totalVolume = 0;

    log.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalSets++;
        totalVolume += set.reps * set.weight;
      });
    });

    const xpGained = Math.round((totalSets * 10) + (totalVolume / 100));
    log.xpGained = xpGained;
    log.id = log.id || 'log_' + Math.random().toString(36).substring(2, 9);
    log.userId = userId;
    log.date = log.date || new Date().toISOString();

    // 2. Save log
    const currentLogs = [log, ...this._logs()];
    this._logs.set(currentLogs);
    localStorage.setItem(`gym_logs_${userId}`, JSON.stringify(currentLogs));

    // 3. Update User Stats if authenticated
    if (user) {
      this.authService.updateStats(xpGained);
    }

    // 4. Update Activity Feed
    this.addToActivityFeed(log, xpGained);

    return xpGained;
  }

  // Helper to load previous logged exercise sets for reference
  getPreviousWorkoutForPlan(planId: string): WorkoutLog | null {
    const matchingLogs = this._logs().filter(log => log.planId === planId);
    return matchingLogs.length > 0 ? matchingLogs[0] : null;
  }

  // Set local logs manually (used by mock data service)
  setLogs(logs: WorkoutLog[]): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';
    
    this._logs.set(logs);
    localStorage.setItem(`gym_logs_${userId}`, JSON.stringify(logs));
  }

  clearLogs(): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';
    
    this._logs.set([]);
    localStorage.removeItem(`gym_logs_${userId}`);

    // Clean stats of local user too
    if (user) {
      const resetUser = {
        ...user,
        stats: {
          level: 1,
          xp: 0,
          currentStreak: 0,
          lastActive: new Date().toISOString()
        }
      };
      localStorage.setItem('gym_tracker_user', JSON.stringify(resetUser));
      this.authService.loginWithEmail(user.displayName + '@gym.com', 'dummy').catch(() => {});
    }
  }

  private addToActivityFeed(log: WorkoutLog, xpGained: number) {
    const user = this.authService.currentUser();
    const displayName = user ? user.displayName : 'Gast Athlet';
    const photoURL = user ? user.photoURL : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest';

    const feed: any[] = JSON.parse(localStorage.getItem('gym_activity_feed') || '[]');
    const newItem = {
      id: 'feed_' + Math.random().toString(36).substring(2, 9),
      userId: user ? user.uid : 'guest',
      displayName,
      photoURL,
      type: 'workout_completed',
      timestamp: new Date().toISOString(),
      details: {
        workoutName: log.planName,
        xpGained,
        detailsString: `${log.exercises.length} Übungen in ${log.durationMinutes} min absolviert`
      }
    };
    feed.unshift(newItem);
    localStorage.setItem('gym_activity_feed', JSON.stringify(feed.slice(0, 50))); // Keep last 50
  }
}
