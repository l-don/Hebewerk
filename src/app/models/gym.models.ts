export interface UserStats {
  level: number;
  xp: number;
  currentStreak: number;
  lastActive: string; // ISO String for JSON compatibility
}

export interface UserPrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  plansVisibility: 'public' | 'friends' | 'private';
  showInSearch: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: string; // ISO String
  stats: UserStats;
  privacySettings?: UserPrivacySettings;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  restSeconds: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  exercises: Exercise[];
}

export interface LoggedSet {
  reps: number;
  weight: number;
  targetReps: number;
  targetWeight: number;
}

export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  date: string; // ISO String
  durationMinutes: number;
  exercises: LoggedExercise[];
  xpGained?: number;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted';
  updatedAt: string;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string;
  type: 'workout_completed' | 'achievement_unlocked';
  timestamp: string;
  details: {
    workoutName: string;
    xpGained: number;
    detailsString: string;
  };
}
