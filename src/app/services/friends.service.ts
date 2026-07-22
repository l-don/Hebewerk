import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDocs, getDoc, query, where, updateDoc, deleteDoc, onSnapshot } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { WorkoutService } from './workout.service';
import { UserProfile, Friendship, WorkoutPlan } from '../models/gym.models';
import { environment } from '../../environments/environment';

export interface PendingRequestDetail {
  friendshipId: string;
  requester: UserProfile;
  updatedAt: string;
}

export interface SentRequestDetail {
  friendshipId: string;
  recipient: UserProfile;
  status: 'pending' | 'accepted';
  updatedAt: string;
}

export interface FriendWithPlans {
  profile: UserProfile;
  publicPlans: WorkoutPlan[];
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private authService = inject(AuthService);
  private workoutService = inject(WorkoutService);
  private firestore = inject(Firestore, { optional: true });

  private unsub1: (() => void) | null = null;
  private unsub2: (() => void) | null = null;

  // Signals
  private _friends = signal<FriendWithPlans[]>([]);
  readonly friends = computed(() => this._friends());

  private _pendingRequests = signal<PendingRequestDetail[]>([]);
  readonly pendingRequests = computed(() => this._pendingRequests());

  private _sentRequests = signal<SentRequestDetail[]>([]);
  readonly sentRequests = computed(() => this._sentRequests());

  private _searchResults = signal<UserProfile[]>([]);
  readonly searchResults = computed(() => this._searchResults());

  constructor() {
    this.initializeData();
    effect(() => {
      const user = this.authService.currentUser();
      if (user && !user.uid.startsWith('local_')) {
        this.initializeData();
      }
    });
  }

  private isFirebaseConfigured(): boolean {
    return !!(environment.firebase.apiKey && environment.firebase.apiKey !== 'YOUR_FIREBASE_API_KEY');
  }

  async initializeData() {
    const user = this.authService.currentUser();
    const userId = user ? user.uid : 'local_guest';

    // Clean previous subscriptions if re-initializing
    if (this.unsub1) { this.unsub1(); this.unsub1 = null; }
    if (this.unsub2) { this.unsub2(); this.unsub2 = null; }

    if (this.firestore && this.isFirebaseConfigured() && user && !user.uid.startsWith('local_')) {
      try {
        const friendsRef = collection(this.firestore, 'friends');

        const q1 = query(friendsRef, where('user1Id', '==', userId));
        const q2 = query(friendsRef, where('user2Id', '==', userId));

        const processFriendships = async (allFriendships: Friendship[]) => {
          const acceptedFriends: FriendWithPlans[] = [];
          const pending: PendingRequestDetail[] = [];
          const sent: SentRequestDetail[] = [];

          for (const f of allFriendships) {
            const otherUserId = f.user1Id === userId ? f.user2Id : f.user1Id;

            if (f.status === 'accepted') {
              const friendProfile = await this.fetchUserProfile(otherUserId);
              if (friendProfile) {
                const publicPlans = await this.fetchUserPublicPlans(otherUserId);
                acceptedFriends.push({ profile: friendProfile, publicPlans });
              }
            } else if (f.status === 'pending') {
              if (f.user2Id === userId) {
                // Incoming request to current user
                const requesterProfile = await this.fetchUserProfile(f.user1Id);
                if (requesterProfile) {
                  pending.push({
                    friendshipId: f.id,
                    requester: requesterProfile,
                    updatedAt: f.updatedAt
                  });
                }
              } else if (f.user1Id === userId) {
                // Outgoing request sent by current user
                const recipientProfile = await this.fetchUserProfile(f.user2Id);
                if (recipientProfile) {
                  sent.push({
                    friendshipId: f.id,
                    recipient: recipientProfile,
                    status: f.status,
                    updatedAt: f.updatedAt
                  });
                }
              }
            }
          }

          this._friends.set(acceptedFriends);
          this._pendingRequests.set(pending);
          this._sentRequests.set(sent);
        };

        // Live real-time listeners with onSnapshot
        let list1: Friendship[] = [];
        let list2: Friendship[] = [];

        this.unsub1 = onSnapshot(q1, snap => {
          list1 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
          processFriendships([...list1, ...list2]);
        });

        this.unsub2 = onSnapshot(q2, snap => {
          list2 = snap.docs.map(d => ({ id: d.id, ...d.data() } as Friendship));
          processFriendships([...list1, ...list2]);
        });

        return;
      } catch (e) {
        console.warn('Firestore friends load failed, falling back to local mock', e);
      }
    }

    // Fallback Mock Data for local testing
    this.setMockData(userId);
  }

