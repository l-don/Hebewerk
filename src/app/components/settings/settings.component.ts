import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { WorkoutService } from '../../services/workout.service';
import { MockDataService } from '../../services/mock-data.service';
import { UserPrivacySettings } from '../../models/gym.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black tracking-wider text-white font-display uppercase">Einstellungen</h1>
          <p class="text-sm text-slate-400 mt-1">Verwalte dein Konto, Privatsphäre & Daten-Optionen.</p>
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

      @if (currentUser(); as user) {
        
        <!-- SECTION 1: ACCOUNT SETTINGS -->
        <div class="hebewerk-card rounded-2xl p-6 space-y-6 border-l-4 border-l-forge-amber">
          <div class="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div class="p-2.5 rounded-xl bg-iron-950 border border-slate-800 text-forge-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white font-display uppercase">Konto & Profil</h2>
              <p class="text-xs text-slate-400">Deine persönlichen Benutzerdaten verwalten</p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-6">
            <img [src]="user.photoURL" class="w-20 h-20 rounded-2xl border-2 border-forge-amber bg-iron-950 shadow-md shrink-0" alt="Avatar" />
            <div class="space-y-1 text-center sm:text-left flex-1">
              <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Nutzer-ID</span>
              <p class="text-xs font-mono font-semibold text-slate-300 truncate max-w-xs">{{ user.uid }}</p>
              <div class="flex items-center justify-center sm:justify-start gap-3 mt-2">
                <span class="text-xs font-bold text-forge-amber font-mono">LVL {{ user.stats.level }}</span>
                <span class="text-xs text-slate-500">•</span>
                <span class="text-xs font-bold text-slate-300 font-mono">{{ user.stats.xp }} XP</span>
              </div>
            </div>
          </div>

          <!-- Edit Display Name -->
          <div class="space-y-2 pt-2">
            <label class="text-xs font-bold font-display uppercase tracking-wider text-slate-300">Anzeigename</label>
            <div class="flex gap-3">
              <input 
                type="text" 
                [(ngModel)]="editName" 
                class="flex-1 px-4 py-3 rounded-xl hebewerk-input font-bold text-white text-sm"
                placeholder="Dein Anzeigename"
              />
              <button 
                (click)="saveName()"
                class="hebewerk-btn-amber px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md shrink-0"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>

        <!-- SECTION 2: SOCIAL & PRIVACY SETTINGS -->
        <div class="hebewerk-card rounded-2xl p-6 space-y-6 border-l-4 border-l-forge-amber">
          <div class="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div class="p-2.5 rounded-xl bg-iron-950 border border-slate-800 text-forge-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white font-display uppercase">Social & Privatsphäre</h2>
              <p class="text-xs text-slate-400">Bestimme, wer deine Trainingserfolge und Pläne sehen kann</p>
            </div>
          </div>

          <!-- Profile Visibility -->
          <div class="space-y-3">
            <label class="text-xs font-bold font-display uppercase tracking-wider text-slate-300 block">Profil-Sichtbarkeit</label>
            <div class="grid grid-cols-3 gap-3">
              <button 
                (click)="privacySettings.profileVisibility = 'public'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'public' ? 'bg-forge-amber border-forge-amber text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Jeder
              </button>
              <button 
                (click)="privacySettings.profileVisibility = 'friends'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'friends' ? 'bg-forge-amber border-forge-amber text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Nur Freunde
              </button>
              <button 
                (click)="privacySettings.profileVisibility = 'private'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.profileVisibility === 'private' ? 'bg-forge-amber border-forge-amber text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Niemand
              </button>
            </div>
          </div>

          <!-- Plan Visibility -->
          <div class="space-y-3 pt-2">
            <label class="text-xs font-bold font-display uppercase tracking-wider text-slate-300 block">Standard-Sichtbarkeit neuer Pläne</label>
            <div class="grid grid-cols-3 gap-3">
              <button 
                (click)="privacySettings.plansVisibility = 'public'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'public' ? 'bg-steel-cyan border-steel-cyan text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Öffentlich
              </button>
              <button 
                (click)="privacySettings.plansVisibility = 'friends'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'friends' ? 'bg-steel-cyan border-steel-cyan text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Nur Freunde
              </button>
              <button 
                (click)="privacySettings.plansVisibility = 'private'"
                class="p-3 rounded-xl border text-xs font-bold font-display uppercase transition-all text-center"
                [ngClass]="privacySettings.plansVisibility === 'private' ? 'bg-steel-cyan border-steel-cyan text-iron-950 shadow-md font-extrabold' : 'bg-iron-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'"
              >
                Privat
              </button>
            </div>
          </div>

          <!-- Search Visibility Checkbox -->
          <div class="flex items-center justify-between p-3.5 rounded-xl bg-iron-950 border border-slate-800">
            <div>
              <span class="text-xs font-bold font-display uppercase text-white block">In Nutzersuche auffindbar</span>
              <span class="text-[11px] text-slate-400">Erlaube anderen Athleten, dich über die Suche zu finden</span>
            </div>
            <input 
              type="checkbox" 
              [(ngModel)]="privacySettings.showInSearch" 
              class="w-5 h-5 accent-forge-amber rounded cursor-pointer"
            />
          </div>

          <button 
            (click)="savePrivacy()"
            class="hebewerk-btn-amber w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md"
          >
            Privatsphäre Speichern
          </button>
        </div>

        <!-- SECTION 3: DATA MANAGEMENT & DEV TOOLS -->
        <div class="hebewerk-card rounded-2xl p-6 space-y-6 border-l-4 border-l-forge-amber">
          <div class="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div class="p-2.5 rounded-xl bg-iron-950 border border-slate-800 text-forge-amber">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white font-display uppercase">Daten-Verwaltung & Entwickler-Optionen</h2>
              <p class="text-xs text-slate-400">Testdaten generieren oder gesamten Speicher zurücksetzen</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-iron-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 class="text-sm font-bold text-white font-display uppercase">Mock-Daten Generieren</h3>
                <p class="text-xs text-slate-400 mt-1">Lädt 3 Monate realistische Test-Logs in dein Konto, um die Statistiken & Diagramme auszuprobieren.</p>
              </div>
              <button 
                (click)="generateMockData()"
                class="hebewerk-btn-cyan w-full py-3 rounded-xl text-xs uppercase tracking-wider"
              >
                Mock-Daten Laden
              </button>
            </div>

            <div class="p-4 rounded-xl bg-iron-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <h3 class="text-sm font-bold text-rose-400 font-display uppercase">Konto Zurücksetzen</h3>
                <p class="text-xs text-slate-400 mt-1">Löscht sämtliche absolvierten Einheiten, Statistiken und setzt dein Level auf LVL 1 zurück.</p>
              </div>
              <button 
                (click)="resetAllData()"
                class="w-full py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-400 font-display font-extrabold text-xs uppercase tracking-wider transition-all"
              >
                Alles Zurücksetzen (Reset)
              </button>
            </div>
          </div>
        </div>

      }

    </div>
  `,
  styles: []
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private workoutService = inject(WorkoutService);
  private mockDataService = inject(MockDataService);

  currentUser = this.authService.currentUser;
  toastMessage = signal<string | null>(null);

  editName = '';
  privacySettings: UserPrivacySettings = {
    profileVisibility: 'public',
    plansVisibility: 'public',
    showInSearch: true
  };

  ngOnInit() {
    const user = this.currentUser();
    if (user) {
      this.editName = user.displayName;
      if (user.privacySettings) {
        this.privacySettings = { ...user.privacySettings };
      }
    }
  }

  saveName() {
    if (!this.editName.trim()) return;
    this.authService.updateDisplayName(this.editName.trim());
    this.showToast('Anzeigename erfolgreich geändert!');
  }

  savePrivacy() {
    this.authService.updatePrivacySettings(this.privacySettings);
    this.showToast('Privatsphäre-Einstellungen gespeichert!');
  }

  generateMockData() {
    this.mockDataService.generateThreeMonthsMockData();
    this.showToast('3 Monate Test-Trainingsdaten geladen!');
  }

  resetAllData() {
    if (confirm('Bist du sicher, dass du alle absolvierten Workouts und Statistiken zurücksetzen möchtest?')) {
      this.workoutService.clearLogs();
      this.showToast('Sämtliche Daten wurden zurückgesetzt.');
    }
  }

  private showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 4000);
  }
}
