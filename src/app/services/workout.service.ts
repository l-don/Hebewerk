import { Injectable, inject, signal, computed } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, query, where, deleteDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { WorkoutPlan, WorkoutLog } from '../models/gym.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private authService = inject(AuthService);
  private firestore = inject(Firestore, { optional: true });

  // Reactive signals
  private _plans = signal<WorkoutPlan[]>([]);
  readonly plans = computed(() => this._plans());

  private _logs = signal<WorkoutLog[]>([]);
  readonly logs = computed(() => this._logs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  constructor() {
    this.initializeData();
  }

  private isFirebaseConfigured(): boolean {
    return !!(environment.firebase.apiKey && environment.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY');
  }

  async initializeData() {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      try {
        // Fetch plans from Firestore
        const plansRef = collection(this.firestore, 'workout_plans');
        const qPlans = query(plansRef, where('userId', '==', userId));
        const snapPlans = await getDocs(qPlans);
        const fsPlans: WorkoutPlan[] = [];
        snapPlans.forEach(docSnap => fsPlans.push(docSnap.data() as WorkoutPlan));
        
        if (fsPlans.length > 0) {
          this._plans.set(fsPlans);
          localStorage.setItem(`hebewerk_plans_${userId}`, JSON.stringify(fsPlans));
        } else {
          this.setDefaultPlans(userId);
        }

        // Fetch logs from Firestore
        const logsRef = collection(this.firestore, 'workout_logs');
        const qLogs = query(logsRef, where('userId', '==', userId));
        const snapLogs = await getDocs(qLogs);
        const fsLogs: WorkoutLog[] = [];
        snapLogs.forEach(docSnap => fsLogs.push(docSnap.data() as WorkoutLog));
        this._logs.set(fsLogs);
        localStorage.setItem(`hebewerk_logs_${userId}`, JSON.stringify(fsLogs));

        return;
      } catch (e) {
        console.warn('Firestore initialization fallback to localStorage', e);
      }
    }

    // Local Storage Fallback
    let storedPlans = localStorage.getItem(`hebewerk_plans_${userId}`);
    if (storedPlans) {
      try {
        this._plans.set(JSON.parse(storedPlans));
      } catch (e) {
        this.setDefaultPlans(userId);
      }
    } else {
      this.setDefaultPlans(userId);
    }

    let storedLogs = localStorage.getItem(`hebewerk_logs_${userId}`);
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
  async savePlan(plan: WorkoutPlan): Promise<void> {
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

    // Sync to Firestore
    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      try {
        const planDocRef = doc(this.firestore, `workout_plans/${plan.id}`);
        await setDoc(planDocRef, plan);
      } catch (e) {
        console.warn('Firestore savePlan error', e);
      }
    }
  }

  async deletePlan(planId: string): Promise<void> {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    const currentPlans = this._plans().filter(p => p.id !== planId);
    this._plans.set(currentPlans);
    this.savePlans(userId, currentPlans);

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      try {
        const planDocRef = doc(this.firestore, `workout_plans/${planId}`);
        await deleteDoc(planDocRef);
      } catch (e) {
        console.warn('Firestore deletePlan error', e);
      }
    }
  }

  private savePlans(userId: string, plans: WorkoutPlan[]): void {
    localStorage.setItem(`hebewerk_plans_${userId}`, JSON.stringify(plans));
  }

  // --- CRUD Logs ---
  logWorkout(log: WorkoutLog): number {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

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

    const currentLogs = [log, ...this._logs()];
    this._logs.set(currentLogs);
    localStorage.setItem(`hebewerk_logs_${userId}`, JSON.stringify(currentLogs));

    if (user) {
      this.authService.updateStats(xpGained);
    }

    this.addToActivityFeed(log, xpGained);

    // Sync log to Firestore async
    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      const logDocRef = doc(this.firestore, `workout_logs/${log.id}`);
      setDoc(logDocRef, log).catch(err => console.warn('Firestore logWorkout error', err));
    }

    return xpGained;
  }

  getPreviousWorkoutForPlan(planId: string): WorkoutLog | null {
    const matchingLogs = this._logs().filter(log => log.planId === planId);
    return matchingLogs.length > 0 ? matchingLogs[0] : null;
  }

  setLogs(logs: WorkoutLog[]): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';
    
    this._logs.set(logs);
    localStorage.setItem(`hebewerk_logs_${userId}`, JSON.stringify(logs));

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      logs.forEach(log => {
        const logDocRef = doc(this.firestore!, `workout_logs/${log.id}`);
        setDoc(logDocRef, log).catch(e => {});
      });
    }
  }

  clearLogs(): void {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';
    
    this._logs.set([]);
    localStorage.removeItem(`hebewerk_logs_${userId}`);

    if (user) {
      const resetUser = {
        ...user,
        stats: { level: 1, xp: 0, currentStreak: 0, lastActive: new Date().toISOString() }
      };
      localStorage.setItem('hebewerk_user', JSON.stringify(resetUser));
      this.authService.loginWithEmail(user.displayName + '@hebewerk.de', 'dummy').catch(() => {});
    }
  }

  private addToActivityFeed(log: WorkoutLog, xpGained: number) {
    const user = this.authService.currentUser();
    const displayName = user ? user.displayName : 'Gast Athlet';
    const photoURL = user ? user.photoURL : 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guest';

    const feed: any[] = JSON.parse(localStorage.getItem('hebewerk_activity_feed') || '[]');
    const newItem = {
      id: 'feed_' + Math.random().toString(36).substring(2, 9),
      userId: user ? user.uid : 'guest',
      displayName,
      photoURL,
      type: 'workout_completed',
      timestamp: new Date().toISOString(),
      details: {
        planId: log.planId,
        workoutName: log.planName,
        xpGained,
        detailsString: `${log.exercises.length} Übungen in ${log.durationMinutes} min absolviert`
      }
    };
    feed.unshift(newItem);
    localStorage.setItem('hebewerk_activity_feed', JSON.stringify(feed.slice(0, 50)));

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      const feedDocRef = doc(this.firestore, `activity_feed/${newItem.id}`);
      setDoc(feedDocRef, newItem).catch(e => {});
    }
  }
}