  private async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    if (!this.firestore) return null;
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const snap = await getDoc(userDocRef);
      return snap.exists() ? (snap.data() as UserProfile) : null;
    } catch (e) {
      return null;
    }
  }

  private async fetchUserPublicPlans(uid: string): Promise<WorkoutPlan[]> {
    if (!this.firestore) return [];
    try {
      const plansRef = collection(this.firestore, 'workout_plans');
      const q = query(plansRef, where('userId', '==', uid), where('isPublic', '==', true));
      const snap = await getDocs(q);
      const plans: WorkoutPlan[] = [];
      snap.forEach(d => plans.push(d.data() as WorkoutPlan));
      return plans;
    } catch (e) {
      return [];
    }
  }

  private setMockData(userId: string) {
    const mockFriends: FriendWithPlans[] = [
      {
        profile: {
          uid: 'mock_friend_sarah',
          displayName: 'Sarah Strong',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          stats: {
            level: 6,
            xp: 2890,
            currentStreak: 4,
            lastActive: new Date().toISOString()
          }
        },
        publicPlans: [
          {
            id: 'plan_sarah_glute',
            userId: 'mock_friend_sarah',
            name: 'Sarahs Beine & Po Focus',
            description: 'Intensiver Unterkörper-Plan für maximale Kraftsteigerung.',
            isPublic: true,
            exercises: [
              {
                id: 'ex_hip_thrust',
                name: 'Hip Thrust (Langhantel)',
                sets: [
                  { reps: 10, weight: 80, restSeconds: 90 },
                  { reps: 10, weight: 85, restSeconds: 90 },
                  { reps: 8, weight: 90, restSeconds: 120 }
                ]
              }
            ]
          }
        ]
      }
    ];

    const mockPending: PendingRequestDetail[] = [
      {
        friendshipId: 'req_elena_123',
        requester: {
          uid: 'mock_user_elena',
          displayName: 'Elena Cross',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Elena',
          createdAt: new Date().toISOString(),
          stats: {
            level: 3,
            xp: 920,
            currentStreak: 2,
            lastActive: new Date().toISOString()
          }
        },
        updatedAt: new Date().toISOString()
      }
    ];

    const mockSent: SentRequestDetail[] = [
      {
        friendshipId: 'req_sent_max',
        recipient: {
          uid: 'mock_user_max',
          displayName: 'Max Power',
          photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
          createdAt: new Date().toISOString(),
          stats: { level: 4, xp: 1500, currentStreak: 3, lastActive: new Date().toISOString() }
        },
        status: 'pending',
        updatedAt: new Date().toISOString()
      }
    ];

    this._friends.set(mockFriends);
    this._pendingRequests.set(mockPending);
    this._sentRequests.set(mockSent);
  }

  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      this._searchResults.set([]);
      return [];
    }

    const qLower = searchQuery.toLowerCase().trim();
    const currentUser = this.authService.currentUser();

    if (this.firestore && this.isFirebaseConfigured()) {
      try {
        const usersRef = collection(this.firestore, 'users');
        const snap = await getDocs(usersRef);
        const results: UserProfile[] = [];

        snap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.uid !== currentUser?.uid) {
            if (u.displayName?.toLowerCase().includes(qLower)) {
              results.push(u);
            }
          }
        });

        this._searchResults.set(results);
        return results;
      } catch (e) {
        console.warn('Firestore search failed', e);
      }
    }

    const mockDb: UserProfile[] = [
      {
        uid: 'search_user_tom',
        displayName: 'Tom Lift',
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Tom',
        createdAt: new Date().toISOString(),
        stats: { level: 5, xp: 2100, currentStreak: 3, lastActive: new Date().toISOString() }
      },
      {
        uid: 'search_user_lisa',
        displayName: 'Lisa Fit',
        photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lisa',
        createdAt: new Date().toISOString(),
        stats: { level: 7, xp: 3400, currentStreak: 5, lastActive: new Date().toISOString() }
      }
    ];

    const filtered = mockDb.filter(u => u.displayName.toLowerCase().includes(qLower));
    this._searchResults.set(filtered);
    return filtered;
  }

  async sendFriendRequest(targetUserId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    const friendshipId = `friendship_${user.uid}_${targetUserId}`;
    const newFriendship: Friendship = {
      id: friendshipId,
      user1Id: user.uid,
      user2Id: targetUserId,
      status: 'pending',
      updatedAt: new Date().toISOString()
    };

    if (this.firestore && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(this.firestore, `friends/${friendshipId}`);
        await setDoc(docRef, newFriendship);
      } catch (e) {
        console.warn('Firestore sendFriendRequest failed', e);
      }
    } else {
      // Local optimistic update for sent requests
      const recipient = this._searchResults().find(u => u.uid === targetUserId);
      if (recipient) {
        this._sentRequests.update(list => [
          ...list,
          {
            friendshipId,
            recipient,
            status: 'pending',
            updatedAt: new Date().toISOString()
          }
        ]);
      }
    }

    this._searchResults.update(list => list.filter(u => u.uid !== targetUserId));
  }

  async acceptFriendRequest(friendshipId: string): Promise<void> {
    const requestItem = this._pendingRequests().find(r => r.friendshipId === friendshipId);

    if (this.firestore && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(this.firestore, `friends/${friendshipId}`);
        await updateDoc(docRef, { status: 'accepted', updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Firestore acceptFriendRequest failed', e);
      }
    }

    if (requestItem) {
      const friendWithPlans: FriendWithPlans = {
        profile: requestItem.requester,
        publicPlans: []
      };
      this._friends.update(current => [friendWithPlans, ...current]);
      this._pendingRequests.update(list => list.filter(r => r.friendshipId !== friendshipId));
    }
  }

  async declineFriendRequest(friendshipId: string): Promise<void> {
    if (this.firestore && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(this.firestore, `friends/${friendshipId}`);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore declineFriendRequest failed', e);
      }
    }

    this._pendingRequests.update(list => list.filter(r => r.friendshipId !== friendshipId));
  }

  async cancelSentRequest(friendshipId: string): Promise<void> {
    if (this.firestore && this.isFirebaseConfigured()) {
      try {
        const docRef = doc(this.firestore, `friends/${friendshipId}`);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore cancelSentRequest failed', e);
      }
    }

    this._sentRequests.update(list => list.filter(r => r.friendshipId !== friendshipId));
  }

  copyPlanToMyPlans(plan: WorkoutPlan): void {
    const copiedPlan: WorkoutPlan = {
      ...JSON.parse(JSON.stringify(plan)),
      id: 'plan_copy_' + Math.random().toString(36).substring(2, 9),
      userId: '',
      name: `${plan.name} (Kopie)`,
      isPublic: false
    };

    this.workoutService.savePlan(copiedPlan);
  }
}
