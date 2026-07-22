import { Injectable, signal, computed } from '@angular/core';
import { UserProfile, UserStats } from '../models/gym.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Reactive signals for current user
  private _currentUser = signal<UserProfile | null>(null);
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const savedUser = localStorage.getItem('gym_tracker_user');
    if (savedUser) {
      try {
        this._currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('gym_tracker_user');
      }
    }
  }

  private saveSession(user: UserProfile) {
    this._currentUser.set(user);
    localStorage.setItem('gym_tracker_user', JSON.stringify(user));
  }

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    // Simulated delay for premium UX feel
    await new Promise(resolve => setTimeout(resolve, 800));

    // Basic email login simulation
    const defaultName = email.split('@')[0];
    const user: UserProfile = {
      uid: 'local_user_' + btoa(email).substring(0, 10),
      displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(defaultName)}`,
      createdAt: new Date().toISOString(),
      stats: {
        level: 1,
        xp: 0,
        currentStreak: 0,
        lastActive: new Date().toISOString()
      }
    };

    // If there is existing data in localstorage, use that stats instead
    const usersDb = this.getUsersDb();
    const existing = usersDb[user.uid];
    if (existing) {
      this.saveSession(existing);
      return existing;
    }

    usersDb[user.uid] = user;
    this.saveUsersDb(usersDb);
    this.saveSession(user);
    return user;
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user: UserProfile = {
      uid: 'local_user_' + btoa(email).substring(0, 10),
      displayName: displayName || email.split('@')[0],
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName || email)}`,
      createdAt: new Date().toISOString(),
      stats: {
        level: 1,
        xp: 0,
        currentStreak: 0,
        lastActive: new Date().toISOString()
      }
    };

    const usersDb = this.getUsersDb();
    usersDb[user.uid] = user;
    this.saveUsersDb(usersDb);
    this.saveSession(user);
    return user;
  }

  async loginWithGoogle(): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user: UserProfile = {
      uid: 'google_user_mock_123',
      displayName: 'Alex Athlete',
      photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
      createdAt: new Date().toISOString(),
      stats: {
        level: 4,
        xp: 1450,
        currentStreak: 3,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // active yesterday
      }
    };

    const usersDb = this.getUsersDb();
    const existing = usersDb[user.uid];
    if (existing) {
      this.saveSession(existing);
      return existing;
    }

    usersDb[user.uid] = user;
    this.saveUsersDb(usersDb);
    this.saveSession(user);
    return user;
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    this._currentUser.set(null);
    localStorage.removeItem('gym_tracker_user');
  }

  // Update user stats after a workout log
  updateStats(xpGained: number): UserStats {
    const user = this._currentUser();
    if (!user) throw new Error('No user is logged in');

    const now = new Date();
    const lastActiveDate = new Date(user.stats.lastActive);
    
    // Streak logic:
    // If active today: streak remains same
    // If active yesterday (difference between 24h and 48h): streak increments
    // If active longer ago: streak resets to 1
    const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let newStreak = user.stats.currentStreak;
    if (user.stats.currentStreak === 0) {
      newStreak = 1;
    } else if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }

    // Gamification level-up calculation
    // Level formula: level = floor(sqrt(xp / 100)) + 1
    // i.e., Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, Level 4: 900-1599 XP, etc.
    const newXp = user.stats.xp + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
    const oldLevel = user.stats.level;

    const updatedStats: UserStats = {
      level: newLevel,
      xp: newXp,
      currentStreak: newStreak,
      lastActive: now.toISOString()
    };

    const updatedUser: UserProfile = {
      ...user,
      stats: updatedStats
    };

    this.saveSession(updatedUser);

    // Save to users DB as well
    const usersDb = this.getUsersDb();
    usersDb[user.uid] = updatedUser;
    this.saveUsersDb(usersDb);

    if (newLevel > oldLevel) {
      // Trigger level up animation hook (handled by component listening)
      setTimeout(() => {
        try {
          (window as any).triggerConfetti?.();
        } catch(e) {}
      }, 100);
    }

    return updatedStats;
  }

  // Local Storage Database helpers
  private getUsersDb(): Record<string, UserProfile> {
    const db = localStorage.getItem('gym_tracker_users_db');
    return db ? JSON.parse(db) : {};
  }

  private saveUsersDb(db: Record<string, UserProfile>) {
    localStorage.setItem('gym_tracker_users_db', JSON.stringify(db));
  }
}
