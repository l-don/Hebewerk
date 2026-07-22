import { Injectable, inject } from '@angular/core';
import { WorkoutService } from './workout.service';
import { AuthService } from './auth.service';
import { WorkoutLog, UserProfile } from '../models/gym.models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private workoutService = inject(WorkoutService);
  private authService = inject(AuthService);

  generateThreeMonthsMockData(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    const logs: WorkoutLog[] = [];
    const userId = user.uid;
    const now = new Date();

    // Start 90 days ago
    const startDate = new Date();
    startDate.setDate(now.getDate() - 90);

    // Track progressive overload factor (0.0 to 1.0)
    // 0.0 means starting strength, 1.0 means final strength
    let progression = 0;
    
    // We will generate roughly 36 workouts over 90 days (approx. one workout every 2.5 days)
    let currentDate = new Date(startDate);
    let logCounter = 1;

    while (currentDate.getTime() < now.getTime() - (12 * 60 * 60 * 1000)) { // up to 12 hours ago
      // Progress over time (0.0 at beginning, 1.0 at the end)
      const daysDiff = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      progression = daysDiff / 90;

      // Add a bit of random variation to progression to make graphs look realistic
      const waveProgression = progression + (Math.sin(logCounter * 0.8) * 0.05);
      const cappedProgression = Math.max(0, Math.min(1, waveProgression));

      // Alternate between Full Body and Upper Body plans
      const isFullBody = logCounter % 2 !== 0;

      const logDate = new Date(currentDate);
      // Randomize time of day slightly (e.g. between 17:00 and 20:00)
      logDate.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);

      const logId = `mock_log_${logCounter}`;
      
      if (isFullBody) {
        // Base weights: Squat 60kg, Bench 50kg, Row 40kg, OHP 30kg
        // Peak weights: Squat 95kg, Bench 75kg, Row 60kg, OHP 45kg
        const squatWeight = Math.round((60 + (35 * cappedProgression)) * 2) / 2;
        const benchWeight = Math.round((50 + (25 * cappedProgression)) * 2) / 2;
        const rowWeight = Math.round((40 + (20 * cappedProgression)) * 2) / 2;
        const ohpWeight = Math.round((30 + (15 * cappedProgression)) * 2) / 2;

        logs.push({
          id: logId,
          userId,
          planId: 'plan_full_body',
          planName: 'Ganzkörper Krafttraining',
          date: logDate.toISOString(),
          durationMinutes: 50 + Math.floor(Math.random() * 15),
          exercises: [
            {
              name: 'Kniebeugen (Squat)',
              sets: this.generateMockSets(3, 8, squatWeight, progression)
            },
            {
              name: 'Bankdrücken (Bench Press)',
              sets: this.generateMockSets(3, 8, benchWeight, progression)
            },
            {
              name: 'Langhantelrudern (Row)',
              sets: this.generateMockSets(3, 8, rowWeight, progression)
            },
            {
              name: 'Schulterdrücken (Overhead Press)',
              sets: this.generateMockSets(2, 10, ohpWeight, progression)
            }
          ]
        });
      } else {
        // Upper body split
        // Base weights: Pull-ups (Bodyweight/0kg), Incline DB 20kg, Lat Raise 8kg
        // Peak weights: Pull-ups (5kg added), Incline DB 30kg, Lat Raise 12kg
        const pullUpWeight = Math.round((0 + (8 * cappedProgression)) * 2) / 2;
        const inclineDbWeight = Math.round((20 + (10 * cappedProgression)) * 2) / 2;
        const latRaiseWeight = Math.round((8 + (4 * cappedProgression)) * 2) / 2;

        logs.push({
          id: logId,
          userId,
          planId: 'plan_upper_body',
          planName: 'Oberkörper Power-Split',
          date: logDate.toISOString(),
          durationMinutes: 45 + Math.floor(Math.random() * 15),
          exercises: [
            {
              name: 'Klimmzüge (Pull-ups)',
              sets: this.generateMockSets(3, 8, pullUpWeight, progression)
            },
            {
              name: 'Schrägbankdrücken (Dumbbell Press)',
              sets: this.generateMockSets(3, 10, inclineDbWeight, progression)
            },
            {
              name: 'Seitheben (Lateral Raise)',
              sets: this.generateMockSets(2, 12, latRaiseWeight, progression)
            }
          ]
        });
      }

      // Increment date by 2 or 3 days to simulate consistent routine
      const incrementDays = logCounter % 3 === 0 ? 3 : 2;
      currentDate.setDate(currentDate.getDate() + incrementDays);
      logCounter++;
    }

    // Calculate total XP gained across all mock logs
    let totalXp = 0;
    logs.forEach(log => {
      let logSets = 0;
      let logVolume = 0;

      log.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          logSets++;
          logVolume += set.reps * set.weight;
        });
      });

      const xp = Math.round((logSets * 10) + (logVolume / 100));
      log.xpGained = xp;
      totalXp += xp;
    });

    // Write all generated logs to WorkoutService
    this.workoutService.setLogs(logs);

    // Calculate final stats based on this simulation
    const finalLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;

    // Update active profile in Auth
    const updatedProfile: UserProfile = {
      ...user,
      stats: {
        level: finalLevel,
        xp: totalXp,
        currentStreak: 5, // Simulating consistency
        lastActive: new Date().toISOString()
      }
    };

    localStorage.setItem('gym_tracker_user', JSON.stringify(updatedProfile));
    
    // Quick reload session in Auth Service
    this.workoutService.initializeData();
    this.authService.loginWithEmail(user.displayName + '@gym.com', 'dummy').catch(() => {});
  }

  private generateMockSets(setCount: number, targetReps: number, weight: number, progression: number): any[] {
    const sets = [];
    for (let s = 1; s <= setCount; s++) {
      // At lower progression or end of sets, user might miss 1-2 reps occasionally
      let actualReps = targetReps;
      if (s === setCount && Math.random() > 0.6) {
        actualReps = targetReps - 1;
      } else if (s === setCount && Math.random() > 0.9) {
        actualReps = targetReps - 2;
      }

      // Prefill target values (simulating target weights)
      // Earlier workouts targets were slightly lower or equal
      const targetWeight = Math.max(0, weight - (s === 1 ? 0 : 2.5));

      sets.push({
        reps: actualReps,
        weight: weight,
        targetReps: targetReps,
        targetWeight: targetWeight
      });
    }
    return sets;
  }
}
