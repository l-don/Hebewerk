import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { UserProfile, UserStats } from '../models/gym.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private afAuth = inject(Auth, { optional: true });
  private firestore = inject(Firestore, { optional: true });

  // Reactive signals for current user
  private _currentUser = signal<UserProfile | null>(null);
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    this.loadSession();
    this.listenToAuthChanges();
  }

  private isFirebaseConfigured(): boolean {
    return !!(environment.firebase.apiKey && environment.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY');
  }

  private listenToAuthChanges() {
    if (this.afAuth && this.isFirebaseConfigured()) {
      user(this.afAuth).subscribe(async (fbUser) => {
        if (fbUser) {
          const profile = await this.fetchOrCreateFirestoreUser(fbUser);
          this._currentUser.set(profile);
          localStorage.setItem('hebewerk_user', JSON.stringify(profile));
        }
      });
    }
  }

  private async fetchOrCreateFirestoreUser(fbUser: any): Promise<UserProfile> {
    if (!this.firestore) return this.createDefaultProfile(fbUser.uid, fbUser.displayName || 'Athlet', fbUser.email);

    const userDocRef = doc(this.firestore, `users/${fbUser.uid}`);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore fetch failed, using local profile', e);
    }

    const newProfile: UserProfile = {
      uid: fbUser.uid,
      displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Athlet',
      photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fbUser.uid)}`,
      createdAt: new Date().toISOString(),
      stats: {
        level: 1,
        xp: 0,
        currentStreak: 0,
        lastActive: new Date().toISOString()
      }
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (e) {
      console.warn('Firestore user doc creation failed', e);
    }

    return newProfile;
  }

  private createDefaultProfile(uid: string, name: string, email?: string): UserProfile {
    return {
      uid,
      displayName: name || 'Athlet',
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      createdAt: new Date().toISOString(),
      stats: {
        level: 1,
        xp: 0,
        currentStreak: 0,
        lastActive: new Date().toISOString()
      }
    };
  }

  private loadSession() {
    const savedUser = localStorage.getItem('hebewerk_user');
    if (savedUser) {
      try {
        this._currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('hebewerk_user');
      }
    }
  }

  private saveSession(user: UserProfile) {
    this._currentUser.set(user);
    localStorage.setItem('hebewerk_user', JSON.stringify(user));
    this.syncProfileToFirestore(user);
  }

  private async syncProfileToFirestore(user: UserProfile) {
    if (this.firestore && this.isFirebaseConfigured() && user.uid && !user.uid.startsWith('local_')) {
      try {
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        await setDoc(userDocRef, user, { merge: true });
      } catch (e) {
        console.warn('Sync user profile to Firestore failed', e);
      }
    }
  }

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    if (this.afAuth && this.isFirebaseConfigured()) {
      const credential = await signInWithEmailAndPassword(this.afAuth, email, password);
      const profile = await this.fetchOrCreateFirestoreUser(credential.user);
      this.saveSession(profile);
      return profile;
    }

    // Local Fallback simulation
    await new Promise(resolve => setTimeout(resolve, 600));
    const defaultName = email.split('@')[0];
    const uid = 'local_user_' + btoa(email).substring(0, 10);
    const usersDb = this.getUsersDb();
    let user = usersDb[uid];

    if (!user) {
      user = this.createDefaultProfile(uid, defaultName.charAt(0).toUpperCase() + defaultName.slice(1), email);
      usersDb[uid] = user;
      this.saveUsersDb(usersDb);
    }

    this.saveSession(user);
    return user;
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (this.afAuth && this.isFirebaseConfigured()) {
      const credential = await createUserWithEmailAndPassword(this.afAuth, email, password);
      const profile: UserProfile = {
        uid: credential.user.uid,
        displayName: displayName || email.split('@')[0],
        photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName || email)}`,
        createdAt: new Date().toISOString(),
        stats: { level: 1, xp: 0, currentStreak: 0, lastActive: new Date().toISOString() }
      };
      this.saveSession(profile);
      return profile;
    }

    // Local Fallback
    await new Promise(resolve => setTimeout(resolve, 600));
    const uid = 'local_user_' + btoa(email).substring(0, 10);
    const user = this.createDefaultProfile(uid, displayName || email.split('@')[0], email);
    const usersDb = this.getUsersDb();
    usersDb[uid] = user;
    this.saveUsersDb(usersDb);
    this.saveSession(user);
    return user;
  }

  async loginWithGoogle(): Promise<UserProfile> {
    if (this.afAuth && this.isFirebaseConfigured()) {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.afAuth, provider);
      const profile = await this.fetchOrCreateFirestoreUser(credential.user);
      this.saveSession(profile);
      return profile;
    }

    // Local Fallback
    await new Promise(resolve => setTimeout(resolve, 600));
    const user: UserProfile = {
      uid: 'google_user_mock_123',
      displayName: 'Alex Athlete',
      photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
      createdAt: new Date().toISOString(),
      stats: { level: 4, xp: 1450, currentStreak: 3, lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    };

    const usersDb = this.getUsersDb();
    const existing = usersDb[user.uid] || user;
    usersDb[user.uid] = existing;
    this.saveUsersDb(usersDb);
    this.saveSession(existing);
    return existing;
  }

  async logout(): Promise<void> {
    if (this.afAuth && this.isFirebaseConfigured()) {
      await signOut(this.afAuth);
    }
    this._currentUser.set(null);
    localStorage.removeItem('hebewerk_user');
  }

  updateStats(xpGained: number): UserStats {
    const user = this._currentUser();
    if (!user) throw new Error('No user logged in');

    const now = new Date();
    const lastActiveDate = new Date(user.stats.lastActive);
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

    const newXp = user.stats.xp + xpGained;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
    const oldLevel = user.stats.level;

    const updatedStats: UserStats = {
      level: newLevel,
      xp: newXp,
      currentStreak: newStreak,
      lastActive: now.toISOString()
    };

    const updatedUser: UserProfile = { ...user, stats: updatedStats };
    this.saveSession(updatedUser);

    if (newLevel > oldLevel) {
      setTimeout(() => {
        try { (window as any).triggerConfetti?.(); } catch(e) {}
      }, 100);
    }

    return updatedStats;
  }

  private getUsersDb(): Record<string, UserProfile> {
    const db = localStorage.getItem('hebewerk_users_db');
    return db ? JSON.parse(db) : {};
  }

  private saveUsersDb(db: Record<string, UserProfile>) {
    localStorage.setItem('hebewerk_users_db', JSON.stringify(db));
  }
}
